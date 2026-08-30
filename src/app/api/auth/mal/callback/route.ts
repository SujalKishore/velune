import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams, protocol, host } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });

  const clientId = process.env.MAL_CLIENT_ID;
  const clientSecret = process.env.MAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: "MAL credentials missing." }, { status: 500 });

  const redirectUri = `${protocol}//${host}/api/auth/mal/callback`;

  try {
    const tokenResponse = await fetch("https://myanimelist.net/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: "placeholder_challenge"
      })
    });

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Failed to exchange token", details: data }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { malToken: data.access_token, malRefreshToken: data.refresh_token }
    });

    return NextResponse.redirect(`${protocol}//${host}/settings?integration_success=mal`);
  } catch (error) {
    console.error("MAL OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
