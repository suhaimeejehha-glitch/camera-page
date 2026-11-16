import { loadExportFile } from "@/lib/mediaFiles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const fileBuffer = await loadExportFile(filename);

  if (!fileBuffer) {
    return new Response("ไม่พบไฟล์หรือลิงก์หมดอายุแล้ว", {
      status: 404,
    });
  }

  const contentType = filename.endsWith(".gif") ? "image/gif" : "image/png";

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
