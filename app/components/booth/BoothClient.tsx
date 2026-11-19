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
import {
  clearMotionFrames,
  saveMotionFrames,
  saveSessionPhotos,
  loadSessionPhotos,
} from "@/lib/mediaStore";
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

    // ลองโหลดรูปเดิมจาก IndexedDB ก่อน ถ้ามี
    loadSessionPhotos().then((stored) => {
      if (stored && stored.length > 0) {
        setPhotos(stored);
      } else {
        try {
          const raw = sessionStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as PhotoShot[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPhotos(parsed);
            }
          }
        } catch {}
      }
    });
  }, []);

  // บันทึกรูปที่ถ่ายลงทั้ง IndexedDB (ไม่จำกัดโควต้า 5MB) และ sessionStorage เป็น backup
  useEffect(() => {
    void saveSessionPhotos(photos);
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(photos.slice(0, frame.shotCount))
      );
      sessionStorage.setItem(SELECTED_TONE_KEY, selectedToneId);
    } catch {
      // ข้ามถ้า sessionStorage เต็ม (IndexedDB จะเป็นตัวเก็บหลักที่ปลอดภัย 100%)
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

    // จำกัดความกว้าง/สูงสูงสุดที่ 1440px เพื่อให้ภาพคมชัดระดับการพิมพ์ 300 DPI
    // แต่ขนาดไฟล์กระทัดรัด (~180-250KB) ไม่ทำให้เกิด Memory/Storage Quota Overflow บนมือถือ
    const maxDimension = 1440;
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
        targetHeight = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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

  const handleDeleteShot = (targetIndex: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== targetIndex));
  };

  const canProceed = photos.length >= frame.shotCount;
  const isFull = photos.length >= frame.shotCount;

  return (
    <div className="flex min-h-0 md:h-full w-full max-w-7xl flex-1 flex-col justify-between gap-2 sm:gap-2.5 select-none touch-manipulation font-sans">
      {/* 1. Top Bar: Studio Booth Brand + Shot Status + Controls */}
      <header className="flex w-full shrink-0 items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
        {/* Brand & Shot Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 font-black tracking-widest text-white uppercase">
            <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-pink-500 font-mono text-xs sm:text-sm font-bold text-white shadow-md shadow-pink-500/40">
              ◉
            </span>
            <span className="font-extrabold tracking-wide text-white text-xs sm:text-base hidden min-[360px]:inline">
              STUDIO BOOTH
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-pink-500/60 bg-pink-500/20 px-2.5 sm:px-3 py-1 font-bold text-[11px] sm:text-xs text-pink-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
            <span>
              ช็อตที่ {photos.length < frame.shotCount ? photos.length + 1 : frame.shotCount}/{frame.shotCount}
            </span>
          </div>
        </div>

        {/* Action Controls for Touchscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ปุ่มดูพรีวิวรูปบนมือถือ (แสดงเฉพาะหน้าจอแนวตั้ง / portrait) */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex landscape:hidden h-10 sm:h-12 items-center gap-1.5 rounded-full border border-pink-500/60 bg-pink-500/20 px-3 sm:px-4 text-xs sm:text-sm font-bold text-pink-200 shadow-md active:scale-90 touch-manipulation cursor-pointer"
          >
            <span>🎞️</span>
            <span>พรีวิว ({photos.length}/{frame.shotCount})</span>
          </button>

          {/* สลับกล้องหน้า/หลัง */}
          <button
            type="button"
            onClick={handleToggleCamera}
            title="สลับกล้องหน้า/หลัง"
            className="inline-flex h-10 sm:h-12 items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-zinc-900/90 px-3.5 sm:px-5 text-xs sm:text-sm lg:text-base font-bold text-zinc-100 shadow-md backdrop-blur-md transition active:scale-90 hover:bg-zinc-800 touch-manipulation cursor-pointer"
          >
            <span className="text-base sm:text-lg">🔄</span>
            <span className="hidden sm:inline">สลับกล้อง</span>
          </button>

          {/* สลับกลับด้าน Mirror */}
          <button
            type="button"
            onClick={() => setIsMirrored((prev) => !prev)}
            title="สลับกระจกสะท้อน"
            className={`inline-flex h-10 sm:h-12 items-center gap-1.5 sm:gap-2 rounded-full border px-3.5 sm:px-5 text-xs sm:text-sm lg:text-base font-bold shadow-md backdrop-blur-md transition active:scale-90 touch-manipulation cursor-pointer ${
              isMirrored
                ? "border-pink-400 bg-pink-500/30 text-pink-100 ring-2 ring-pink-500/50"
                : "border-white/20 bg-zinc-900/90 text-zinc-300"
            }`}
          >
            <span className="text-base sm:text-lg">🪞</span>
            <span className="hidden sm:inline">กระจก:</span>
            <span>{isMirrored ? "เปิด" : "ปิด"}</span>
          </button>

          {/* ปุ่มเต็มหน้าจอสำหรับตู้ Kiosk */}
          <FullscreenButton />
        </div>
      </header>

      {/* 2. Main Stage: กล้องสดชัดเต็มตา + พรีวิวสตริปรูป (ซ่อนในแนวตั้งเพื่อไม่ให้บังกล้อง) */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 landscape:flex-row landscape:items-stretch landscape:justify-center landscape:gap-4">
        
        {/* กล้องสด Live Camera (เด่นเต็มพื้นที่ ทั้งมือถือและจอตู้) */}
        <div className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-zinc-800 bg-black shadow-2xl">
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
            <div className="pointer-events-none absolute inset-x-4 inset-y-4 sm:inset-x-8 sm:inset-y-8 z-10">
              <span className="absolute top-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tl-xl border-t-2 border-l-2 sm:border-t-4 sm:border-l-4 border-white/90" />
              <span className="absolute top-0 right-0 h-6 w-6 sm:h-10 sm:w-10 rounded-tr-xl border-t-2 border-r-2 sm:border-t-4 sm:border-r-4 border-white/90" />
              <span className="absolute bottom-0 left-0 h-6 w-6 sm:h-10 sm:w-10 rounded-bl-xl border-b-2 border-l-2 sm:border-b-4 sm:border-l-4 border-white/90" />
              <span className="absolute right-0 bottom-0 h-6 w-6 sm:h-10 sm:w-10 rounded-br-xl border-r-2 border-b-2 sm:border-r-4 sm:border-b-4 border-white/90" />
            </div>

            <CountdownOverlay secondsLeft={countdown} />
          </CameraView>

          {/* ป้ายบอกสถานะกล้องสด ● LIVE CAMERA */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-pink-500/50 bg-black/75 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-pink-300 backdrop-blur-md shadow-md z-20">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
            <span>LIVE</span>
          </div>

          {/* ป้ายบอกโทนสีที่กำลังใช้งาน */}
          <div className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-zinc-100 backdrop-blur-md shadow-md z-20">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: activeTone.previewColor }}
            />
            <span>{activeTone.name}</span>
          </div>

          {/* ปุ่มชัตเตอร์ขนาดใหญ่พิเศษสำหรับจอทัชสกรีน */}
          {!isFull ? (
            <div className="absolute inset-x-0 bottom-3 sm:bottom-5 flex flex-col items-center justify-center gap-2 z-20">
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={!isCameraReady || countdown !== null}
                aria-label="Take Photo"
                className="group relative flex h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-pink-600 via-pink-500 to-rose-400 text-white shadow-2xl shadow-pink-500/70 transition active:scale-90 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 select-none touch-manipulation cursor-pointer ring-4 ring-pink-500/30"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 transition group-active:scale-90"
                  aria-hidden="true"
                >
                  <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" />
                </svg>
              </button>
              <span className="rounded-full bg-black/85 px-4 py-1 font-black text-xs sm:text-sm lg:text-base text-white backdrop-blur-md shadow-xl border border-white/20">
                แตะเพื่อถ่ายรูป
              </span>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-center gap-2 z-20 px-2">
              <div className="rounded-full border-2 border-emerald-400 bg-black/90 px-6 py-2 text-sm sm:text-base lg:text-lg font-black text-emerald-300 shadow-2xl backdrop-blur-md text-center">
                ✓ ถ่ายครบ {frame.shotCount} ช็อตแล้ว พร้อมไปต่อ 🎉
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="landscape:hidden rounded-full border border-pink-400/80 bg-pink-500/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-pink-200 backdrop-blur-md shadow-md active:scale-95 cursor-pointer"
              >
                🎞️ แตะดูตัวอย่างรูปสตริป (Preview)
              </button>
            </div>
          )}
        </div>

        {/* ฝั่งขวา: พรีวิวสตริปรูปจริง (STRIP PREVIEW)
            - บนแนวนอน (Landscape / Kiosk / PC): แสดงอยู่ข้างกล้องตามปกติ
            - บนแนวตั้ง (Portrait / Mobile): ซ่อนไว้เพื่อไม่ให้แย่งพื้นที่กล้อง แต่เปิดดูได้ผ่านปุ่ม "🎞️ พรีวิว"
        */}
        <div className="hidden landscape:flex shrink-0 flex-col items-center justify-between gap-2 rounded-2xl sm:rounded-3xl border-2 border-zinc-800 bg-zinc-950/90 p-3 sm:p-3.5 shadow-2xl backdrop-blur-md landscape:w-auto landscape:self-stretch">
          <div className="flex w-full items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-black tracking-wider text-pink-400 uppercase">
              🎞️ STRIP PREVIEW
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-200">
              {photos.length} / {frame.shotCount}
            </span>
          </div>

          {/* กรอบรูปสตริป */}
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

          <span className="text-xs font-bold text-zinc-400 text-center">
            {orientation === "vertical"
              ? "พิมพ์ 2 แถบคู่ (Dual Strip ซ้าย-ขวา)"
              : "พิมพ์ 2 แถบคู่ (Dual Strip บน-ล่าง)"}
          </span>
        </div>

      </div>

      {/* 3. แถบเลือกโทนสี (COLOR TONES) สำหรับ Touchscreen */}
      <div className="flex shrink-0 items-center justify-center w-full rounded-2xl sm:rounded-3xl border-2 border-zinc-800/90 bg-zinc-950/90 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl backdrop-blur-md">
        {/* แถบชิปโทนสี แตะเลื่อนได้สำหรับ Touchscreen */}
        <div className="flex w-full items-center justify-start sm:justify-center gap-2 sm:gap-2.5 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar touch-pan-x">
          {PHOTO_TONES.map((tone) => {
            const isSelected = tone.id === selectedToneId;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => setSelectedToneId(tone.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3.5 py-1.5 sm:px-4.5 sm:py-2 text-xs sm:text-sm lg:text-base font-black transition active:scale-95 touch-manipulation cursor-pointer ${
                  isSelected
                    ? "border-pink-500 bg-pink-500/35 text-white shadow-lg ring-3 ring-pink-500/40"
                    : "border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-white/60 shrink-0 shadow-xs"
                  style={{ backgroundColor: tone.previewColor }}
                />
                <span>{tone.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Footer: Back Button ซ้ายล่าง • Next Button ขวาล่าง ขนาดใหญ่ทัชง่าย */}
      <div className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-zinc-800/80 pt-2 pb-1">
        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex h-14 sm:h-16 lg:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-700 bg-zinc-900 px-6 sm:px-8 text-sm sm:text-base lg:text-lg font-black text-zinc-200 shadow-md transition active:scale-95 hover:bg-zinc-800 hover:text-white touch-manipulation cursor-pointer"
        >
          ← เปลี่ยนกรอบ (Back)
        </Link>

        {canProceed ? (
          <Link
            href={`/result?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex h-14 sm:h-16 lg:h-18 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 sm:px-12 text-base sm:text-lg lg:text-xl font-black text-white uppercase shadow-xl shadow-pink-500/40 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            ไปแต่งรูป & ปริ้นต์ (Next) →
          </Link>
        ) : (
          <div className="text-sm sm:text-base lg:text-lg font-black text-pink-300">
            ถ่ายอีก {frame.shotCount - photos.length} ช็อต เพื่อไปต่อ
          </div>
        )}
      </div>

      {/* 5. Mobile Strip Preview Modal (สำหรับดูตัวอย่างแถบรูปบนมือถือในแนวตั้ง) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
          <div className="relative flex max-h-[92dvh] w-full max-w-sm flex-col items-center justify-between gap-2.5 rounded-3xl border border-zinc-700 bg-zinc-950 p-3.5 shadow-2xl">
            <div className="flex w-full items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-pink-400">🎞️ ตัวอย่างแถบรูป (Strip Preview)</span>
                <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-bold text-pink-300">
                  {photos.length}/{frame.shotCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto py-2">
              <div className="flex items-center justify-center gap-2">
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
            </div>

            <span className="text-[11px] text-zinc-400 text-center">
              {orientation === "vertical"
                ? "พิมพ์ 2 แถบคู่ (Dual Strip ซ้าย-ขวา)"
                : "พิมพ์ 2 แถบคู่ (Dual Strip บน-ล่าง)"}
            </span>

            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="w-full rounded-full bg-gradient-to-r from-pink-600 to-rose-600 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg transition active:scale-95 cursor-pointer"
            >
              ปิดหน้าต่างพรีวิว
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
