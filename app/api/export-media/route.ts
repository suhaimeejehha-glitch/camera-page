import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { saveExportFile } from "@/lib/mediaFiles";

// อัปโหลดไฟล์ไปยัง Cloud ชั่วคราว (ฟรี ไม่ต้องใช้ API key, ไฟล์หมดอายุอัตโนมัติ)
// เพื่อให้โทรศัพท์มือถือที่สแกน QR Code สามารถเปิดดูและดาวน์โหลดรูปได้ 100% จากทุกที่
async function uploadToCloud(file: File, filename: string): Promise<string | null> {
  // ทางเลือกที่ 1: Litterbox (Catbox) - เก็บไฟล์ได้ 24 ชั่วโมง, ลิงก์ตรงความเร็วสูง
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "24h");
    formData.append("fileToUpload", file, filename);

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const url = await res.text();
      if (url.startsWith("http")) {
        return url.trim();
      }
    }
  } catch (err) {
    console.warn("Litterbox upload failed, trying fallback:", err);
  }

  // ทางเลือกที่ 2: Tmpfiles.org - เก็บไฟล์ 1 ชั่วโมง
  try {
    const formData = new FormData();
    formData.append("file", file, filename);

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = (await res.json()) as { data?: { url?: string } };
      if (data?.data?.url) {
        // เปลี่ยนจากหน้าเว็บพรีวิวเป็น direct download link
        return data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
      }
    }
  } catch (err) {
    console.warn("Tmpfiles upload failed:", err);
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

    // บันทึกลงเครื่อง/เซิร์ฟเวอร์สำรองไว้เสมอ
    await saveExportFile(filename, bytes);

    // อัปโหลดขึ้น Cloud เพื่อให้มือถือสแกนดูได้ทันที
    const cloudUrl = await uploadToCloud(file, filename);

    return NextResponse.json({
      filename,
      // หากอัปโหลดขึ้น Cloud ได้ ให้ใช้ Cloud URL หากไม่ได้ให้ fallback ใช้ path ในระบบ
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
