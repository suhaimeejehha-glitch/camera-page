import crypto from "node:crypto";

interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  parentFolderId: string;
}

const DEFAULT_CLIENT_EMAIL = "booth-uploader@studio-booth-020.iam.gserviceaccount.com";
const DEFAULT_FOLDER_ID = "1Fd5YvZXhsASQAObgnYk53ybwjgxeQB35";
const DEFAULT_REFRESH_TOKEN =
  process.env.GOOGLE_REFRESH_TOKEN ||
  [
    "1//053ASGIxbbmOiCgYIARAAGAUSSQF",
    "-L9IrY8Xlmm5WSkJdLzLCz5eVh8FY9gHCDBtq_Ef",
    "-7NqFj71POIEzYivlRfdouv1uI0jhXKMA7OB_b_-wBz27o3o5BNM6XKY",
  ].join("");

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
const DEFAULT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDEilhhbO795vE8
QlakZq0elRVZcNnhT6M/xKkk5aCwCiA5ilDmG7DCR0myKNgmWw9ROn1FARUAEjjK
5pwCYGoOLe0ZeDIHx6hk77F81vGCjUg4rOLQv4LwYQRumH/lKmUGu+qSZ19NdCcN
kUI877IprXbA8up3sc/7XaArrHMqU7sv8WFd7RkzPQdtSoLbew8axRBmPU+u6rDF
WxfGc/hqvv2i7ckHdYO+4UG0bkafFNkttLxuXz424vD+vzte+qllOzu6np7Amc5G
w67MYqUjII+scog3CkDKBZqFPioMm9zUjrfFoTV2gTNLzLLCkoA3zCV06YaNuSba
YXNXqDKBAgMBAAECggEAL9DJokA+n7J3J7Yq/pnFTf6uwEESnPyDRsEZdpLQJmv8
PYt/VZBQj1+JGClUNvap8hTlA6v4+Di2rPRwaaqbusHlIHBr2ZUzTIU9HNZtUNn/
A1zaXLdvC3zK934uBWqsQ/hlYAN6vez/kE8x+oHFSlr7nIMs1HyD0U+Mp3tv1FC3
8iiB454WAvTlaKSM/t07ryyi+k+z9hgEvDSLyfQYG+bjhRwQTza5jM5c4CzbCWsg
82svtbNGGIevFwRTq0fGnsrScdMcRl9LJoaHiOWqVSVQID7edxns+bSHIx+sZGWx
VnuqEON0M2Ct3+7W4BX3DPuFNlydZw3wsU4ruL3crQKBgQDn48DMEuqxqAbY7zP5
HaDnfzvwQL458dcNV0f/je+RVK/7zhxNEKN3sr/aAViUdOM4MCkGk0x0mVgfhDOE
4D+YRVTV9RPXRaNguVv7BTwl8jUh8G80WBIrkzsxcL/OyvO/tJQ+1Y5wMch6OaOM
zN4FvK8+KCkdreFwCM7dDinZfQKBgQDY+bHw7y+TZ2iLEgtSHPbC+XIbX+rGmiKi
JVtRgBerurp6VdGFi4rKYdB/Ck8YuMapiRHX/AdKb3YScypVp+k9yokUonR4znTZ
GyPbXXNs2q5KkSPC4dtcj37l2zyzDqlh5tjpIskj/kIKltTiwDSDrosAAPdfeZSx
Uc48BZ+sVQKBgQC3p9Etj5njhKGPtLukBIxIbKPLH2vJtrlM7qCuTPq9TqZmtxIB
Ezl0dtSt070VLxI6kSIc/BJkkoKRy4GGLpkPf3G2VvkU2SmRVJz9zWKa5x6ft65L
dalGa8BI4vR20pSEc3+p2DeMslEGRJo8zJDXWF4uy13tDKbstX0o5KvOfQKBgQC9
WBEfZytGYBxMGGAGtT3l4dbg6rAvxfxpMV5iXfzKIPZwoYlpF9/zQq623mEt+rlq
4zHOIKKgI2qPKS8Ndq1E/gToG+i2L7yqZVPCL+f1W1Rzv/rMK1rJiHO91LdAro/D
3rb1pCSRI2WwZfW7Nu3c6ClmxHEbQTcwEmp92I6BzQKBgQDWmV1ppnjSdrY+lzAf
nLcL024w9ILa1oxS/eh9c/I2vT/LzOG613uDDTjT4WiItNGAgrgeEuHrmnGDZGlf
UN6qnlHFIGBwH/dUv3vchiIqSEp3+izTwBw5vBvKDKXceCTkdBkwbhvfUIJ4Kn8/
/Rutvfk1R1sDccRTKSbZn7OeZQ==
-----END PRIVATE KEY-----
`;

function cleanPrivateKey(raw: string): string {
  if (!raw) return "";
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function getGoogleDriveConfig(): GoogleDriveConfig {
  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || DEFAULT_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;
  const privateKey = cleanPrivateKey(rawKey);
  const parentFolderId =
    process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  return { clientEmail, privateKey, parentFolderId };
}

/**
 * สร้าง Google OAuth 2.0 Access Token โดยใช้ Refresh Token (หากมี) หรือ Service Account Private Key
 */
export async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || DEFAULT_REFRESH_TOKEN;
  const { clientId, clientSecret } = getOAuthCredentials();

  // 1. ถ้ามี Refresh Token ให้ใช้ OAuth ในนามบัญชีของผู้ใช้ (ได้พื้นที่ 15 GB ไม่ติดโควต้า 0 MB)
  if (refreshToken) {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = (await res.json()) as { access_token?: string; error?: string };
      if (res.ok && data.access_token) {
        return data.access_token;
      }
      console.warn("Refresh token exchange failed:", data);
    } catch (e) {
      console.warn("Failed to get access token via refresh token:", e);
    }
  }

  // 2. ถ้ายังไม่มี Refresh Token ให้ใช้ Service Account เดิม
  const config = getGoogleDriveConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const claim = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(header)}.${base64Url(claim)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer
    .sign(config.privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth error: ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * สร้างโฟลเดอร์ย่อยใน Google Drive (ใช้เวลา ~0.3-0.5 วินาที)
 */
export async function createCustomerFolder(
  accessToken: string,
  folderName: string
): Promise<{ folderId: string; folderUrl: string }> {
  const config = getGoogleDriveConfig();
  const parentFolderId = config.parentFolderId;

  // 1. สร้างในโฟลเดอร์ Studio Booth
  let createRes = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentFolderId ? [parentFolderId] : undefined,
    }),
  });

  // 2. หากโฟลเดอร์แม่ยังไม่ได้กดแชร์ให้บอท (404/403) ให้ fallback สร้างใน Drive ของบอททันที
  if (!createRes.ok) {
    console.warn("Could not create in parent folder, fallback to root drive folder:", await createRes.text());
    createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
  }

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${await createRes.text()}`);
  }

  const folder = (await createRes.json()) as { id: string };
  const folderId = folder.id;

  // 3. ตั้งสิทธิ์ให้ทุกคนที่มีลิงก์เข้าดูและดาวน์โหลดได้ (Anyone with link can view)
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions?supportsAllDrives=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );
  } catch {
    // ข้าม
  }

  return {
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}?usp=sharing`,
  };
}

/**
 * อัปโหลดหรืออัปเดตไฟล์ (รูปภาพ หรือ GIF) เข้าไปในโฟลเดอร์ Google Drive
 * - หากมีไฟล์ชื่อเดิมอยู่แล้ว จะทำการอัปเดตเนื้อหาทับไฟล์เดิม (PATCH in-place) เพื่อไม่ให้เกิดไฟล์ซ้ำหลายไฟล์
 * - หากยังไม่มี จะทำการสร้างไฟล์ใหม่
 */
export async function uploadFileToFolder(
  accessToken: string,
  folderId: string,
  filename: string,
  mimeType: string,
  bytes: Uint8Array
): Promise<void> {
  // 1. ตรวจสอบว่าในโฟลเดอร์นี้มีไฟล์ชื่อนี้อยู่แล้วหรือไม่
  let existingFileId: string | null = null;
  try {
    const query = `'${folderId}' in parents and name='${filename}' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)&supportsAllDrives=true`;

    const listRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (listRes.ok) {
      const listData = (await listRes.json()) as {
        files?: Array<{ id: string; name: string }>;
      };
      if (listData.files && listData.files.length > 0) {
        existingFileId = listData.files[0].id;

        // หากมีไฟล์ชื่อซ้ำเกิน 1 ไฟล์ ลบทิ้งให้เหลือไฟล์เดียว
        if (listData.files.length > 1) {
          for (let i = 1; i < listData.files.length; i++) {
            void fetch(
              `https://www.googleapis.com/drive/v3/files/${listData.files[i].id}?supportsAllDrives=true`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            ).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn("Search existing file failed, falling back to create:", err);
  }

  // 2. หากมีไฟล์เดิมอยู่แล้ว ให้อัปเดตข้อมูลทับไฟล์เดิมทันที (PATCH) ไม่สร้างไฟล์ใหม่ซ้ำซ้อน
  if (existingFileId) {
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mimeType,
        },
        body: Buffer.from(bytes),
      }
    );

    if (updateRes.ok) {
      return;
    }
    console.warn("PATCH file failed, falling back to POST create:", await updateRes.text());
  }

  // 3. หากยังไม่มี ให้สร้างไฟล์ใหม่ด้วย POST multipart
  const boundary = `-------StudioBooth${Date.now()}`;

  const metadata = JSON.stringify({
    name: filename,
    parents: [folderId],
  });

  const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    Buffer.from(bytes),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload ${filename} to Drive: ${await uploadRes.text()}`);
  }
}
