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
    <div className="relative flex min-h-dvh md:h-dvh w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto md:overflow-hidden bg-[#140e0e] px-4 py-6 text-white sm:px-10 sm:py-8 lg:px-16 lg:py-10 select-none">
      {/* แสงฟุ้งสไตล์เรโทร วินเทจ (Vintage Theater & Marquee Bulb Glow) */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-red-700/25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[40rem] w-[40rem] rounded-full bg-amber-500/20 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[42rem] w-[42rem] rounded-full bg-red-600/10 blur-[180px]" />

      {/* แถบบน: โลโก้สถานะบูธ + ปุ่มเต็มจอ ขนาดใหญ่ชัดเจนสำหรับจอตู้ */}
      <header className="relative z-10 flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex items-center gap-3 font-mono text-sm sm:text-base md:text-lg font-black tracking-widest text-amber-100 uppercase">
          <span className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-red-700 text-amber-300 shadow-lg shadow-red-700/50 text-xl font-bold border border-amber-400/50">
            ★
          </span>
          <span className="tracking-wider">STUDIO BOOTH // READY</span>
        </div>

        <FullscreenButton />
      </header>

      {/* โซนกลาง: หัวข้อขนาดใหญ่สะดุดตา + จุดเด่น + ปุ่มกดทัชสกรีนขนาดใหญ่พิเศษ */}
      <main className="relative z-10 flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 text-center my-auto">
        {/* ป้ายแสดงราคาและจุดเด่นสไตล์ Marquee */}
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-amber-400/60 bg-red-950/80 px-8 py-2.5 sm:px-10 sm:py-3 text-sm sm:text-base md:text-lg font-black tracking-widest text-amber-200 uppercase shadow-xl shadow-red-950/50 backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
          <span>CAPTURE • PRINT • SHARE • 190 THB</span>
        </div>

        {/* ชื่อบูธขนาดใหญ่เต็มตา คมชัดทุกมุมมอง */}
        <div className="flex flex-col gap-3 sm:gap-5">
          <h1 className="text-5xl sm:text-8xl md:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
            STUDIO <span className="bg-gradient-to-r from-red-500 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(245,158,11,0.7)]">BOOTH</span>
          </h1>
          <p className="mx-auto max-w-none text-base sm:text-xl md:text-2xl lg:text-[28px] font-semibold text-zinc-200 leading-relaxed drop-shadow whitespace-normal sm:whitespace-nowrap">
            เลือกแนวกรอบ แต่งลายน่ารักๆ แล้วรับรูปปริ้นต์พร้อมไฟล์ภาพและวิดีโอได้ทันที
          </p>
        </div>

        {/* ปุ่มเริ่มถ่ายรูปขนาดใหญ่พิเศษสำหรับหน้าจอสัมผัส (ทัชง่ายจากทุกระยะ) */}
        <Link
          href="/payment"
          className="group relative mt-3 sm:mt-6 inline-flex h-18 sm:h-24 md:h-28 items-center justify-center gap-3 sm:gap-5 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-8 sm:px-20 md:px-28 text-xl sm:text-3xl md:text-4xl font-black tracking-wider text-white uppercase shadow-[0_0_55px_rgba(185,28,28,0.65)] transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-[0_0_80px_rgba(245,158,11,0.75)] border-4 border-amber-300/80 touch-manipulation cursor-pointer"
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
