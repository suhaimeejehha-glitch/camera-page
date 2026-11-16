import { NextResponse } from "next/server";
import { uploadSessionToGoogleDrive } from "@/lib/googleDrive";

// GET สำหรับตรวจสอบสถานะการเชื่อมต่อ Google Drive
export async function GET() {
  try {
    // ทดสอบสร้างโฟลเดอร์ทดสอบขนาดเล็ก
    const testBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // minimal PNG header
    const result = await uploadSessionToGoogleDrive({
      photoBytes: testBytes,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

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

    const result = await uploadSessionToGoogleDrive({
      photoBytes,
      gifBytes,
    });

    if (!result.success || !result.folderUrl) {
      return NextResponse.json(
        { error: result.error || "อัปโหลดเข้า Google Drive ไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      folderUrl: result.folderUrl,
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
