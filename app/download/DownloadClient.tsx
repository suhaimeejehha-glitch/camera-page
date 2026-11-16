"use client";

import { useEffect, useState } from "react";
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
  const [hasShare, setHasShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setHasShare(true);
    }
  }, []);

  const handleDownload = async () => {
    if (!src) return;
    setIsDownloading(true);
    try {
      // ดึงข้อมูลเป็น Blob เพื่อให้การกดดาวน์โหลดบนมือถือบันทึกไฟล์ได้จริง
      const response = await fetch(src);
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
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      // หาก fetch ติด CORS ให้เปิดลิงก์ตรงให้ดาวน์โหลด
      window.open(src, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!src || !hasShare) return;
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], name, {
        type: type === "gif" ? "image/gif" : "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Studio Booth Photo",
          text: "รูปถ่ายจาก Studio Booth ของฉัน 📸✨",
        });
      } else {
        await navigator.share({
          title: "My Studio Booth Photo",
          url: window.location.href,
        });
      }
    } catch {
      // ผู้ใช้กดยกเลิก share หรืออุปกรณ์ไม่รองรับ
    }
  };

  if (!src) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#0c0a0f] px-6 text-center text-white">
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
      <main className="relative z-10 my-auto flex w-full max-w-md flex-col items-center py-6">
        <div className="group relative flex max-h-[65dvh] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 shadow-2xl backdrop-blur-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Photobooth Media"
            className="max-h-[60dvh] w-auto max-w-full rounded-xl object-contain shadow-md"
          />
        </div>

        <p className="mt-3 text-center text-xs text-zinc-400">
          💡 บนมือถือ: สามารถ<strong className="text-zinc-200">แตะค้างที่รูปภาพ</strong>แล้วเลือก &quot;บันทึกรูปภาพ&quot; ได้เช่นกัน
        </p>
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
            <span>✓ บันทึกภาพสำเร็จแล้ว!</span>
          ) : (
            <span>⬇ ดาวน์โหลด {type === "gif" ? "GIF" : "รูปภาพ"}</span>
          )}
        </button>

        {hasShare ? (
          <button
            type="button"
            onClick={handleShare}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/80 px-6 font-mono text-sm font-bold text-zinc-200 transition active:scale-95 hover:bg-zinc-700"
          >
            <span>↗ แชร์ไปยัง Instagram / LINE</span>
          </button>
        ) : null}

        <p className="mt-1 text-center font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
          STUDIO BOOTH • FILES WILL EXPIRE AFTER 24 HOURS
        </p>
      </footer>
    </div>
  );
}
