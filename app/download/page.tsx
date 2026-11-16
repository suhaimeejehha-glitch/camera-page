import { Suspense } from "react";
import { DownloadClient } from "./DownloadClient";

export const metadata = {
  title: "ดาวน์โหลดรูปภาพของคุณ | STUDIO BOOTH",
  description: "บันทึกรูปภาพและวิดีโอ GIF จากตู้ถ่ายรูป Studio Booth",
};

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-full items-center justify-center bg-[#0c0a0f] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
            <p className="font-mono text-sm text-zinc-400">กำลังโหลดรูปภาพ...</p>
          </div>
        </div>
      }
    >
      <DownloadClient />
    </Suspense>
  );
}
