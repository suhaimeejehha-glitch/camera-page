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
    <div className="relative flex min-h-dvh md:h-dvh w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto md:overflow-hidden bg-[#080e1e] px-4 py-6 text-white sm:px-10 sm:py-8 lg:px-16 lg:py-10 select-none">
      {/* แสงฟุ้งสไตล์เกาหลีพรีเมียม (Haru Film / Photoism) มิติสะอาดตา ไม่มืดทึบ */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-blue-600/25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[40rem] w-[40rem] rounded-full bg-sky-500/20 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[42rem] w-[42rem] rounded-full bg-blue-500/10 blur-[180px]" />

      {/* แถบบน: โลโก้สถานะบูธ + ปุ่มเต็มจอ ขนาดใหญ่ชัดเจนสำหรับจอตู้ */}
      <header className="relative z-10 flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex items-center gap-3 font-mono text-sm sm:text-base md:text-lg font-black tracking-widest text-zinc-200 uppercase">
          <span className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 text-xl font-bold">
            ◉
          </span>
          <span className="tracking-wider">STUDIO BOOTH // READY</span>
        </div>

        <FullscreenButton />
      </header>

      {/* โซนกลาง: หัวข้อขนาดใหญ่สะดุดตา + จุดเด่น + ปุ่มกดทัชสกรีนขนาดใหญ่พิเศษ */}
      <main className="relative z-10 flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 text-center my-auto">
        {/* ป้ายแสดงราคาและจุดเด่น */}
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-sky-400/50 bg-sky-500/20 px-8 py-2.5 sm:px-10 sm:py-3 text-sm sm:text-base md:text-lg font-black tracking-widest text-sky-200 uppercase shadow-xl shadow-sky-500/20 backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span>CAPTURE • PRINT • SHARE • 190 THB</span>
        </div>

        {/* ชื่อบูธขนาดใหญ่เต็มตา คมชัดทุกมุมมอง */}
        <div className="flex flex-col gap-3 sm:gap-5">
          <h1 className="text-5xl sm:text-8xl md:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
            STUDIO <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(56,189,248,0.7)]">BOOTH</span>
          </h1>
          <p className="mx-auto max-w-none text-base sm:text-xl md:text-2xl lg:text-[28px] font-semibold text-zinc-200 leading-relaxed drop-shadow whitespace-normal sm:whitespace-nowrap">
            เลือกแนวกรอบ แต่งลายน่ารักๆ แล้วรับรูปปริ้นต์พร้อมไฟล์ภาพและ GIF ได้ทันที
          </p>
        </div>

        {/* ปุ่มเริ่มถ่ายรูปขนาดใหญ่พิเศษสำหรับหน้าจอสัมผัส (ทัชง่ายจากทุกระยะ) */}
        <Link
          href="/payment"
          className="group relative mt-3 sm:mt-6 inline-flex h-18 sm:h-24 md:h-28 items-center justify-center gap-3 sm:gap-5 rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 sm:px-20 md:px-28 text-xl sm:text-3xl md:text-4xl font-black tracking-wider text-white uppercase shadow-[0_0_50px_rgba(56,189,248,0.55)] transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-[0_0_80px_rgba(56,189,248,0.85)] border-4 border-white/30 touch-manipulation cursor-pointer"
        >
          <span className="text-3xl sm:text-4xl md:text-5xl">📸</span>
          <span>แตะเพื่อเริ่มถ่ายรูป</span>
          <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
        </Link>
      </main>

      {/* แถบล่าง: คำแนะนำการใช้งาน */}
      <footer className="relative z-10 flex flex-col items-center gap-1.5 text-center pb-1">
        <p className="font-mono text-xs sm:text-sm md:text-base tracking-widest text-zinc-400 uppercase font-black">
          TOUCH TO START • PROMPTPAY QR &amp; MEMBER STAMP (10 FREE 1)
        </p>
      </footer>
    </div>
  );
}
