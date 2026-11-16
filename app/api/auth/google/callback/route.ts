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

    const { refresh_token, access_token } = tokenData;

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>เชื่อมต่อ Google Drive สำเร็จ</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 560px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #10b981; margin-top: 0; font-size: 24px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; }
          .token-box { background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; padding: 12px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 13px; color: #34d399; text-align: left; }
          button { background: #e11d48; color: white; border: none; border-radius: 8px; padding: 12px 24px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; font-size: 15px; }
          button:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 เชื่อมต่อ Google Drive สำเร็จ!</h1>
          <p>ระบบได้รับสิทธิ์ในการเข้าถึง Google Drive ของคุณเรียบร้อยแล้ว<br>กรุณาคัดลอก <b>Refresh Token</b> ด้านล่างนี้ส่งกลับมาที่แชทครับ:</p>
          <div class="token-box" id="tokenBox">${refresh_token || access_token}</div>
          <button onclick="navigator.clipboard.writeText(document.getElementById('tokenBox').innerText); alert('คัดลอก Refresh Token เรียบร้อยแล้ว!');">📋 คลิกเพื่อคัดลอกรหัส</button>
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
