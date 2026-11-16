"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { StripPreview } from "@/app/components/booth/StripPreview";
import { StickerCanvas } from "@/app/components/stickers/StickerCanvas";
import { StickerPicker } from "@/app/components/stickers/StickerPicker";
import {
  getFrameById,
  parseOrientation,
  parseShotCount,
} from "@/lib/frames";
import { STICKERS } from "@/lib/stickers";
import { renderPhotoboothStrip } from "@/lib/canvasRenderer";
import { clearMotionFrames, loadMotionFrames } from "@/lib/mediaStore";
import { createAnimatedGifBlob } from "@/lib/gifBuilder";
import type { PhotoShot, PlacedSticker, StickerItem } from "@/types/photobooth";

const STORAGE_KEY = "photobooth_photos";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface DriveQrState {
  qrDataUrl: string;
  folderUrl: string;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function uploadToGoogleDriveSession(
  photoBlob: Blob,
  gifBlob: Blob | null
): Promise<DriveQrState> {
  const formData = new FormData();
  formData.append("photo", photoBlob, "photo-strip.png");
  if (gifBlob) {
    formData.append("gif", gifBlob, "photo-motion.gif");
  }

  const response = await fetch("/api/upload-drive", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(err?.error ?? "อัปโหลดเข้า Google Drive ไม่สำเร็จ");
  }

  const data = (await response.json()) as { folderUrl: string };
  const qrDataUrl = await QRCode.toDataURL(data.folderUrl, {
    width: 280,
    margin: 1,
    color: {
      dark: "#09090b",
      light: "#ffffff",
    },
  });

  const state: DriveQrState = { qrDataUrl, folderUrl: data.folderUrl };
  try {
    sessionStorage.setItem("photobooth_drive_qr", JSON.stringify(state));
  } catch {
    // ข้ามถ้า storage เต็ม
  }

  return state;
}

export function ResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameIdParam = searchParams.get("frame");
  const shots = parseShotCount(searchParams.get("shots"));
  const orientation = parseOrientation(searchParams.get("orientation"));
  const frame = useMemo(
    () => getFrameById(frameIdParam, shots, orientation),
    [frameIdParam, shots, orientation]
  );

  const [photos, setPhotos] = useState<PhotoShot[]>([]);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null
  );

  const [driveQr, setDriveQr] = useState<DriveQrState | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [gifBlobCache, setGifBlobCache] = useState<Blob | null>(null);

  const [printStripUrl, setPrintStripUrl] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [postPrintSeconds, setPostPrintSeconds] = useState(15);
  const [exportError, setExportError] = useState<string | null>(null);

  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PhotoShot[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPhotos(parsed);
        }
      }
    } catch {
      // ข้ามถ้าอ่าน storage ไม่ได้
    }

    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
    };
  }, []);

  // สร้างไฟล์ GIF ล่วงหน้าไว้รอบเดียว
  useEffect(() => {
    if (photos.length === 0) return;
    let cancelled = false;

    async function prepareGif() {
      try {
        const motionFrames = await loadMotionFrames();
        const blob = await createAnimatedGifBlob(motionFrames, photos);
        if (!cancelled && blob) {
          setGifBlobCache(blob);
        }
      } catch (err) {
        console.error("Prepare GIF error:", err);
      }
    }

    void prepareGif();

    return () => {
      cancelled = true;
    };
  }, [photos]);

  // อัปโหลดเข้า Google Drive ทันทีที่ภาพพร้อม หรือเมื่อลูกค้าติดสติกเกอร์เพิ่ม
  useEffect(() => {
    if (photos.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsUploadingDrive(true);
      setExportError(null);
      try {
        const stripDataUrl = await renderPhotoboothStrip({
          frame,
          photos,
          stickers: placedStickers,
        });
        if (cancelled) return;

        setPrintStripUrl(stripDataUrl);
        const stripBlob = await dataUrlToBlob(stripDataUrl);

        const result = await uploadToGoogleDriveSession(
          stripBlob,
          gifBlobCache
        );
        if (!cancelled) {
          setDriveQr(result);
        }
      } catch (error) {
        console.error("Google Drive upload error:", error);
        if (!cancelled) {
          setExportError("กำลังเตรียม Google Drive กรุณารอสักครู่...");
        }
      } finally {
        if (!cancelled) setIsUploadingDrive(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [frame, photos, placedStickers, gifBlobCache]);

  const selectedSticker =
    placedStickers.find((s) => s.instanceId === selectedStickerId) ?? null;

  const handleAddSticker = (sticker: StickerItem) => {
    const count = placedStickers.length;
    const instanceId = `${sticker.id}-${count}-${Date.now()}`;
    setPlacedStickers((prev) => [
      ...prev,
      {
        instanceId,
        stickerId: sticker.id,
        src: sticker.src,
        x: 30 + ((count * 17) % 45),
        y: 25 + ((count * 15) % 50),
        scale: 1,
        rotation: 0,
      },
    ]);
    setSelectedStickerId(instanceId);
  };

  const handleUpdateSticker = (
    instanceId: string,
    patch: Partial<Pick<PlacedSticker, "x" | "y" | "scale" | "rotation">>
  ) => {
    setPlacedStickers((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId ? { ...item, ...patch } : item
      )
    );
  };

  const handleRemoveSticker = (instanceId: string) => {
    setPlacedStickers((prev) =>
      prev.filter((item) => item.instanceId !== instanceId)
    );
    if (selectedStickerId === instanceId) {
      setSelectedStickerId(null);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setExportError(null);
    setSelectedStickerId(null);
    try {
      const stripDataUrl = await renderPhotoboothStrip({
        frame,
        photos,
        stickers: placedStickers,
      });
      setPrintStripUrl(stripDataUrl);

      if (printTimerRef.current) clearTimeout(printTimerRef.current);
      printTimerRef.current = setTimeout(() => {
        window.print();
        setIsPrinting(false);
        setHasPrinted(true);
        setPostPrintSeconds(15);
      }, 150);
    } catch (error) {
      console.error("Print failed:", error);
      setExportError("ไม่สามารถเตรียมไฟล์สำหรับปริ้นต์ได้ กรุณาลองอีกครั้ง");
      setIsPrinting(false);
    }
  };

  const handleFinishSession = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
    void clearMotionFrames();
    router.replace("/thank-you");
  }, [router]);

  // หลังสั่งปริ้นต์แล้ว หากลูกค้าไม่กดเองจะพาเข้าหน้า Thank You อัตโนมัติใน 15 วินาที
  useEffect(() => {
    if (!hasPrinted || isPrinting) return;

    if (postPrintSeconds <= 0) {
      handleFinishSession();
      return;
    }

    const timer = setTimeout(() => {
      setPostPrintSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasPrinted, isPrinting, postPrintSeconds, handleFinishSession]);

  return (
    <>
      {/* หน้าจอใช้งานปกติบนตู้ (ซ่อนตอนสั่ง Print) */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center print:hidden">
        <BoothHeader
          title="CUSTOMIZE & EXPORT"
          theme="light"
          currentStep={5}
        />

        <div className="flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-evenly gap-5 py-2 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-10">
          {/* ฝั่งซ้าย/บน: ตัวอย่างแถบรูปพร้อมสติกเกอร์ลากย้ายได้ */}
          <div className="flex shrink-0 flex-col items-center gap-2.5">
            <StripPreview frame={frame} photos={photos}>
              <StickerCanvas
                stickers={placedStickers}
                selectedStickerId={selectedStickerId}
                isHorizontal={orientation === "horizontal"}
                onSelectSticker={setSelectedStickerId}
                onUpdateSticker={handleUpdateSticker}
                onRemoveSticker={handleRemoveSticker}
              />
            </StripPreview>
            <p className="text-center font-mono text-xs font-medium text-zinc-600">
              ใช้นิ้วลากสติกเกอร์บนกรอบได้เลย • แตะเพื่อปรับขนาด/หมุน/ลบ
            </p>
          </div>

          {/* ฝั่งขวา/ล่าง: 1 QR Code Google Drive (ด้านบน) + สติกเกอร์ + ปุ่มปริ้นต์เดียว */}
          <div className="flex max-h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-pink-500/10 sm:p-6 landscape:max-w-xl landscape:max-h-[82dvh] portrait:max-h-[48dvh]">
            {/* โซนบนสุด: 1 QR Code สำหรับ Google Drive รวมทั้งรูปภาพและวิดีโอ GIF */}
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-sm">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300 bg-white p-1.5 shadow-inner sm:h-28 sm:w-28">
                {driveQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driveQr.qrDataUrl}
                    alt="Google Drive QR Code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <span className="font-mono text-[10px] font-bold text-emerald-700">
                      {isUploadingDrive ? "กำลังส่งเข้า Drive..." : "เตรียม QR..."}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5 font-mono text-xs font-black tracking-wide text-emerald-950 uppercase sm:text-sm">
                  {/* Google Drive Authentic Logo */}
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
                <p className="text-[11px] text-zinc-600">
                  สแกนเพื่อเปิดดูภาพ (.PNG) และวิดีโอ (.GIF) รวมใน Google Drive ทันที
                </p>
                {driveQr ? (
                  <a
                    href={driveQr.folderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex w-fit items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 font-mono text-[10px] font-bold text-emerald-850 uppercase transition active:scale-95 hover:bg-emerald-200"
                  >
                    ↗ เปิดโฟลเดอร์ Drive
                  </a>
                ) : null}
              </div>
            </div>

            {/* โซนสติกเกอร์ */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="font-mono text-sm font-bold tracking-wider text-zinc-800 uppercase">
                  Add Stickers (Tap to Add)
                </h2>
                {placedStickers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPlacedStickers([]);
                      setSelectedStickerId(null);
                    }}
                    className="min-h-10 rounded-full border border-zinc-200 bg-zinc-50 px-4 font-mono text-xs font-semibold text-zinc-600 transition active:scale-95 hover:border-rose-400 hover:text-rose-600"
                  >
                    Clear All
                  </button>
                ) : null}
              </div>
              <StickerPicker
                stickers={STICKERS}
                onAddSticker={handleAddSticker}
              />
            </div>

            {selectedSticker ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-pink-200 bg-pink-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-wider text-pink-600 uppercase">
                    Selected: {selectedSticker.stickerId}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSticker(selectedSticker.instanceId)
                    }
                    className="min-h-10 rounded-full bg-rose-100 px-4 text-xs font-bold text-rose-600 transition active:scale-95 hover:bg-rose-200"
                  >
                    ลบชิ้นนี้
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">Size</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          scale: clamp(
                            Number((selectedSticker.scale - 0.15).toFixed(2)),
                            0.5,
                            2.2
                          ),
                        })
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg font-bold text-zinc-800 shadow-sm transition active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-mono text-xs font-bold text-zinc-800">
                      {Math.round(selectedSticker.scale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          scale: clamp(
                            Number((selectedSticker.scale + 0.15).toFixed(2)),
                            0.5,
                            2.2
                          ),
                        })
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg font-bold text-zinc-800 shadow-sm transition active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">
                      Rotate
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          rotation: selectedSticker.rotation - 15,
                        })
                      }
                      className="h-11 rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs font-bold text-zinc-800 shadow-sm transition active:scale-95"
                    >
                      ↺ -15°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          rotation: 0,
                        })
                      }
                      className="h-11 rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs font-bold text-zinc-600 shadow-sm transition active:scale-95"
                    >
                      0°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          rotation: selectedSticker.rotation + 15,
                        })
                      }
                      className="h-11 rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs font-bold text-zinc-800 shadow-sm transition active:scale-95"
                    >
                      ↻ +15°
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {exportError ? (
              <p className="text-xs font-medium text-emerald-600">{exportError}</p>
            ) : null}
          </div>
        </div>

        {/* แถบปุ่ม Back (ซ้ายล่าง) และ Print / Next (ขวาล่าง) */}
        <div className="flex w-full max-w-6xl shrink-0 items-center justify-between gap-4 pt-2">
          <Link
            href={`/booth?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-bold tracking-wider text-zinc-700 uppercase shadow-sm transition active:scale-95 hover:border-pink-400 hover:text-pink-600"
          >
            ← Back
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || photos.length === 0}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-pink-500 px-9 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/25 transition active:scale-95 hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? "กำลังสั่งปริ้นต์..." : "🖨️ ปริ้นต์รูป"}
            </button>

            {hasPrinted ? (
              <button
                type="button"
                onClick={handleFinishSession}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-emerald-500 px-8 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:bg-emerald-400"
              >
                Next ({postPrintSeconds}s) →
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* แผ่นสำหรับเครื่องปริ้นต์เท่านั้น (แสดงเฉพาะตอนสั่ง Print) */}
      {printStripUrl ? (
        <div className="hidden print:fixed print:inset-0 print:flex print:items-center print:justify-center print:bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={printStripUrl}
            alt="Print Photobooth Strip"
            className="max-h-screen max-w-full object-contain"
          />
        </div>
      ) : null}
    </>
  );
}
