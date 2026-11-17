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
    <div className="flex h-full w-full max-w-7xl flex-1 flex-col justify-between gap-2.5 overflow-hidden select-none touch-manipulation font-sans">
      {/* 1. Kiosk Top Bar: Studio Booth Brand + Shot Status + Controls ขนาดใหญ่สำหรับทัชสกรีน */}
      <header className="flex w-full shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 pb-2.5">
        {/* Brand & Shot Status */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-widest text-white uppercase">
            <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-pink-500 font-mono text-sm font-bold text-white shadow-lg shadow-pink-500/40">
              ◉
            </span>
            <span className="font-extrabold tracking-wide text-white text-base sm:text-lg">STUDIO BOOTH</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-pink-500/60 bg-pink-500/20 px-4 py-1.5 font-bold text-xs sm:text-sm text-pink-200 shadow-md">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-400 animate-pulse" />
            <span>
              ช็อตที่ {photos.length < frame.shotCount ? photos.length + 1 : frame.shotCount} / {frame.shotCount}
            </span>
          </div>
        </div>

        {/* Action Controls for Touchscreen (ปุ่มใหญ่ แตะง่าย ไม่ต้องเล็ง) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* สลับกล้องหน้า/หลัง (สำหรับ iPad หรือแท็บเล็ตที่มี 2 กล้อง) */}
          <button
            type="button"
            onClick={handleToggleCamera}
            title="สลับกล้องหน้า/หลัง"
            className="inline-flex min-h-13 sm:min-h-14 items-center gap-2 rounded-full border-2 border-white/30 bg-zinc-900/90 px-5 sm:px-6 text-sm sm:text-base font-black text-zinc-100 shadow-xl backdrop-blur-md transition active:scale-90 hover:bg-zinc-800 touch-manipulation cursor-pointer"
          >
            <span className="text-lg">🔄</span>
            <span>สลับกล้อง</span>
          </button>

          {/* สลับกลับด้าน Mirror */}
          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            className={`inline-flex min-h-13 sm:min-h-14 items-center rounded-full border-2 px-5 sm:px-6 text-sm sm:text-base font-black uppercase shadow-xl backdrop-blur-md transition active:scale-90 touch-manipulation cursor-pointer ${
              isMirrored
                ? "border-pink-400 bg-pink-500/30 text-pink-100 ring-2 ring-pink-500/50"
                : "border-white/30 bg-zinc-900/90 text-zinc-200"
            }`}
          >
            กระจก {isMirrored ? "เปิด (ON)" : "ปิด (OFF)"}
          </button>

          {/* ปุ่มเต็มหน้าจอสำหรับตู้ Kiosk */}
          <FullscreenButton />
        </div>
      </header>

      {/* 2. Main Stage (หน้าจอกลางแบบตู้ Kiosk): กล้องสดขยายเต็มฝั่งซ้าย + พรีวิวสตริปรูปฝั่งขวา */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 landscape:flex-row landscape:items-stretch landscape:justify-center landscape:gap-4 overflow-hidden">
        
        {/* ฝั่งซ้าย: กล้องสด Live Camera โดดเด่น ชัดเจน เต็มตา */}
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-zinc-800 bg-black shadow-2xl">
          <CameraView
            videoRef={videoRef}
            isMirrored={isMirrored}
            facingMode={facingMode}
            filterCss={activeTone.cssFilter}
            isFlashing={isFlashing}
            fullScreen
            onCameraStateChange={handleCameraStateChange}
          >
            {/* มุมกรอบเล็งกล้องสีขาว 4 มุม เส้นหนาชัดเจน */}
            <div className="pointer-events-none absolute inset-x-8 inset-y-8 sm:inset-x-12 sm:inset-y-12 z-10">
              <span className="absolute top-0 left-0 h-8 w-8 sm:h-12 sm:w-12 rounded-tl-2xl border-t-4 border-l-4 sm:border-t-5 sm:border-l-5 border-white/95" />
              <span className="absolute top-0 right-0 h-8 w-8 sm:h-12 sm:w-12 rounded-tr-2xl border-t-4 border-r-4 sm:border-t-5 sm:border-r-5 border-white/95" />
              <span className="absolute bottom-0 left-0 h-8 w-8 sm:h-12 sm:w-12 rounded-bl-2xl border-b-4 border-l-4 sm:border-b-5 sm:border-l-5 border-white/95" />
              <span className="absolute right-0 bottom-0 h-8 w-8 sm:h-12 sm:w-12 rounded-br-2xl border-r-4 border-b-4 sm:border-r-5 sm:border-b-5 border-white/95" />
            </div>

            <CountdownOverlay secondsLeft={countdown} />
          </CameraView>

          {/* ป้ายบอกสถานะกล้องสด ● LIVE CAMERA ตัวอักษรใหญ่ */}
          <div className="pointer-events-none absolute top-3.5 left-3.5 flex items-center gap-2 rounded-full border border-pink-500/50 bg-black/80 px-4 py-1.5 text-xs sm:text-sm font-bold text-pink-300 backdrop-blur-md shadow-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span>กล้องสด (LIVE)</span>
          </div>

          {/* ป้ายบอกโทนสีที่กำลังใช้งาน */}
          <div className="pointer-events-none absolute top-3.5 right-3.5 flex items-center gap-2 rounded-full border border-white/30 bg-black/80 px-4 py-1.5 text-xs sm:text-sm font-bold text-zinc-100 backdrop-blur-md shadow-lg">
            <span
              className="h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: activeTone.previewColor }}
            />
            <span>โทน: {activeTone.name}</span>
          </div>

          {/* ปุ่มชัตเตอร์ขนาดใหญ่พิเศษ (Huge Touch Target) แตะถ่ายง่ายที่สุดบนจอทัชสกรีน */}
          {!isFull ? (
            <div className="absolute inset-x-0 bottom-4 sm:bottom-6 flex flex-col items-center justify-center gap-2 z-20">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={!isCameraReady || countdown !== null}
                aria-label="Take Photo"
                className="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-pink-600 via-pink-500 to-rose-400 text-white shadow-2xl shadow-pink-500/80 transition active:scale-90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 select-none touch-manipulation cursor-pointer"
              >
                {/* วงแหวนเรืองแสงรอบปุ่มชัตเตอร์ */}
                <span className="pointer-events-none absolute -inset-3 rounded-full border-2 border-pink-400 animate-ping opacity-60" />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-12 w-12 sm:h-14 sm:w-14 transition group-active:scale-90"
                  aria-hidden="true"
                >
                  <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" />
                </svg>
              </button>
              <span className="rounded-full bg-black/85 px-4 py-1.5 font-black text-sm sm:text-base text-white backdrop-blur-md shadow-lg border border-white/20">
                แตะเพื่อถ่ายรูป
              </span>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center z-20">
              <div className="rounded-full border-2 border-emerald-400 bg-black/90 px-8 py-3 text-base sm:text-lg font-black text-emerald-300 shadow-2xl backdrop-blur-md">
                ✓ ถ่ายครบ {frame.shotCount} ช็อตแล้ว พร้อมไปต่อ 🎉
              </div>
            </div>
          )}
        </div>

        {/* ฝั่งขวา: พรีวิวสตริปรูปจริง (STRIP PREVIEW) จัดวางเรียบหรู ชัดเจน */}
        <div className="flex shrink-0 flex-col items-center justify-between gap-2 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/85 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md landscape:w-auto landscape:self-stretch">
          <div className="flex w-full items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-pink-400 uppercase">
              🎞️ ตัวอย่างรูปจริง (STRIP PREVIEW)
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-300">
              {photos.length} / {frame.shotCount}
            </span>
          </div>

          {/* กรอบรูปสตริป (แสดง 2 แถบคู่สำหรับทั้งแนวตั้งและแนวนอน) */}
          <div className="flex flex-1 items-center justify-center">
            {orientation === "vertical" ? (
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
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
              <div className="flex flex-col items-center justify-center gap-2 sm:gap-2.5">
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

          <span className="text-xs font-medium text-zinc-400 text-center">
            {orientation === "vertical"
              ? "พิมพ์ 2 แถบคู่ (Dual Strip ซ้าย-ขวา)"
              : "พิมพ์ 2 แถบคู่ (Dual Strip บน-ล่าง)"}
          </span>
        </div>

      </div>

      {/* 3. แถบควบคุมจอทัชสกรีนด้านล่าง (Touchscreen Dock): โทนสี + ช่องเลือกรูปช็อต ปุ่มใหญ่ทัชง่าย */}
      <div className="flex shrink-0 flex-col gap-3 rounded-2xl sm:rounded-3xl border border-zinc-800/90 bg-zinc-950/90 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
        
        {/* แถวที่ 1: 🎨 โทนสีรูปภาพ (COLOR TONES) สำหรับแตะเปลี่ยนสดๆ */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide text-zinc-100">
              <span>🎨 เลือกโทนสี (COLOR TONES)</span>
            </div>
            <span className="text-sm sm:text-base text-pink-400 font-black">
              {activeTone.name} ({activeTone.labelEn})
            </span>
          </div>

          {/* แถบชิปโทนสี แตะเลื่อนได้สำหรับ Touchscreen (ปุ่มใหญ่พิเศษ กดติดง่ายด้วยนิ้วมือ) */}
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-pan-x">
            {PHOTO_TONES.map((tone) => {
              const isSelected = tone.id === selectedToneId;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setSelectedToneId(tone.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-full border-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-black transition active:scale-90 touch-manipulation cursor-pointer ${
                    isSelected
                      ? "border-pink-500 bg-pink-500/35 text-white shadow-xl shadow-pink-500/40 ring-2 ring-pink-500/60"
                      : "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <span
                    className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white/60 shrink-0 shadow-sm"
                    style={{ backgroundColor: tone.previewColor }}
                  />
                  <span>{tone.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* แถวที่ 2: 📸 แถบเลือกรูปแต่ละช็อต (TOUCH FILMSTRIP) เหมือนตู้ทัชสกรีน */}
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide text-zinc-100">
              <span>📸 ภาพแต่ละช็อต ({photos.length} / {frame.shotCount})</span>
            </div>
            <span className="text-xs sm:text-sm text-zinc-300 font-bold">
              {photos.length >= frame.shotCount
                ? "ถ่ายครบทุกช็อตแล้ว แตะปุ่ม 'ถัดไป' ด้านล่างได้เลย"
                : "แตะชัตเตอร์วงกลมสีชมพูด้านบนเพื่อถ่ายภาพ"}
            </span>
          </div>

          {/* แสดงช็อต 1 ถึง shotCount ครบทุกช่องตามแบบตู้ Photobooth ทัชสกรีน */}
          <div className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-2.5 sm:p-3 no-scrollbar touch-pan-x">
            {Array.from({ length: frame.shotCount }).map((_, idx) => {
              const shot = photos[idx];
              const isCurrent = idx === photos.length;
              return (
                <div
                  key={`slot-${idx}`}
                  className={`relative h-20 w-28 sm:h-24 sm:w-34 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                    shot
                      ? "border-zinc-600 bg-black shadow-lg"
                      : isCurrent
                      ? "border-dashed border-pink-500 bg-pink-500/20 animate-pulse ring-2 ring-pink-500/40"
                      : "border-dashed border-zinc-800 bg-zinc-900/50 opacity-60"
                  }`}
                >
                  {shot ? (
                    <div className="relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.dataUrl}
                        alt={`Shot ${idx + 1}`}
                        className="h-full w-full object-cover"
                        style={{ filter: activeTone.cssFilter }}
                      />
                      <span className="absolute top-1 left-1 rounded-lg bg-black/85 px-2 py-0.5 text-xs font-black text-white shadow">
                        #{idx + 1}
                      </span>
                      {/* ปุ่มลบเพื่อถ่ายใหม่ แสดงตลอดเวลาบนทัชสกรีน (ไม่มี hover) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteShot(shot.id)}
                        title="แตะเพื่อลบและถ่ายช็อตนี้ใหม่"
                        className="absolute top-1 right-1 flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-lg transition active:scale-90 hover:bg-rose-500 touch-manipulation cursor-pointer border border-white/20"
                      >
                        ✕ ลบ
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                      <span className="text-sm sm:text-base font-black text-zinc-200">
                        ช็อตที่ {idx + 1}
                      </span>
                      <span className={`text-xs font-bold ${isCurrent ? "text-pink-400" : "text-zinc-500"}`}>
                        {isCurrent ? "● รอถ่าย" : "ว่าง"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Bottom Footer: Back Button ซ้ายล่าง • Next Button ขวาล่าง ปุ่มใหญ่พิเศษสำหรับทัชสกรีน */}
      <div className="flex w-full shrink-0 items-center justify-between gap-4 border-t border-zinc-800/80 pt-3">
        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900 px-8 sm:px-10 text-base sm:text-lg font-black text-zinc-200 shadow-xl transition active:scale-95 hover:bg-zinc-800 hover:text-white touch-manipulation cursor-pointer"
        >
          ← เปลี่ยนกรอบ (Back)
        </Link>

        {canProceed ? (
          <Link
            href={`/result?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-10 sm:px-16 text-lg sm:text-2xl font-black text-white uppercase shadow-2xl shadow-pink-500/50 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 animate-pulse touch-manipulation cursor-pointer"
          >
            ไปหน้าแต่งรูป & ปริ้นต์ (Next) →
          </Link>
        ) : (
          <div className="text-base sm:text-lg font-black text-zinc-300">
            ถ่ายอีก {frame.shotCount - photos.length} ช็อต เพื่อไปต่อ
          </div>
        )}
      </div>
    </div>
  );
}
