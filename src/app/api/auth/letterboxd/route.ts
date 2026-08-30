import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.LETTERBOXD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Letterboxd Client ID is not configured in environment variables." }, { status: 500 });
  }

  // Determine host for the redirect_uri
  const { protocol, host } = new URL(request.url);
  const redirectUri = `${protocol}//${host}/api/auth/letterboxd/callback`;

  // Letterboxd OAuth authorization URL (following standard OAuth 2.0 pattern)
  const authUrl = `https://api.letterboxd.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return NextResponse.redirect(authUrl);
}
