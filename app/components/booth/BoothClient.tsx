"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";
import { CameraView } from "@/app/components/booth/CameraView";
import { CountdownOverlay } from "@/app/components/booth/CountdownOverlay";
import { StripPreview } from "@/app/components/booth/StripPreview";
import {
  getFrameById,
  parseOrientation,
  parseShotCount,
} from "@/lib/frames";
import { clearMotionFrames, saveMotionFrames } from "@/lib/mediaStore";
import type { PhotoShot } from "@/types/photobooth";

const STORAGE_KEY = "photobooth_photos";
const ALL_PHOTOS_KEY = "photobooth_all_photos";
const MAX_BOOTH_SHOTS = 8;

export function BoothClient() {
  const searchParams = useSearchParams();
  const shots = parseShotCount(searchParams.get("shots"));
  const orientation = parseOrientation(searchParams.get("orientation"));
  const frame = getFrameById(searchParams.get("frame"), shots, orientation);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionFramesRef = useRef<string[]>([]);

  const [photos, setPhotos] = useState<PhotoShot[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isFlashing, setIsFlashing] = useState(false);

  const handleToggleCamera = () => {
    setFacingMode((prev) => {
      const next = prev === "user" ? "environment" : "user";
      if (next === "environment") setIsMirrored(false);
      return next;
    });
  };

  const handleCameraStateChange = useCallback((ready: boolean) => {
    setIsCameraReady(ready);
  }, []);

  useEffect(() => {
    void clearMotionFrames();
  }, []);

  // บันทึกรูปที่ถ่ายลง sessionStorage เพื่อให้หน้า /result นำไปเลือกรูปและตกแต่งต่อได้
  useEffect(() => {
    try {
      sessionStorage.setItem(ALL_PHOTOS_KEY, JSON.stringify(photos));
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(photos.slice(0, frame.shotCount))
      );
    } catch {
      // ข้ามถ้า storage เต็ม
    }
  }, [photos, frame.shotCount]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (motionTimerRef.current) clearInterval(motionTimerRef.current);
    };
  }, []);

  const captureMotionSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const vRatio = video.videoWidth / video.videoHeight;
    const cRatio = canvas.width / canvas.height;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    let sx = 0;
    let sy = 0;
    if (vRatio > cRatio) {
      sw = video.videoHeight * cRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cRatio;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const frameUrl = canvas.toDataURL("image/jpeg", 0.72);
    motionFramesRef.current = [...motionFramesRef.current, frameUrl];
    void saveMotionFrames(motionFramesRef.current);
  }, [isMirrored]);

  const stopMotionCapture = useCallback(() => {
    if (motionTimerRef.current) {
      clearInterval(motionTimerRef.current);
      motionTimerRef.current = null;
    }
  }, []);

  const captureFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    setPhotos((prev) => {
      if (prev.length >= MAX_BOOTH_SHOTS) return prev;
      return [...prev, { id: `shot-${Date.now()}`, dataUrl }];
    });
  }, [isMirrored]);

  const handleTakePhoto = () => {
    if (!isCameraReady || countdown !== null || photos.length >= MAX_BOOTH_SHOTS) {
      return;
    }

    let seconds = 3;
    setCountdown(seconds);

    // เก็บเฟรมภาพเคลื่อนไหวระหว่างนับถอยหลัง 3 วิ เพื่อนำไปทำไฟล์ GIF Animation
    captureMotionSnapshot();
    motionTimerRef.current = setInterval(captureMotionSnapshot, 300);

    timerRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds > 0) {
        setCountdown(seconds);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(null);
        stopMotionCapture();
        captureMotionSnapshot();
        captureFromVideo();
      }
    }, 1000);
  };

  const canProceed = photos.length >= frame.shotCount;
  const isFull = photos.length >= MAX_BOOTH_SHOTS;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* กล้องเต็มจอ 100% */}
      <CameraView
        videoRef={videoRef}
        isMirrored={isMirrored}
        facingMode={facingMode}
        isFlashing={isFlashing}
        fullScreen
        onCameraStateChange={handleCameraStateChange}
      >
        {/* มุมกรอบเล็งกล้องสีขาว 4 มุมเหมือนในภาพตัวอย่าง */}
        <div className="pointer-events-none absolute inset-x-6 inset-y-16 z-10 sm:inset-x-24 sm:inset-y-24">
          <span className="absolute top-0 left-0 h-8 w-8 sm:h-12 sm:w-12 rounded-tl-2xl border-t-4 border-l-4 border-white/90" />
          <span className="absolute top-0 right-0 h-8 w-8 sm:h-12 sm:w-12 rounded-tr-2xl border-t-4 border-r-4 border-white/90" />
          <span className="absolute bottom-0 left-0 h-8 w-8 sm:h-12 sm:w-12 rounded-bl-2xl border-b-4 border-l-4 border-white/90" />
          <span className="absolute right-0 bottom-0 h-8 w-8 sm:h-12 sm:w-12 rounded-br-2xl border-r-4 border-b-4 border-white/90" />
        </div>

        <CountdownOverlay secondsLeft={countdown} />
      </CameraView>

      {/* แถบด้านบนลอยทับบนกล้อง ปรับขนาดสำหรับมือถือและไอแพด */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-3 py-3 sm:px-8 sm:py-4">
        <div className="pointer-events-auto flex items-center gap-2 text-xs sm:text-sm font-black tracking-widest text-white uppercase">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 font-mono text-xs text-white shadow-md shadow-pink-500/30">
            ◉
          </span>
          <span className="hidden xs:inline sm:inline">STUDIO BOOTH</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5">
          <span className="inline-flex min-h-9 sm:min-h-11 items-center rounded-full border border-pink-400/50 bg-black/55 px-2.5 sm:px-4 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-pink-300 uppercase backdrop-blur-md">
            SHOT {photos.length}/{MAX_BOOTH_SHOTS}
          </span>

          {/* ปุ่มสลับกล้องหน้า-หลัง สำหรับมือถือและไอแพด */}
          <button
            type="button"
            onClick={handleToggleCamera}
            title="สลับกล้องหน้า/หลัง"
            className="inline-flex min-h-9 sm:min-h-11 items-center rounded-full border border-white/25 bg-black/50 px-2.5 sm:px-3 font-mono text-[11px] sm:text-xs font-bold text-zinc-200 uppercase backdrop-blur-md transition active:scale-95 hover:border-pink-400"
          >
            🔄 <span className="hidden sm:inline sm:ml-1">Flip</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            className={`inline-flex min-h-9 sm:min-h-11 items-center rounded-full border px-2.5 sm:px-4 font-mono text-[11px] sm:text-xs font-bold uppercase backdrop-blur-md transition active:scale-95 ${
              isMirrored
                ? "border-pink-400/70 bg-pink-500/20 text-pink-200"
                : "border-white/25 bg-black/50 text-zinc-200"
            }`}
          >
            Mirror {isMirrored ? "ON" : "OFF"}
          </button>

          <FullscreenButton />
        </div>
      </div>

      {/* พรีวิวแถบรูปขนาดกะทัดรัดด้านขวา พอดีกับกรอบ */}
      <div className="pointer-events-none fixed top-16 right-3 z-20 hidden rounded-2xl border border-white/15 bg-black/45 p-2 shadow-2xl backdrop-blur-md sm:block sm:top-20 sm:right-4">
        <StripPreview frame={frame} photos={photos} compact />
      </div>

      {/* แถบล่าง: Back ซ้ายล่าง • ชัตเตอร์กลางล่าง • Next ขวาล่าง (Touch-friendly สำหรับจอทัชสกรีน) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex items-center justify-between gap-3 px-3 sm:bottom-8 sm:px-8">
        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="pointer-events-auto inline-flex min-h-12 sm:min-h-14 items-center justify-center rounded-full border border-white/30 bg-black/55 px-5 sm:px-7 text-xs sm:text-sm font-bold tracking-wider text-white uppercase backdrop-blur-md transition active:scale-95 hover:border-pink-400"
        >
          ← Back
        </Link>

        {!isFull ? (
          <button
            type="button"
            onClick={handleTakePhoto}
            disabled={!isCameraReady || countdown !== null}
            aria-label="Take Photo"
            className="pointer-events-auto flex h-18 w-18 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 border-white bg-pink-500 text-white shadow-2xl shadow-pink-500/45 transition active:scale-90 hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8 sm:h-11 sm:w-11"
              aria-hidden="true"
            >
              <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" />
            </svg>
          </button>
        ) : (
          <div />
        )}

        {canProceed ? (
          <Link
            href={`/result?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="pointer-events-auto inline-flex min-h-12 sm:min-h-14 items-center justify-center rounded-full bg-pink-500 px-6 sm:px-9 text-sm sm:text-base font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/40 transition active:scale-95 hover:bg-pink-400"
          >
            Next →
          </Link>
        ) : (
          <div className="w-16 sm:w-28" />
        )}
      </div>
    </div>
  );
}
