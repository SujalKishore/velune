import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.SIMKL_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Simkl Client ID is missing" }, { status: 500 });

  const { protocol, host } = new URL(request.url);
  const redirectUri = `${protocol}//${host}/api/auth/simkl/callback`;

  const authUrl = `https://simkl.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return NextResponse.redirect(authUrl);
}
