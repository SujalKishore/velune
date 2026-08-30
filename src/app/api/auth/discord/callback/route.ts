import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams, protocol, host } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: "Discord credentials missing." }, { status: 500 });

  const redirectUri = `${protocol}//${host}/api/auth/discord/callback`;

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

    // Now get the user's Discord ID
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { "Authorization": `Bearer ${data.access_token}` }
    });
    
    let discordId = null;
    if (userResponse.ok) {
      const userData = await userResponse.json();
      discordId = userData.id;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        discordToken: data.access_token, 
        discordRefreshToken: data.refresh_token,
        discordId: discordId
      }
    });

    return NextResponse.redirect(`${protocol}//${host}/settings?integration_success=discord`);
  } catch (error) {
    console.error("Discord OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
