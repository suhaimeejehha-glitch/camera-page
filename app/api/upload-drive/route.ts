import { NextResponse } from "next/server";
import {
  getAccessToken,
  createCustomerFolder,
  uploadFileToFolder,
} from "@/lib/googleDrive";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let action: string | null = null;
    let folderId: string | null = null;
    let photoFile: File | null = null;
    let gifFile: File | null = null;
    let videoFile: File | null = null;

    if (contentType.includes("application/json")) {
      const json = await request.json();
      action = json.action || null;
      folderId = json.folderId || null;
    } else {
      const formData = await request.formData();
      action = (formData.get("action") as string) || null;
      folderId = (formData.get("folderId") as string) || null;
      const p = formData.get("photo");
      if (p instanceof File && p.size > 0) photoFile = p;
      const g = formData.get("gif");
      if (g instanceof File && g.size > 0) gifFile = g;
      const v = formData.get("video");
      if (v instanceof File && v.size > 0) videoFile = v;
    }

    const accessToken = await getAccessToken();

    // 1. สร้างโฟลเดอร์ล่วงหน้า (เสร็จเร็วมาก ~0.3 วินาที เพื่อให้ขึ้น QR Code ได้ทันที)
    if (action === "create-folder") {
      const now = new Date();
      const dateStr = now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-");
      const folderName = `PhotoBooth_${dateStr}`;

      const { folderId: createdId, folderUrl } = await createCustomerFolder(
        accessToken,
        folderName
      );

      return NextResponse.json({
        success: true,
        folderId: createdId,
        folderUrl,
      });
    }

    // 2. อัปโหลดไฟล์ภาพและ GIF เข้าโฟลเดอร์
    let folderUrl: string | undefined;

    // หากยังไม่มี folderId ให้สร้างใหม่
    if (!folderId) {
      const now = new Date();
      const dateStr = now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-");
      const created = await createCustomerFolder(
        accessToken,
        `PhotoBooth_${dateStr}`
      );
      folderId = created.folderId;
      folderUrl = created.folderUrl;
    } else {
      folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
    }

    // อัปโหลดรูปภาพ
    if (photoFile) {
      const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
      await uploadFileToFolder(
        accessToken,
        folderId,
        "photo-strip.png",
        "image/png",
        photoBytes
      );
    }

    // อัปโหลด GIF
    if (gifFile) {
      const gifBytes = new Uint8Array(await gifFile.arrayBuffer());
      await uploadFileToFolder(
        accessToken,
        folderId,
        "photo-motion.gif",
        "image/gif",
        gifBytes
      );
    }

    // อัปโหลดวิดีโอ 8 วินาที (.mp4)
    if (videoFile) {
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const videoName = videoFile.name || "photo-motion.mp4";
      const videoMime = videoFile.type || "video/mp4";
      await uploadFileToFolder(
        accessToken,
        folderId,
        videoName,
        videoMime,
        videoBytes
      );
    }

    return NextResponse.json({
      success: true,
      folderId,
      folderUrl,
    });
  } catch (error: unknown) {
    console.error("Upload to Drive error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive: ${msg}` },
      { status: 500 }
    );
  }
}
