import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams, protocol, host } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });
  }

  const clientId = process.env.TRAKT_CLIENT_ID;
  const clientSecret = process.env.TRAKT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Trakt credentials are not configured." }, { status: 500 });
  }

  const redirectUri = `${protocol}//${host}/api/auth/trakt/callback`;

  try {
    const tokenResponse = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Velune App",
        "trakt-api-version": "2",
        "trakt-api-key": clientId
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Failed to exchange token", details: data }, { status: 500 });
    }

    // Save token to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        traktToken: data.access_token,
        traktRefreshToken: data.refresh_token,
      }
    });

    // Set the traktSync setting to true in cookies/db conceptually, but the UI handles it via localStorage
    // Redirect back to settings page with a success parameter
    return NextResponse.redirect(`${protocol}//${host}/settings?integration_success=trakt`);
  } catch (error) {
    console.error("Trakt OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
