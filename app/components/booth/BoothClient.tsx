"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PHOTO_TONES, type PhotoTone } from "@/lib/filters";
import type { PhotoShot } from "@/types/photobooth";

const STORAGE_KEY = "photobooth_photos";
const ALL_PHOTOS_KEY = "photobooth_all_photos";
const SELECTED_TONE_KEY = "photobooth_selected_tone";
const MAX_BOOTH_SHOTS = 8;

export function BoothClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shots = parseShotCount(searchParams.get("shots"));
  const orientation = parseOrientation(searchParams.get("orientation"));
  const frame = useMemo(
    () => getFrameById(searchParams.get("frame"), shots, orientation),
    [searchParams, shots, orientation]
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motionFramesRef = useRef<string[]>([]);

  const [photos, setPhotos] = useState<PhotoShot[]>([]);
  const [selectedToneId, setSelectedToneId] = useState<string>("normal");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isFlashing, setIsFlashing] = useState(false);

  const activeTone = useMemo<PhotoTone>(
    () => PHOTO_TONES.find((t) => t.id === selectedToneId) ?? PHOTO_TONES[0],
    [selectedToneId]
  );

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
    try {
      const savedTone = sessionStorage.getItem(SELECTED_TONE_KEY);
      if (savedTone) setSelectedToneId(savedTone);
    } catch {}
  }, []);

  // บันทึกรูปที่ถ่าย และโทนสีที่เลือกลง sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(ALL_PHOTOS_KEY, JSON.stringify(photos));
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(photos.slice(0, frame.shotCount))
      );
      sessionStorage.setItem(SELECTED_TONE_KEY, selectedToneId);
    } catch {
      // ข้ามถ้า storage เต็ม
    }
  }, [photos, frame.shotCount, selectedToneId]);

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

    // เก็บเฟรมภาพเคลื่อนไหวระหว่างนับถอยหลัง 3 วิ เพื่อทำไฟล์ GIF Animation
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

  const handleDeleteShot = (shotId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== shotId));
  };

  const canProceed = photos.length >= frame.shotCount;
  const isFull = photos.length >= MAX_BOOTH_SHOTS;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center">
      {/* แถบด้านบน: โลโก้ + สถานะช็อต + สลับกล้อง + Mirror + Fullscreen */}
      <header className="flex w-full max-w-7xl shrink-0 items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black tracking-widest text-white uppercase">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 font-mono text-xs text-white shadow-md shadow-pink-500/30">
            ◉
          </span>
          <span className="hidden xs:inline sm:inline">STUDIO BOOTH</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span className="inline-flex min-h-9 sm:min-h-11 items-center rounded-full border border-pink-400/50 bg-black/55 px-3 sm:px-4 font-mono text-xs font-bold tracking-wider text-pink-300 uppercase backdrop-blur-md">
            SHOT {photos.length} / {MAX_BOOTH_SHOTS}
          </span>

          {/* ปุ่มสลับกล้องหน้า-หลัง สำหรับมือถือและไอแพด */}
          <button
            type="button"
            onClick={handleToggleCamera}
            title="สลับกล้องหน้า/หลัง"
            className="inline-flex min-h-9 sm:min-h-11 items-center rounded-full border border-white/25 bg-black/50 px-2.5 sm:px-3 font-mono text-xs font-bold text-zinc-200 uppercase backdrop-blur-md transition active:scale-95 hover:border-pink-400"
          >
            🔄 <span className="hidden sm:inline sm:ml-1">Flip</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            className={`inline-flex min-h-9 sm:min-h-11 items-center rounded-full border px-3 sm:px-4 font-mono text-xs font-bold uppercase backdrop-blur-md transition active:scale-95 ${
              isMirrored
                ? "border-pink-400/70 bg-pink-500/20 text-pink-200"
                : "border-white/25 bg-black/50 text-zinc-200"
            }`}
          >
            Mirror {isMirrored ? "ON" : "OFF"}
          </button>

          <FullscreenButton />
        </div>
      </header>

      {/* พื้นที่หลัก: จัดแบ่งเป็น 2 ฝั่งเหมือนภาพตัวอย่าง Kiosk (กล้องสดอยู่ทางซ้าย + โทนสี + แถบรูปด้านล่าง | พรีวิวกรอบรูปอยู่ทางขวา) */}
      <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 overflow-y-auto px-1 py-2 sm:px-4 sm:py-3 landscape:flex-row landscape:items-start landscape:justify-center landscape:gap-6 touch-pan-y">
        
        {/* ฝั่งซ้าย: กล้องสด Live Camera + โทนสี + แถบรูปที่ถ่ายด้านล่าง */}
        <div className="flex flex-1 flex-col gap-2.5 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-3 shadow-2xl backdrop-blur-md sm:gap-3 sm:rounded-3xl sm:p-4 md:p-5">
          
          {/* 1. กล้องสด LIVE CAMERA (แทนภาพนิ่งที่เคยอยู่ตรงนี้) */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner max-h-[30dvh] sm:max-h-[36dvh] md:max-h-[42dvh] sm:rounded-2xl">
            <CameraView
              videoRef={videoRef}
              isMirrored={isMirrored}
              facingMode={facingMode}
              filterCss={activeTone.cssFilter}
              isFlashing={isFlashing}
              fullScreen
              onCameraStateChange={handleCameraStateChange}
            >
              {/* มุมกรอบเล็งกล้องสีขาว 4 มุม */}
              <div className="pointer-events-none absolute inset-x-6 inset-y-8 z-10 sm:inset-x-12 sm:inset-y-12">
                <span className="absolute top-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tl-xl border-t-3 border-l-3 sm:border-t-4 sm:border-l-4 border-white/90" />
                <span className="absolute top-0 right-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tr-xl border-t-3 border-r-3 sm:border-t-4 sm:border-r-4 border-white/90" />
                <span className="absolute bottom-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-bl-xl border-b-3 border-l-3 sm:border-b-4 sm:border-l-4 border-white/90" />
                <span className="absolute right-0 bottom-0 h-6 w-6 sm:h-10 sm:w-10 rounded-br-xl border-r-3 border-b-3 sm:border-r-4 sm:border-b-4 border-white/90" />
              </div>

              <CountdownOverlay secondsLeft={countdown} />
            </CameraView>

            {/* ป้ายบอกสถานะกล้องสด */}
            <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-black/75 px-3 py-1 text-[11px] font-bold text-pink-300 backdrop-blur-md sm:top-3 sm:left-3 sm:gap-2 sm:px-3.5 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              <span>LIVE CAMERA</span>
            </div>

            {/* ป้ายบอกโทนสีที่กำลังใช้งานกับกล้อง */}
            <div className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-200 backdrop-blur-md sm:top-3 sm:right-3 sm:gap-2 sm:px-3 sm:text-xs">
              <span
                className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full"
                style={{ backgroundColor: activeTone.previewColor }}
              />
              <span>{activeTone.labelEn}</span>
            </div>

            {/* ปุ่มชัตเตอร์ขนาดใหญ่สำหรับกดถ่ายรูป */}
            {!isFull && (
              <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={!isCameraReady || countdown !== null}
                  aria-label="Take Photo"
                  className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-4 border-white bg-pink-500 text-white shadow-2xl shadow-pink-500/50 transition active:scale-90 hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    aria-hidden="true"
                  >
                    <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 2. โซนเลือกโทนสีหลายๆ โทน (Color Tones) อยู่ใต้กล้องตามที่ต้องการ */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-zinc-400 uppercase">
                🎨 โทนสีรูปภาพ / COLOR TONES
              </span>
              <span className="text-[11px] sm:text-xs text-pink-400 font-medium">
                {activeTone.name} ({activeTone.labelEn})
              </span>
            </div>

            {/* แถบชิปโทนสีเลื่อนแนวนอน */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-pan-x">
              {PHOTO_TONES.map((tone) => {
                const isSelected = tone.id === selectedToneId;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedToneId(tone.id)}
                    className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? "border-pink-500 bg-pink-500/20 text-white shadow-md shadow-pink-500/30"
                        : "border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-white/30"
                      style={{ backgroundColor: tone.previewColor }}
                    />
                    <span>{tone.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. แถบภาพด้านล่าง (Filmstrip Selector) แสดงรูปที่ถ่ายแล้ว */}
          <div className="flex flex-col gap-1.5 pt-0.5 sm:pt-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-zinc-400 uppercase">
                📸 รูปที่ถ่ายแล้ว ({photos.length} / {MAX_BOOTH_SHOTS})
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-500">
                ถ่ายได้สูงสุด {MAX_BOOTH_SHOTS} ช็อต
              </span>
            </div>

            {/* แถบรูปภาพแนวนอนเลื่อนได้ */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-2 sm:p-2.5 no-scrollbar touch-pan-x min-h-[76px] sm:min-h-[96px]">
              {photos.length === 0 ? (
                <div className="flex w-full items-center justify-center py-3 text-xs text-zinc-500 font-mono">
                  แตะปุ่มชัตเตอร์เพื่อเริ่มถ่ายภาพแรก...
                </div>
              ) : (
                photos.map((shot, idx) => (
                  <div
                    key={shot.id}
                    className="group relative h-16 w-24 sm:h-20 sm:w-28 md:h-24 md:w-32 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border-2 border-zinc-700 shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.dataUrl}
                      alt={`Shot ${idx + 1}`}
                      className="h-full w-full object-cover"
                      style={{ filter: activeTone.cssFilter }}
                    />
                    <span className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-sm">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteShot(shot.id)}
                      title="ลบเพื่อถ่ายใหม่"
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/80 text-[10px] text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ฝั่งขวา: พรีวิวแถบรูปที่กำลังเติมเต็ม + ปุ่มชัตเตอร์ & ปุ่มถัดไป */}
        <div className="flex w-full flex-col items-center gap-3 sm:gap-4 landscape:w-[360px] lg:landscape:w-[420px] landscape:shrink-0">
          
          {/* พรีวิวแถบรูปตามกรอบที่เลือก (แสดง 2 แถบคู่สำหรับแนวตั้ง) */}
          <div className="flex flex-col items-center gap-2">
            {orientation === "vertical" ? (
              <div className="flex items-center justify-center gap-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-2.5 shadow-2xl backdrop-blur-md">
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  />
                </div>
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-md">
                <StripPreview
                  frame={frame}
                  photos={photos}
                  filterCss={activeTone.cssFilter}
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* แถบล่าง: Back ซ้ายล่าง • Next ขวาล่าง */}
      <div className="flex w-full max-w-7xl shrink-0 items-center justify-between gap-2.5 px-3 py-2 sm:px-6 sm:py-3 border-t border-zinc-800">
        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex min-h-11 sm:min-h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 px-5 sm:px-7 text-xs sm:text-sm font-bold tracking-wider text-zinc-200 uppercase shadow-lg transition active:scale-95 hover:bg-zinc-700 hover:text-white"
        >
          ← Back
        </Link>

        {canProceed ? (
          <Link
            href={`/result?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-11 sm:min-h-12 items-center justify-center rounded-full bg-pink-500 px-6 sm:px-9 text-xs sm:text-base font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 animate-pulse"
          >
            ไปหน้าแต่งรูป & ปริ้นต์ (Next) →
          </Link>
        ) : (
          <div className="text-xs font-mono text-zinc-500">
            ถ่ายอย่างน้อย {frame.shotCount} ช็อต เพื่อไปต่อ
          </div>
        )}
      </div>
    </div>
  );
}
