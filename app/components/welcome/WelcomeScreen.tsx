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
        <div className="inline-flex items-center gap-2.5 font-mono text-xs font-bold tracking-widest text-zinc-300 uppercase sm:text-sm">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white shadow-lg shadow-pink-500/30">
            ◉
          </span>
          <span>STUDIO BOOTH // READY</span>
        </div>

        <FullscreenButton />
      </div>

      {/* โซนกลาง: โลโก้ ข้อความต้อนรับ และปุ่มเริ่มขนาดใหญ่ */}
      <div className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-7 text-center portrait:gap-9">
        <span className="rounded-full border border-pink-400/40 bg-pink-500/15 px-6 py-2 font-mono text-xs font-bold tracking-widest text-pink-300 uppercase sm:text-sm">
          CAPTURE • PRINT • SHARE • 190 THB
        </span>

        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-black tracking-tight text-white uppercase sm:text-7xl portrait:text-6xl">
            STUDIO <span className="text-pink-500">BOOTH</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-zinc-300 sm:text-xl portrait:text-lg">
            เลือกแนวกรอบ แต่งลายน่ารักๆ แล้วรับรูปปริ้นต์พร้อมไฟล์ภาพและ GIF
            ได้ทันที
          </p>
        </div>

        {/* ปุ่มหลักขนาดใหญ่ทรงแคปซูลสำหรับจอทัชสกรีน */}
        <Link
          href="/payment"
          className="mt-2 inline-flex min-h-18 items-center justify-center rounded-full bg-pink-500 px-14 text-lg font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/35 transition active:scale-95 hover:bg-pink-400 sm:min-h-22 sm:px-20 sm:text-2xl"
        >
          แตะเพื่อเริ่มถ่ายรูป →
        </Link>
      </div>

      {/* ข้อความด้านล่าง */}
      <p className="relative z-10 font-mono text-xs tracking-widest text-zinc-500 uppercase">
        TOUCH TO START • PROMPTPAY SUPPORTED
      </p>
    </div>
  );
}
