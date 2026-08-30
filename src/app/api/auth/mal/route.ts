import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.MAL_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "MAL Client ID is missing" }, { status: 500 });

  const { protocol, host } = new URL(request.url);
  const redirectUri = `${protocol}//${host}/api/auth/mal/callback`;

  // Provide a random state string in production
  const authUrl = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=placeholder_challenge`;
  
  return NextResponse.redirect(authUrl);
}
