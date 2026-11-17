// ไฟล์: app/components/thank-you/ThankYouClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames, clearSessionPhotos } from "@/lib/mediaStore";

const AUTO_RETURN_SECONDS = 30;

/**
 * หน้าจอ Thank You เต็มจอหลังจบการถ่ายและปริ้นต์
 * แสดงข้อความขอบคุณอย่างสวยงาม เรียบหรู และนับถอยหลังกลับหน้าแรก
 */
export function ThankYouClient() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  const handleFinish = () => {
    try {
      sessionStorage.removeItem("photobooth_photos");
      sessionStorage.removeItem("photobooth_drive_qr");
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
    void clearMotionFrames();
    void clearSessionPhotos();
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

      {/* โซนกลาง: ข้อความ THANK YOU เรียบหรู สะอาดตา */}
      <div className="relative z-10 my-auto flex w-full max-w-xl flex-col items-center justify-center gap-6 py-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="rounded-full border border-pink-400/40 bg-pink-500/15 px-6 py-2 font-mono text-xs sm:text-sm font-black tracking-widest text-pink-300 uppercase shadow-md">
            SESSION COMPLETE • กรุณารับภาพที่ช่องรับรูป
          </span>

          <h1 className="text-5xl font-black tracking-tight text-white uppercase sm:text-7xl drop-shadow-md">
            THANK <span className="text-pink-500">YOU!</span>
          </h1>

          <p className="text-base text-zinc-300 sm:text-xl font-bold">
            ขอบคุณที่มาใช้บริการ STUDIO BOOTH
          </p>
        </div>

        {/* แถบนับถอยหลัง + ปุ่มกลับหน้าแรก */}
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-black tracking-wider uppercase">
            <span className="text-zinc-300">พร้อมรับลูกค้าท่านถัดไปใน</span>
            <span className="text-pink-400 font-mono text-base">{secondsLeft} วินาที</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-700 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="mt-1 inline-flex h-13 sm:h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 py-3 text-base sm:text-lg font-black text-white shadow-xl shadow-pink-500/30 transition hover:from-pink-400 hover:to-rose-400 active:scale-95 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            แตะเพื่อเสร็จสิ้นทันที →
          </button>
        </div>
      </div>

      {/* แถบล่าง */}
      <div className="relative z-10 font-mono text-xs text-zinc-500">
        STUDIO BOOTH • PHOTO &amp; MOTION EXPERIENCE
      </div>
    </div>
  );
}
