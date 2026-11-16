import { NextResponse } from "next/server";
import { uploadSessionToGoogleDrive } from "@/lib/googleDrive";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photoFile = formData.get("photo");
    const gifFile = formData.get("gif");

    if (!(photoFile instanceof File) || photoFile.size === 0) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์รูปภาพสำหรับอัปโหลดเข้า Drive" },
        { status: 400 }
      );
    }

    const photoBytes = new Uint8Array(await photoFile.arrayBuffer());
    let gifBytes: Uint8Array | undefined;

    if (gifFile instanceof File && gifFile.size > 0) {
      gifBytes = new Uint8Array(await gifFile.arrayBuffer());
    }

    const folderUrl = await uploadSessionToGoogleDrive({
      photoBytes,
      gifBytes,
    });

    if (!folderUrl) {
      return NextResponse.json(
        { error: "อัปโหลดเข้า Google Drive ไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      folderUrl,
    });
  } catch (error) {
    console.error("Upload to Drive error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive" },
      { status: 500 }
    );
  }
}
