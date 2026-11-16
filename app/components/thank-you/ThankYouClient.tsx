// ไฟล์: app/components/thank-you/ThankYouClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames } from "@/lib/mediaStore";

const AUTO_RETURN_SECONDS = 45;

interface QrMediaState {
  qrDataUrl: string;
  mediaUrl: string;
}

/**
 * หน้าจอ Thank You เต็มจอหลังจบการถ่ายและปริ้นต์
 * แสดง QR Code ให้ลูกค้าสแกนรับภาพ PNG และ GIF เข้ามือถือ
 */
export function ThankYouClient() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);
  const [photoQr, setPhotoQr] = useState<QrMediaState | null>(null);
  const [gifQr, setGifQr] = useState<QrMediaState | null>(null);

  // ดึง QR Code จาก session ที่สร้างไว้ในหน้า Result
  useEffect(() => {
    try {
      const rawPhoto =
        sessionStorage.getItem("photobooth_qr_photo") ||
        sessionStorage.getItem("photobooth_qr_png");
      if (rawPhoto) {
        setPhotoQr(JSON.parse(rawPhoto) as QrMediaState);
      }
      const rawGif = sessionStorage.getItem("photobooth_qr_gif");
      if (rawGif) {
        setGifQr(JSON.parse(rawGif) as QrMediaState);
      }
    } catch {
      // ข้ามถ้าอ่าน storage ไม่ได้
    }
  }, []);

  const handleFinish = () => {
    try {
      sessionStorage.removeItem("photobooth_photos");
      sessionStorage.removeItem("photobooth_qr_photo");
      sessionStorage.removeItem("photobooth_qr_gif");
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
    void clearMotionFrames();
    router.replace("/");
  };

  // นับถอยหลังอัตโนมัติกลับหน้า Welcome (/)
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleFinish();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsLeft / AUTO_RETURN_SECONDS) * 100)
  );

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-x-hidden bg-[#0c0a0f] px-6 py-5 text-white sm:px-10 sm:py-7">
      {/* แสงฟุ้งชมพูสไตล์สตูดิโอโมเดิร์น */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-pink-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-28 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl" />

      {/* แถบบน */}
      <div className="relative z-10 flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex items-center gap-2.5 font-mono text-xs font-bold tracking-widest text-zinc-300 uppercase sm:text-sm">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white shadow-lg shadow-pink-500/30">
            ✓
          </span>
          <span>STUDIO BOOTH // COMPLETE</span>
        </div>

        <FullscreenButton />
      </div>

      {/* โซนกลาง: ข้อความขอบคุณ + แสดง QR Code ทั้งรูปภาพและ GIF */}
      <div className="relative z-10 my-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6 py-4 text-center">
        <div className="flex flex-col gap-2">
          <span className="mx-auto rounded-full border border-pink-400/40 bg-pink-500/15 px-5 py-1.5 font-mono text-xs font-bold tracking-widest text-pink-300 uppercase sm:text-sm">
            SESSION COMPLETE • กรุณารับภาพที่ช่องรับรูป
          </span>

          <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
            THANK <span className="text-pink-500">YOU!</span>
          </h1>

          <p className="text-sm text-zinc-300 sm:text-base">
            📱 ใช้โทรศัพท์มือถือสแกน QR Code ด้านล่าง เพื่อรับไฟล์รูปภาพและ GIF เข้าเครื่อง
          </p>
        </div>

        {/* กล่องแสดง QR Code 2 แบบ: รูปภาพ และ GIF */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
          {/* QR รูปภาพ (.PNG) */}
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur">
            <span className="rounded-full bg-pink-500/20 px-3 py-1 font-mono text-xs font-bold tracking-wider text-pink-400 uppercase">
              📸 รูปภาพโฟโต้บูธ (.PNG)
            </span>

            <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-700 bg-white p-2 shadow-inner sm:h-48 sm:w-48">
              {photoQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoQr.qrDataUrl}
                  alt="QR Code Photo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="font-mono text-xs text-zinc-400">กำลังเตรียม QR...</span>
              )}
            </div>

            <p className="font-mono text-xs text-zinc-400">
              สแกนเพื่อบันทึกแถบรูปภาพ
            </p>
          </div>

          {/* QR ภาพเคลื่อนไหว (.GIF) */}
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur">
            <span className="rounded-full bg-purple-500/20 px-3 py-1 font-mono text-xs font-bold tracking-wider text-purple-400 uppercase">
              🎬 วิดีโอดุ๊กดิ๊ก (.GIF)
            </span>

            <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border-2 border-zinc-700 bg-white p-2 shadow-inner sm:h-48 sm:w-48">
              {gifQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gifQr.qrDataUrl}
                  alt="QR Code GIF"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="font-mono text-xs text-zinc-400">กำลังเตรียม GIF...</span>
              )}
            </div>

            <p className="font-mono text-xs text-zinc-400">
              สแกนเพื่อบันทึกภาพเคลื่อนไหว
            </p>
          </div>
        </div>

        {/* แถบนับถอยหลัง + ปุ่มกลับหน้าแรก */}
        <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <div className="flex items-center justify-between font-mono text-xs font-bold tracking-wider uppercase">
            <span className="text-zinc-400">พร้อมรับลูกค้าท่านถัดไปใน</span>
            <span className="text-pink-400">{secondsLeft} วินาที</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-pink-500 transition-all duration-700 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="mt-1 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pink-500 px-6 text-sm font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/25 transition active:scale-95 hover:bg-pink-400"
          >
            เสร็จสิ้น / กลับหน้าแรกทันที →
          </button>
        </div>
      </div>

      {/* แถบล่าง */}
      <p className="relative z-10 font-mono text-xs tracking-widest text-zinc-500 uppercase">
        RESETTING BOOTH FOR NEXT GUEST • SEE YOU AGAIN
      </p>
    </div>
  );
}
