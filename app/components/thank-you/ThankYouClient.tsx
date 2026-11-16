// ไฟล์: app/components/thank-you/ThankYouClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames } from "@/lib/mediaStore";

const AUTO_RETURN_SECONDS = 8;

/**
 * หน้าจอ Thank You เต็มจอหลังจบการถ่ายและปริ้นต์
 * ล้างข้อมูลเซสชันเก่าทันทีและนับถอยหลังกลับหน้าแรกเพื่อรับลูกค้าคนถัดไป
 */
export function ThankYouClient() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  // ล้างรูปภาพและเฟรมภาพเคลื่อนไหวของลูกค้าคนก่อนทันทีที่เข้าสู่หน้าขอบคุณ
  useEffect(() => {
    try {
      sessionStorage.removeItem("photobooth_photos");
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
    void clearMotionFrames();
  }, []);

  // นับถอยหลังอัตโนมัติกลับหน้า Welcome (/)
  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace("/");
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, secondsLeft]);

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsLeft / AUTO_RETURN_SECONDS) * 100)
  );

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#0c0a0f] px-6 py-5 text-white sm:px-10 sm:py-7">
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

      {/* โซนกลาง: ข้อความขอบคุณ + คำแนะนำรับรูป + นับถอยหลัง */}
      <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 text-center portrait:gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-pink-400/70 bg-pink-500/20 text-5xl text-pink-300 shadow-2xl shadow-pink-500/30 sm:h-28 sm:w-28">
          ✓
        </div>

        <div className="flex flex-col gap-3">
          <span className="mx-auto rounded-full border border-pink-400/40 bg-pink-500/15 px-5 py-1.5 font-mono text-xs font-bold tracking-widest text-pink-300 uppercase sm:text-sm">
            SESSION COMPLETE • ขอบคุณที่ใช้บริการ
          </span>

          <h1 className="text-4xl font-black tracking-tight text-white uppercase sm:text-6xl portrait:text-6xl">
            THANK <span className="text-pink-500">YOU!</span>
          </h1>

          <p className="mx-auto max-w-lg text-base text-zinc-300 sm:text-lg">
            กรุณารับรูปถ่ายของคุณที่ช่องรับรูปด้านล่าง
            <br />
            และตรวจสอบไฟล์ภาพ PNG / วิดีโอ GIF ที่สแกนเก็บไว้บนมือถือ
          </p>
        </div>

        {/* กล่องนับถอยหลังกลับหน้า Welcome */}
        <div className="flex w-full max-w-md flex-col gap-3.5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between font-mono text-xs font-bold tracking-wider uppercase">
            <span className="text-zinc-400">พร้อมรับลูกค้าท่านถัดไปใน</span>
            <span className="text-pink-400">{secondsLeft} วินาที</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-pink-500 transition-all duration-700 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-1 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-pink-500 px-8 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/25 transition active:scale-95 hover:bg-pink-400"
          >
            กลับหน้าแรกทันที →
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
