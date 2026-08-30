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

  const clientId = process.env.LETTERBOXD_CLIENT_ID;
  const clientSecret = process.env.LETTERBOXD_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Letterboxd credentials are not configured." }, { status: 500 });
  }

  const redirectUri = `${protocol}//${host}/api/auth/letterboxd/callback`;

  try {
    // Assuming standard OAuth 2.0 endpoint for token exchange
    const tokenResponse = await fetch("https://api.letterboxd.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
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
        letterboxdToken: data.access_token,
        letterboxdRefreshToken: data.refresh_token,
      }
    });

    // Redirect back to settings page with a success parameter
    return NextResponse.redirect(`${protocol}//${host}/settings?integration_success=letterboxd`);
  } catch (error) {
    console.error("Letterboxd OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
