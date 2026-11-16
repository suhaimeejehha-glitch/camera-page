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
      if (prev.length >= frame.shotCount) return prev;
      return [...prev, { id: `shot-${Date.now()}`, dataUrl }];
    });
  }, [frame.shotCount, isMirrored]);

  const handleTakePhoto = () => {
    if (!isCameraReady || countdown !== null || photos.length >= frame.shotCount) {
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
  const isFull = photos.length >= frame.shotCount;

  return (
    <div className="flex h-full w-full max-w-7xl flex-1 flex-col justify-between gap-2 overflow-hidden select-none touch-manipulation">
      {/* 1. Kiosk Top Bar: Studio Booth Brand + Shot Status + Controls */}
      <header className="flex w-full shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        {/* Brand & Shot Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-widest text-white uppercase">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 font-mono text-xs text-white shadow-md shadow-pink-500/40">
              ◉
            </span>
            <span className="font-extrabold tracking-wider">STUDIO BOOTH</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-pink-500/50 bg-pink-500/15 px-3 py-1 font-mono text-xs font-bold text-pink-300">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span>
              ช็อตที่ {photos.length < frame.shotCount ? photos.length + 1 : frame.shotCount} / {frame.shotCount}
            </span>
          </div>
        </div>

        {/* Action Controls for Touchscreen */}
        <div className="flex items-center gap-2">
          {/* สลับกล้องหน้า/หลัง (สำหรับ iPad หรือแท็บเล็ตที่มี 2 กล้อง) */}
          <button
            type="button"
            onClick={handleToggleCamera}
            title="สลับกล้องหน้า/หลัง"
            className="inline-flex min-h-9 sm:min-h-10 items-center gap-1.5 rounded-full border border-white/20 bg-zinc-900/80 px-3 sm:px-3.5 font-mono text-xs font-bold text-zinc-200 backdrop-blur-md transition active:scale-95 hover:bg-zinc-800"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">FLIP</span>
          </button>

          {/* สลับกลับด้าน Mirror */}
          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            className={`inline-flex min-h-9 sm:min-h-10 items-center rounded-full border px-3 sm:px-3.5 font-mono text-xs font-bold uppercase backdrop-blur-md transition active:scale-95 ${
              isMirrored
                ? "border-pink-400/80 bg-pink-500/25 text-pink-200"
                : "border-white/20 bg-zinc-900/80 text-zinc-300"
            }`}
          >
            Mirror {isMirrored ? "ON" : "OFF"}
          </button>

          {/* ปุ่มเต็มหน้าจอสำหรับตู้ Kiosk */}
          <FullscreenButton />
        </div>
      </header>

      {/* 2. Main Stage (หน้าจอกลางแบบตู้ Kiosk): กล้องสดขยายเต็มฝั่งซ้าย + พรีวิวสตริปรูปฝั่งขวา */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 landscape:flex-row landscape:items-stretch landscape:justify-center landscape:gap-4 overflow-hidden">
        
        {/* ฝั่งซ้าย: กล้องสด Live Camera โดดเด่น ชัดเจน เต็มจอทัชสกรีน */}
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800 bg-black shadow-2xl">
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
            <div className="pointer-events-none absolute inset-x-6 inset-y-6 sm:inset-x-10 sm:inset-y-10 z-10">
              <span className="absolute top-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tl-xl border-t-4 border-l-4 border-white/90" />
              <span className="absolute top-0 right-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tr-xl border-t-4 border-r-4 border-white/90" />
              <span className="absolute bottom-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-bl-xl border-b-4 border-l-4 border-white/90" />
              <span className="absolute right-0 bottom-0 h-6 w-6 sm:h-10 sm:w-10 rounded-br-xl border-r-4 border-b-4 border-white/90" />
            </div>

            <CountdownOverlay secondsLeft={countdown} />
          </CameraView>

          {/* ป้ายบอกสถานะกล้องสด ● LIVE CAMERA */}
          <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-black/75 px-3 py-1 text-[11px] font-bold text-pink-300 backdrop-blur-md sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span>LIVE CAMERA</span>
          </div>

          {/* ป้ายบอกโทนสีที่กำลังใช้งาน */}
          <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1 font-mono text-[11px] font-bold text-zinc-200 backdrop-blur-md sm:text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: activeTone.previewColor }}
            />
            <span>{activeTone.name}</span>
          </div>

          {/* ปุ่มชัตเตอร์ขนาดใหญ่พิเศษสำหรับจอทัชสกรีน แตะถ่ายง่าย */}
          {!isFull ? (
            <div className="absolute inset-x-0 bottom-3 sm:bottom-4 flex items-center justify-center z-20">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={!isCameraReady || countdown !== null}
                aria-label="Take Photo"
                className="group relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-4 border-white bg-pink-500 text-white shadow-2xl shadow-pink-500/60 transition active:scale-90 hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40 select-none touch-manipulation cursor-pointer"
              >
                {/* วงแหวนสะท้อนแสงรอบปุ่มชัตเตอร์ */}
                <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-pink-400/50 animate-ping opacity-60" />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-8 w-8 sm:h-9 sm:w-9 transition group-active:scale-95"
                  aria-hidden="true"
                >
                  <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center z-20">
              <div className="rounded-full border border-emerald-500/60 bg-black/85 px-4 py-1.5 font-mono text-xs font-bold text-emerald-400 shadow-xl backdrop-blur-md">
                ✓ ถ่ายครบ {frame.shotCount} ช็อตแล้ว พร้อมไปต่อ
              </div>
            </div>
          )}
        </div>

        {/* ฝั่งขวา: พรีวิวสตริปรูปจริง (STRIP PREVIEW) จัดวางเรียบหรู ดูง่าย */}
        <div className="flex shrink-0 flex-col items-center justify-between gap-1.5 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/85 p-2 sm:p-2.5 shadow-2xl backdrop-blur-md landscape:w-auto landscape:self-stretch">
          <div className="flex w-full items-center justify-between px-1">
            <span className="text-[11px] font-mono font-bold tracking-wider text-pink-400 uppercase">
              🎞️ STRIP PREVIEW
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {photos.length} / {frame.shotCount}
            </span>
          </div>

          {/* กรอบรูปสตริป (แสดง 2 แถบคู่สำหรับทั้งแนวตั้งและแนวนอน) */}
          <div className="flex flex-1 items-center justify-center">
            {orientation === "vertical" ? (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                    compact
                  />
                </div>
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                    compact
                  />
                </div>
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                    compact
                  />
                </div>
              </div>
            )}
          </div>

          <span className="text-[10px] text-zinc-500 font-mono text-center">
            {orientation === "vertical"
              ? "พิมพ์ 2 แถบคู่ (Dual Strip ซ้าย-ขวา)"
              : "พิมพ์ 2 แถบคู่ (Dual Strip บน-ล่าง)"}
          </span>
        </div>

      </div>

      {/* 3. แถบควบคุมจอทัชสกรีนด้านล่าง (Touchscreen Dock): โทนสี + ช่องเลือกรูปช็อต */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-zinc-950/85 p-2 sm:p-3 shadow-2xl backdrop-blur-md">
        
        {/* แถวที่ 1: 🎨 โทนสีรูปภาพ (COLOR TONES) สำหรับแตะเปลี่ยนสดๆ */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-zinc-300 uppercase">
              <span>🎨 โทนสีรูปภาพ / COLOR TONES</span>
            </div>
            <span className="text-[11px] sm:text-xs text-pink-400 font-medium">
              {activeTone.name} ({activeTone.labelEn})
            </span>
          </div>

          {/* แถบชิปโทนสี แตะเลื่อนได้สำหรับ Touchscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar touch-pan-x">
            {PHOTO_TONES.map((tone) => {
              const isSelected = tone.id === selectedToneId;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setSelectedToneId(tone.id)}
                  className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-bold transition active:scale-95 touch-manipulation cursor-pointer ${
                    isSelected
                      ? "border-pink-500 bg-pink-500/25 text-white shadow-md shadow-pink-500/30 ring-1 ring-pink-500/50"
                      : "border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-white/40 shrink-0"
                    style={{ backgroundColor: tone.previewColor }}
                  />
                  <span>{tone.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* แถวที่ 2: 📸 แถบเลือกรูปแต่ละช็อต (TOUCH FILMSTRIP) เหมือนตู้ทัชสกรีน */}
        <div className="flex flex-col gap-1 pt-1 border-t border-zinc-900">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-zinc-300 uppercase">
              <span>📸 แถบรูปแต่ละช็อต ({photos.length} / {frame.shotCount})</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-400">
              {photos.length >= frame.shotCount
                ? "ถ่ายครบแล้ว พร้อมไปต่อ 🎉"
                : "แตะชัตเตอร์เพื่อถ่ายภาพต่อไป"}
            </span>
          </div>

          {/* แสดงช็อต 1 ถึง shotCount ครบทุกช่องตามแบบตู้ Photobooth ทัชสกรีน */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto rounded-xl sm:rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-1.5 sm:p-2 no-scrollbar touch-pan-x">
            {Array.from({ length: frame.shotCount }).map((_, idx) => {
              const shot = photos[idx];
              const isCurrent = idx === photos.length;
              return (
                <div
                  key={`slot-${idx}`}
                  className={`relative h-14 w-20 sm:h-16 sm:w-24 md:h-18 md:w-28 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border transition ${
                    shot
                      ? "border-zinc-700 bg-black shadow-md"
                      : isCurrent
                      ? "border-dashed border-pink-500 bg-pink-500/15 animate-pulse"
                      : "border-dashed border-zinc-800 bg-zinc-900/40 opacity-50"
                  }`}
                >
                  {shot ? (
                    <div className="group relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.dataUrl}
                        alt={`Shot ${idx + 1}`}
                        className="h-full w-full object-cover"
                        style={{ filter: activeTone.cssFilter }}
                      />
                      <span className="absolute top-1 left-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-sm">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteShot(shot.id)}
                        title="ลบเพื่อถ่ายช็อตนี้ใหม่"
                        className="absolute top-1 right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-rose-500/90 text-[10px] font-bold text-white shadow transition hover:bg-rose-600 active:scale-90"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center font-mono">
                      <span className="text-[10px] sm:text-xs font-bold text-zinc-400">
                        #{idx + 1}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] ${isCurrent ? "text-pink-400 font-bold" : "text-zinc-500"}`}>
                        {isCurrent ? "รอถ่าย..." : "ว่าง"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Bottom Footer: Back Button ซ้ายล่าง • Next Button ขวาล่าง ปุ่มใหญ่กดง่าย */}
      <div className="flex w-full shrink-0 items-center justify-between gap-2.5 border-t border-zinc-800/80 pt-2">
        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex min-h-11 sm:min-h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 px-5 sm:px-7 text-xs sm:text-sm font-bold tracking-wider text-zinc-200 uppercase shadow-lg transition active:scale-95 hover:bg-zinc-800 hover:text-white touch-manipulation"
        >
          ← เปลี่ยนกรอบ (Back)
        </Link>

        {canProceed ? (
          <Link
            href={`/result?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-11 sm:min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-6 sm:px-9 text-xs sm:text-base font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/40 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 animate-pulse touch-manipulation"
          >
            ไปหน้าแต่งรูป & ปริ้นต์ (Next) →
          </Link>
        ) : (
          <div className="text-xs sm:text-sm font-mono text-zinc-400">
            ถ่ายอีก {frame.shotCount - photos.length} ช็อต เพื่อไปต่อ
          </div>
        )}
      </div>
    </div>
  );
}
