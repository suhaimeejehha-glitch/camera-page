"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function DownloadClient() {
  const searchParams = useSearchParams();
  const src = searchParams.get("src") ?? "";
  const type = searchParams.get("type") === "gif" ? "gif" : "png";
  const name =
    searchParams.get("name") ??
    `studio-booth-${Date.now()}.${type === "gif" ? "gif" : "png"}`;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleDownload = async () => {
    if (!src) return;
    setIsDownloading(true);
    setDownloadError(false);

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch {
      // หาก fetch ไม่สำเร็จ (เช่น ติด CORS บนบางเบราว์เซอร์) ให้เปิดหน้าต่างตรงสำหรับบันทึกภาพ
      setDownloadError(true);
      const link = document.createElement("a");
      link.href = src;
      link.download = name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!src) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-[#0c0a0f] px-6 text-center text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-3xl">
          ⚠️
        </div>
        <h1 className="mt-4 text-2xl font-black uppercase">ไม่พบรูปภาพหรือไฟล์หมดอายุ</h1>
        <p className="mt-2 text-sm text-zinc-400">
          กรุณาสแกน QR Code จากหน้าตู้ใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-x-hidden bg-[#0c0a0f] px-4 py-6 text-white sm:px-6">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-pink-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex w-full max-w-md items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-zinc-300 uppercase">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500 text-white shadow-md shadow-pink-500/30">
            ★
          </span>
          <span>STUDIO BOOTH</span>
        </div>
        <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 font-mono text-[11px] font-bold text-pink-400 uppercase">
          {type === "gif" ? "🎬 GIF Animation" : "📸 Photo Strip"}
        </span>
      </header>

      {/* Main Content: Media Preview */}
      <main className="relative z-10 my-auto flex w-full max-w-md flex-col items-center py-5">
        <div className="relative flex min-h-[300px] max-h-[62dvh] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 shadow-2xl backdrop-blur-md">
          {!imageLoaded && !imageLoadError ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
              <p className="font-mono text-xs text-zinc-400">กำลังโหลด {type === "gif" ? "GIF" : "รูปภาพ"}...</p>
            </div>
          ) : null}

          {imageLoadError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="font-mono text-xs text-rose-400">โหลดภาพไม่สำเร็จ</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-300"
              >
                ลองใหม่อีกครั้ง ↻
              </button>
            </div>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={type === "gif" ? "Photobooth GIF Animation" : "Photobooth Photo"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoadError(true)}
            className={`max-h-[58dvh] w-auto max-w-full rounded-xl object-contain shadow-md transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "hidden opacity-0"
            }`}
          />
        </div>

        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-center text-xs text-zinc-300">
          💡 <strong>วิธีบันทึกบนมือถือ:</strong> แตะค้างที่รูปภาพด้านบน แล้วเลือก <strong>&quot;บันทึกรูปภาพ (Save to Photos)&quot;</strong> เข้าเครื่องได้ทันที
        </div>
      </main>

      {/* Actions Footer */}
      <footer className="relative z-10 flex w-full max-w-md flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-6 text-base font-black tracking-wide text-white uppercase shadow-lg shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 disabled:opacity-60"
        >
          {isDownloading ? (
            <span>กำลังบันทึกภาพ...</span>
          ) : downloadSuccess ? (
            <span>✓ บันทึกภาพเรียบร้อยแล้ว!</span>
          ) : (
            <span>⬇ ดาวน์โหลด {type === "gif" ? "GIF" : "รูปภาพ"}</span>
          )}
        </button>

        {downloadError ? (
          <p className="text-center text-xs text-amber-400">
            หากปุ่มไม่ดาวน์โหลดอัตโนมัติ ให้แตะค้างที่รูปภาพด้านบนแล้วเลือก &quot;บันทึกรูปภาพ&quot; ได้เลยครับ
          </p>
        ) : null}

        <p className="text-center font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
          STUDIO BOOTH • FILES WILL EXPIRE AFTER 24 HOURS
        </p>
      </footer>
    </div>
  );
}
