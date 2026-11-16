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
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveTip, setDriveTip] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleDownload = async () => {
    if (!src) return;
    setIsDownloading(true);

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

  const handleSaveToDrive = async () => {
    if (!src) return;
    setIsSavingToDrive(true);
    setDriveTip(true);

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const mimeType = type === "gif" ? "image/gif" : "image/png";
      const file = new File([blob], name, { type: mimeType });

      // บนมือถือ (iOS/Android): เปิดหน้าต่างแชร์ของระบบเพื่อให้ผู้ใช้เลือกแอป "Google Drive"
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Studio Booth - ${name}`,
          text: "บันทึกภาพจาก Studio Booth ลงใน Google Drive",
        });
      } else {
        // หากเปิดจากคอมพิวเตอร์ที่ไม่มีระบบ Share ให้เปิดหน้าเว็บ Google Drive พร้อมดาวน์โหลดไฟล์
        handleDownload();
        window.open("https://drive.google.com/drive/my-drive", "_blank");
      }
    } catch {
      // ผู้ใช้กดยกเลิก
    } finally {
      setIsSavingToDrive(false);
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
      <main className="relative z-10 my-auto flex w-full max-w-md flex-col items-center py-4">
        <div className="relative flex min-h-[280px] max-h-[60dvh] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 shadow-2xl backdrop-blur-md">
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
            className={`max-h-[56dvh] w-auto max-w-full rounded-xl object-contain shadow-md transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "hidden opacity-0"
            }`}
          />
        </div>

        {/* Tip คำแนะนำ */}
        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-center text-xs text-zinc-300">
          💡 <strong>บนมือถือ:</strong> แตะค้างที่รูปภาพด้านบน แล้วเลือก <strong>&quot;บันทึกรูปภาพ&quot;</strong> เพื่อเซฟเข้าอัลบั้มได้ทันที
        </div>
      </main>

      {/* Actions Footer */}
      <footer className="relative z-10 flex w-full max-w-md flex-col gap-2.5 pt-1">
        {/* ปุ่มบันทึกเข้า Google Drive */}
        <button
          type="button"
          onClick={handleSaveToDrive}
          disabled={isSavingToDrive}
          className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-6 font-mono text-sm font-bold text-emerald-300 shadow-lg shadow-emerald-500/10 transition active:scale-95 hover:bg-emerald-500/25 disabled:opacity-60"
        >
          {/* Google Drive Logo */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 87.3 78" fill="none">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335"/>
            <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-13.75-23.8c-.8-1.4-1.95-2.5-3.3-3.3L56.25 44.5z" fill="#2684fc"/>
            <path d="m27.5 53 16.15-28-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5z" fill="#ffba00"/>
          </svg>
          <span>{isSavingToDrive ? "กำลังเตรียมส่งเข้า Drive..." : "📁 บันทึกไปยัง Google Drive"}</span>
        </button>

        {driveTip ? (
          <p className="text-center text-[11px] text-emerald-400">
            แตะเลือกแอป &quot;Google Drive&quot; ในหน้าจอแชร์ เพื่อเลือกโฟลเดอร์เก็บรูปได้เลย
          </p>
        ) : null}

        {/* ปุ่มดาวน์โหลดไฟล์ลงเครื่อง */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-pink-500 px-6 text-sm font-black tracking-wide text-white uppercase shadow-lg shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 disabled:opacity-60"
        >
          {isDownloading ? (
            <span>กำลังบันทึกภาพ...</span>
          ) : downloadSuccess ? (
            <span>✓ บันทึกภาพเรียบร้อยแล้ว!</span>
          ) : (
            <span>⬇ ดาวน์โหลด {type === "gif" ? "GIF" : "รูปภาพ"} ลงเครื่อง</span>
          )}
        </button>

        <p className="text-center font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
          STUDIO BOOTH • FILES WILL EXPIRE AFTER 24 HOURS
        </p>
      </footer>
    </div>
  );
}
