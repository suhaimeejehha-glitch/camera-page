import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { saveExportFile } from "@/lib/mediaFiles";

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

    await saveExportFile(filename, bytes);

    return NextResponse.json({
      filename,
      urlPath: `/api/media/${filename}`,
    });
  } catch (error) {
    console.error("Failed to save media export:", error);
    return NextResponse.json(
      { error: "สร้างไฟล์สำหรับ QR Code ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
