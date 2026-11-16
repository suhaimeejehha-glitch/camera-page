import { NextResponse } from "next/server";
import {
  getAccessToken,
  createCustomerFolder,
  uploadFileToFolder,
} from "@/lib/googleDrive";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const action = formData.get("action");

    const accessToken = await getAccessToken();

    // 1. สร้างโฟลเดอร์ล่วงหน้า (เสร็จเร็วมาก ~0.3 วินาที เพื่อให้ขึ้น QR Code ได้ทันที)
    if (action === "create-folder") {
      const now = new Date();
      const dateStr = now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-");
      const folderName = `PhotoBooth_${dateStr}`;

      const { folderId, folderUrl } = await createCustomerFolder(
        accessToken,
        folderName
      );

      return NextResponse.json({
        success: true,
        folderId,
        folderUrl,
      });
    }

    // 2. อัปโหลดไฟล์ภาพและ GIF เข้าโฟลเดอร์
    let folderId = formData.get("folderId") as string | null;
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

    const photoFile = formData.get("photo");
    const gifFile = formData.get("gif");

    // อัปโหลดรูปภาพ
    if (photoFile instanceof File && photoFile.size > 0) {
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
    if (gifFile instanceof File && gifFile.size > 0) {
      const gifBytes = new Uint8Array(await gifFile.arrayBuffer());
      await uploadFileToFolder(
        accessToken,
        folderId,
        "photo-motion.gif",
        "image/gif",
        gifBytes
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
