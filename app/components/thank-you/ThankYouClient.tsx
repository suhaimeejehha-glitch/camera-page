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
      sessionStorage.removeItem("photobooth_pending_redeem");
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
    <div className="relative flex min-h-dvh md:h-dvh md:max-h-dvh w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto md:overflow-hidden bg-[#0c0a0f] px-4 py-5 text-white sm:px-10 sm:py-6 select-none">
      {/* แสงฟุ้งชมพูสไตล์สตูดิโอโมเดิร์น */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-pink-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-28 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl" />

      {/* แถบบน */}
      <div className="relative z-10 flex w-full max-w-7xl items-center justify-between shrink-0">
        <div className="inline-flex items-center gap-3 font-mono text-sm sm:text-base lg:text-lg font-black tracking-widest text-zinc-200 uppercase">
          <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-xl shadow-pink-500/40 text-base sm:text-lg">
            ✓
          </span>
          <span>STUDIO BOOTH // COMPLETE</span>
        </div>

        <FullscreenButton />
      </div>

      {/* โซนกลาง: ข้อความ THANK YOU ขนาดใหญ่เต็มตาสำหรับจอทัชสกรีน */}
      <div className="relative z-10 my-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 sm:gap-8 py-2 text-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <span className="rounded-full border-2 border-pink-400/40 bg-pink-500/15 px-6 sm:px-8 py-2 sm:py-2.5 font-mono text-xs sm:text-sm lg:text-base font-black tracking-widest text-pink-300 uppercase shadow-lg">
            SESSION COMPLETE • กรุณารับภาพที่ช่องรับรูป
          </span>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white uppercase drop-shadow-xl">
            THANK <span className="text-pink-500">YOU!</span>
          </h1>

          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-200">
            ขอบคุณที่มาใช้บริการ STUDIO BOOTH
          </p>
        </div>

        {/* แถบนับถอยหลัง + ปุ่มกลับหน้าแรกขนาดใหญ่พิเศษ */}
        <div className="flex w-full max-w-xl lg:max-w-2xl flex-col gap-4 sm:gap-5 rounded-[36px] sm:rounded-[40px] border-2 border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-sm sm:text-base lg:text-lg font-black tracking-wider uppercase">
            <span className="text-zinc-300">พร้อมรับลูกค้าท่านถัดไปใน</span>
            <span className="text-pink-400 font-mono text-xl sm:text-2xl lg:text-3xl font-black">{secondsLeft} วินาที</span>
          </div>

          <div className="h-4 sm:h-5 w-full overflow-hidden rounded-full bg-zinc-800 border border-zinc-700/80 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 transition-all duration-700 ease-linear shadow-md"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="mt-2 inline-flex h-16 sm:h-18 lg:h-20 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-xl sm:text-2xl lg:text-3xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/40 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-3 border-white/20 touch-manipulation cursor-pointer"
          >
            แตะเพื่อกลับหน้าแรกทันที →
          </button>
        </div>
      </div>

      {/* แถบล่าง */}
      <div className="relative z-10 font-mono text-xs sm:text-sm font-bold text-zinc-500 shrink-0">
        STUDIO BOOTH • PHOTO &amp; MOTION EXPERIENCE
      </div>
    </div>
  );
}
