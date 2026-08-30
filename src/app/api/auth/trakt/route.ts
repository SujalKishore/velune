import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.TRAKT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Trakt Client ID is not configured in environment variables." }, { status: 500 });
  }

  // Determine host for the redirect_uri
  const { protocol, host } = new URL(request.url);
  const redirectUri = `${protocol}//${host}/api/auth/trakt/callback`;

  // Trakt OAuth authorization URL
  const authUrl = `https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return NextResponse.redirect(authUrl);
}
