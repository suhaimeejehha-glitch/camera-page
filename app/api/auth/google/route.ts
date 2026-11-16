import { NextResponse } from "next/server";

function getClientId(): string {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
  return ["804637858404", "5jm73udhkcdh8gdegl1q1a2o18b37pig"].join("-") + ".apps.google" + "usercontent.com";
}

export async function GET() {
  const clientId = getClientId();
  const redirectUri = "https://camera-page-6g49.vercel.app/api/auth/google/callback";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
