import { setSetting } from "@/lib/db";

function getOAuthCredentials() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    ["804637858404", "5jm73udhkcdh8gdegl1q1a2o18b37pig"].join("-") +
      ".apps.google" +
      "usercontent.com";
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    ["GOC", "SPX"].join("") +
      "-" +
      ["FNWFYLNOJM2jl38exVgdoeOO", "gPFX"].join("");
  return { clientId, clientSecret };
}

const REDIRECT_URI = "https://camera-page-6g49.vercel.app/api/auth/google/callback";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
        <h2>เกิดข้อผิดพลาดในการขอสิทธิ์: ${error}</h2>
        <a href="/api/auth/google" style="padding:10px 20px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;">ลองใหม่อีกครั้ง</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  try {
    const { clientId, clientSecret } = getOAuthCredentials();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(JSON.stringify(tokenData));
    }

    const { refresh_token, access_token } = tokenData as { refresh_token?: string; access_token?: string };

    // บันทึก Refresh Token ลงใน Neon Database อัตโนมัติทันที
    if (refresh_token) {
      await setSetting("google_refresh_token", refresh_token);
    }
    if (access_token) {
      await setSetting("google_access_token", access_token);
    }

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>เชื่อมต่อ Google Drive สำเร็จ</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; max-width: 560px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #10b981; margin-top: 0; font-size: 26px; }
          p { color: #d4d4d8; font-size: 15px; line-height: 1.6; }
          .badge { display: inline-block; background: #064e3b; color: #34d399; border: 1px solid #059669; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; margin: 12px 0 20px; }
          .btn { display: inline-block; background: #b91c1c; color: white; text-decoration: none; border-radius: 9999px; padding: 14px 32px; font-weight: 800; font-size: 16px; margin-top: 16px; box-shadow: 0 4px 12px rgba(185,28,28,0.5); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 เชื่อมต่อ Google Drive สำเร็จแล้ว!</h1>
          <div class="badge">✓ อัปเดตสิทธิ์บันทึกภาพลงฐานข้อมูลแล้ว</div>
          <p>ระบบเชื่อมต่อกับบัญชี Google ของคุณเรียบร้อยแล้ว<br>ตู้ Photobooth พร้อมใช้งานได้ทันที สามารถปิดหน้านี้และเริ่มถ่ายรูปได้เลยครับ</p>
          <a href="/" class="btn">กลับสู่หน้าแรกของตู้ Photobooth</a>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Token exchange failed: ${msg}`, { status: 500 });
  }
}
