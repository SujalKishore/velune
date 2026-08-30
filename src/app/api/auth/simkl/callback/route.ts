import { NextResponse } from "next/server";
import { getSessionUserId } from "@/app/actions/history";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams, protocol, host } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No authorization code provided." }, { status: 400 });

  const clientId = process.env.SIMKL_CLIENT_ID;
  const clientSecret = process.env.SIMKL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: "Simkl credentials missing." }, { status: 500 });

  const redirectUri = `${protocol}//${host}/api/auth/simkl/callback`;

  try {
    const tokenResponse = await fetch("https://api.simkl.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    await prisma.user.update({
      where: { id: userId },
      data: { simklToken: data.access_token }
    });

    return NextResponse.redirect(`${protocol}//${host}/settings?integration_success=simkl`);
  } catch (error) {
    console.error("Simkl OAuth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
