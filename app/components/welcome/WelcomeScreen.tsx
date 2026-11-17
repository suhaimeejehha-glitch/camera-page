// ไฟล์: app/components/welcome/WelcomeScreen.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames } from "@/lib/mediaStore";

export function WelcomeScreen() {
  // ล้างรูปเก่าทุกครั้งที่กลับมาหน้า Welcome เพื่อพร้อมรับลูกค้าคนถัดไป
  useEffect(() => {
    try {
      sessionStorage.removeItem("photobooth_photos");
      sessionStorage.removeItem("photobooth_all_photos");
      sessionStorage.removeItem("photobooth_drive_qr");
      void clearMotionFrames();
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
  }, []);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#0c0a0f] px-6 py-5 text-white sm:px-10 sm:py-7">
      {/* แสงฟุ้งชมพูสไตล์สตูดิโอโมเดิร์น */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-pink-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-28 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl" />

      {/* แถบบน: ชื่อบูธ + ปุ่ม Fullscreen สำหรับเปิดบนจอตู้ */}
      <div className="relative z-10 flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex min-h-14 items-center gap-3 font-mono text-sm sm:text-base font-black tracking-widest text-zinc-200 uppercase">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-lg shadow-pink-500/40 text-lg">
            ◉
          </span>
          <span>STUDIO BOOTH // READY</span>
        </div>

        <FullscreenButton />
      </div>

      {/* โซนกลาง: โลโก้ ข้อความต้อนรับ และปุ่มเริ่มขนาดใหญ่ */}
      <div className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8 text-center portrait:gap-10">
        <span className="rounded-full border border-pink-400/50 bg-pink-500/20 px-8 py-3 text-sm sm:text-base font-black tracking-widest text-pink-300 uppercase shadow-lg">
          CAPTURE • PRINT • SHARE • 190 THB
        </span>

        <div className="flex flex-col gap-5">
          <h1 className="text-6xl font-black tracking-tight text-white uppercase sm:text-8xl portrait:text-7xl drop-shadow-md">
            STUDIO <span className="text-pink-500">BOOTH</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-200 sm:text-2xl portrait:text-xl font-medium">
            เลือกแนวกรอบ แต่งลายน่ารักๆ แล้วรับรูปปริ้นต์พร้อมไฟล์ภาพและ GIF
            ได้ทันที
          </p>
        </div>

        {/* ปุ่มหลักขนาดใหญ่พิเศษทรงแคปซูลสำหรับจอทัชสกรีน */}
        <Link
          href="/payment"
          className="mt-4 inline-flex min-h-20 sm:min-h-24 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-16 sm:px-24 text-2xl sm:text-3xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/50 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          แตะเพื่อเริ่มถ่ายรูป →
        </Link>
      </div>

      {/* ข้อความด้านล่าง */}
      <p className="relative z-10 font-mono text-sm sm:text-base tracking-widest text-zinc-400 uppercase font-bold">
        TOUCH TO START • PROMPTPAY SUPPORTED
      </p>
    </div>
  );
}
