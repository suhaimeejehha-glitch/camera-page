import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { saveExportFile } from "@/lib/mediaFiles";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * อัปโหลดไฟล์ไปยัง Cloud สาธารณะ (ฟรี ไม่ต้องใช้ API key)
 * มีระบบ Fallback 3 ชั้น เพื่อให้มั่นใจ 100% ว่ามือถือจะเปิดดูและโหลดรูปได้
 */
async function uploadToCloud(
  bytes: Uint8Array,
  filename: string,
  kind: "png" | "gif"
): Promise<string | null> {
  const mimeType = kind === "gif" ? "image/gif" : "image/png";

  // ทางเลือกที่ 1: FreeImage.host (Chevereto Open API) - เสถียรและเร็วที่สุดสำหรับรูปภาพและ GIF
  try {
    const base64 = Buffer.from(bytes).toString("base64");
    const params = new URLSearchParams();
    params.append("key", "6d207e02198a847aaa93d42226e7e40e");
    params.append("action", "upload");
    params.append("source", base64);
    params.append("format", "json");

    const res = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      headers: {
        "User-Agent": BROWSER_UA,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(12000),
    });

    if (res.ok) {
      const data = (await res.json()) as { image?: { url?: string; display_url?: string } };
      if (data?.image?.url) {
        return data.image.url;
      }
    }
  } catch (err) {
    console.warn("FreeImage upload failed:", err);
  }

  // ทางเลือกที่ 2: Transfer.sh - รับ binary โดยตรง ไม่ติดบล็อก User-Agent
  try {
    const res = await fetch(`https://transfer.sh/${filename}`, {
      method: "PUT",
      headers: {
        "User-Agent": BROWSER_UA,
        "Content-Type": mimeType,
      },
      body: Buffer.from(bytes),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("http")) {
        return url;
      }
    }
  } catch (err) {
    console.warn("Transfer.sh upload failed:", err);
  }

  // ทางเลือกที่ 3: Litterbox (Catbox) พร้อม User-Agent เพื่อป้องกันโดนบล็อก
  try {
    const blob = new Blob([Buffer.from(bytes)], { type: mimeType });
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "24h");
    formData.append("fileToUpload", blob, filename);

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      headers: {
        "User-Agent": BROWSER_UA,
      },
      body: formData,
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("http")) {
        return url;
      }
    }
  } catch (err) {
    console.warn("Litterbox upload failed:", err);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind") === "gif" ? "gif" : "png";

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์สำหรับสร้างลิงก์ QR Code" },
        { status: 400 }
      );
    }

    const id = crypto.randomBytes(6).toString("hex");
    const prefix = kind === "gif" ? "gif" : "photo";
    const filename = `${prefix}-${id}.${kind}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    // บันทึกลงเซิร์ฟเวอร์สำรองไว้เสมอ
    await saveExportFile(filename, bytes);

    // อัปโหลดขึ้น Cloud
    const cloudUrl = await uploadToCloud(bytes, filename, kind);

    return NextResponse.json({
      filename,
      urlPath: cloudUrl ?? `/api/media/${filename}`,
      isCloud: Boolean(cloudUrl),
    });
  } catch (error) {
    console.error("Failed to save media export:", error);
    return NextResponse.json(
      { error: "สร้างไฟล์สำหรับ QR Code ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
