// ไฟล์: app/components/welcome/WelcomeScreen.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames, clearSessionPhotos } from "@/lib/mediaStore";

export function WelcomeScreen() {
  // ล้างรูปเก่าทุกครั้งที่กลับมาหน้า Welcome เพื่อพร้อมรับลูกค้าคนถัดไป
  useEffect(() => {
    try {
      sessionStorage.removeItem("photobooth_photos");
      sessionStorage.removeItem("photobooth_all_photos");
      sessionStorage.removeItem("photobooth_drive_qr");
      sessionStorage.removeItem("photobooth_pending_redeem");
      void clearMotionFrames();
      void clearSessionPhotos();
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
  }, []);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-between overflow-hidden bg-[#0c0a0f] px-5 py-4 text-white sm:px-8 sm:py-6">
      {/* แสงฟุ้งชมพูสไตล์สตูดิโอโมเดิร์น */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-pink-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />

      {/* แถบบน: ชื่อบูธ + ปุ่ม Fullscreen สำหรับเปิดบนจอตู้ */}
      <div className="relative z-10 flex w-full max-w-5xl items-center justify-between">
        <div className="inline-flex items-center gap-2.5 font-mono text-xs sm:text-sm font-black tracking-widest text-zinc-300 uppercase">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white shadow-md shadow-pink-500/30 text-base">
            ◉
          </span>
          <span>STUDIO BOOTH // READY</span>
        </div>

        <FullscreenButton />
      </div>

      {/* โซนกลาง: โลโก้ ข้อความต้อนรับ และปุ่มเริ่มขนาดใหญ่พอดีจอ */}
      <div className="relative z-10 flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 sm:gap-8 text-center my-auto">
        <span className="rounded-full border border-pink-400/40 bg-pink-500/15 px-6 py-2 text-xs sm:text-sm font-black tracking-widest text-pink-300 uppercase shadow-md">
          CAPTURE • PRINT • SHARE • 190 THB
        </span>

        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-5xl font-black tracking-tight text-white uppercase sm:text-7xl drop-shadow-md">
            STUDIO <span className="text-pink-500">BOOTH</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-zinc-300 sm:text-xl font-medium">
            เลือกแนวกรอบ แต่งลายน่ารักๆ แล้วรับรูปปริ้นต์พร้อมไฟล์ภาพและ GIF ได้ทันที
          </p>
        </div>

        {/* ปุ่มหลักขนาดใหญ่ทัชง่าย พอดีกับจอตู้ */}
        <Link
          href="/payment"
          className="mt-2 inline-flex h-16 sm:h-18 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-12 sm:px-18 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/40 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          แตะเพื่อเริ่มถ่ายรูป →
        </Link>
      </div>

      {/* ข้อความด้านล่าง */}
      <p className="relative z-10 font-mono text-xs sm:text-sm tracking-widest text-zinc-500 uppercase font-bold">
        TOUCH TO START • PROMPTPAY &amp; MEMBER STAMP
      </p>
    </div>
  );
}
