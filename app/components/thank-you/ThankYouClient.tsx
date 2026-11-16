// ไฟล์: app/components/thank-you/ThankYouClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { clearMotionFrames } from "@/lib/mediaStore";

const AUTO_RETURN_SECONDS = 45;

interface DriveQrState {
  qrDataUrl: string;
  folderUrl: string;
}

/**
 * หน้าจอ Thank You เต็มจอหลังจบการถ่ายและปริ้นต์
 * แสดง 1 QR Code สำหรับเปิด Google Drive รวมทั้งรูปภาพและ GIF บนมือถือ
 */
export function ThankYouClient() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);
  const [driveQr, setDriveQr] = useState<DriveQrState | null>(null);

  // ดึง QR Code ของ Google Drive จาก session หรือสร้างทันทีถ้ายังไม่มี
  useEffect(() => {
    let cancelled = false;

    async function loadOrInitDriveQr() {
      try {
        const raw = sessionStorage.getItem("photobooth_drive_qr");
        if (raw) {
          const parsed = JSON.parse(raw) as DriveQrState;
          if (parsed && parsed.qrDataUrl) {
            setDriveQr(parsed);
            return;
          }
        }

        // หากยังไม่มี QR Code ให้เรียกสร้างทันที
        const fd = new FormData();
        fd.append("action", "create-folder");
        const res = await fetch("/api/upload-drive", {
          method: "POST",
          body: fd,
        });

        if (res.ok) {
          const data = (await res.json()) as { folderUrl?: string };
          if (data?.folderUrl && !cancelled) {
            const qrDataUrl = await QRCode.toDataURL(data.folderUrl, {
              width: 280,
              margin: 1,
              color: { dark: "#09090b", light: "#ffffff" },
            });
            const state: DriveQrState = {
              qrDataUrl,
              folderUrl: data.folderUrl,
            };
            setDriveQr(state);
            sessionStorage.setItem("photobooth_drive_qr", JSON.stringify(state));
          }
        }
      } catch (err) {
        console.error("Thank you QR error:", err);
      }
    }

    void loadOrInitDriveQr();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFinish = () => {
    try {
      sessionStorage.removeItem("photobooth_photos");
      sessionStorage.removeItem("photobooth_drive_qr");
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

      {/* โซนกลาง: ข้อความขอบคุณ + 1 QR Code เข้า Google Drive ตรง */}
      <div className="relative z-10 my-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 py-4 text-center">
        <div className="flex flex-col gap-2">
          <span className="mx-auto rounded-full border border-pink-400/40 bg-pink-500/15 px-5 py-1.5 font-mono text-xs font-bold tracking-widest text-pink-300 uppercase sm:text-sm">
            SESSION COMPLETE • กรุณารับภาพที่ช่องรับรูป
          </span>

          <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
            THANK <span className="text-pink-500">YOU!</span>
          </h1>

          <p className="text-sm text-zinc-300 sm:text-base">
            📱 สแกน QR Code เพื่อเปิดดูและบันทึกทั้งรูปภาพและ GIF ลงใน Google Drive ของคุณ
          </p>
        </div>

        {/* 1 กล่อง QR Code เข้า Google Drive รวมทั้งรูปและ GIF */}
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-emerald-500/30 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs font-bold text-emerald-300 uppercase">
            {/* Google Drive Logo */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 87.3 78" fill="none">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z" fill="#ea4335"/>
              <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-13.75-23.8c-.8-1.4-1.95-2.5-3.3-3.3L56.25 44.5z" fill="#2684fc"/>
              <path d="m27.5 53 16.15-28-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5z" fill="#ffba00"/>
            </svg>
            <span>GOOGLE DRIVE (1-SCAN)</span>
          </div>

          <div className="flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-white p-3 shadow-inner sm:h-56 sm:w-56">
            {driveQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={driveQr.qrDataUrl}
                alt="Google Drive QR Code"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span className="font-mono text-xs text-zinc-400">กำลังเตรียม QR...</span>
              </div>
            )}
          </div>

          <p className="text-center font-mono text-xs text-zinc-300">
            สแกนด้วยกล้องมือถือ เพื่อเปิดโฟลเดอร์ Google Drive
          </p>

          {driveQr ? (
            <a
              href={driveQr.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 font-mono text-xs font-bold text-emerald-300 transition active:scale-95 hover:bg-emerald-500/25"
            >
              ↗ เปิดดูใน Google Drive
            </a>
          ) : null}
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
