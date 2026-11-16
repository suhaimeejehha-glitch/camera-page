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

interface QrMediaState {
  qrDataUrl: string;
  mediaUrl: string;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function uploadMediaForQr(
  kind: "png" | "gif",
  blob: Blob
): Promise<QrMediaState> {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", blob, `studio-booth.${kind}`);

  const response = await fetch("/api/export-media", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(err?.error ?? "สร้างลิงก์ QR Code ไม่สำเร็จ");
  }

  const data = (await response.json()) as { urlPath: string };
  const rawMediaUrl = data.urlPath.startsWith("http")
    ? data.urlPath
    : `${window.location.origin}${data.urlPath}`;

  // ชี้ไปที่หน้าดาวน์โหลดสวยงามบนมือถือ
  const downloadViewerUrl = `${window.location.origin}/download?src=${encodeURIComponent(rawMediaUrl)}&type=${kind}`;

  const qrDataUrl = await QRCode.toDataURL(downloadViewerUrl, {
    width: 240,
    margin: 1,
    color: {
      dark: "#09090b",
      light: "#ffffff",
    },
  });

  const state: QrMediaState = { qrDataUrl, mediaUrl: downloadViewerUrl };
  try {
    sessionStorage.setItem(`photobooth_qr_${kind}`, JSON.stringify(state));
  } catch {
    // ข้ามถ้า storage เต็ม
  }

  return state;
}

function QrMediaCard({
  title,
  subtitle,
  downloadName,
  media,
  isLoading,
}: {
  title: string;
  subtitle: string;
  downloadName: string;
  media: QrMediaState | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-3.5 shadow-sm">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 sm:h-24 sm:w-24">
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.qrDataUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-center font-mono text-[10px] font-bold text-zinc-400">
            {isLoading ? "กำลังสร้าง..." : "รอภาพ"}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-xs font-black tracking-wide text-zinc-900 uppercase sm:text-sm">
          {title}
        </p>
        <p className="text-[11px] text-zinc-500">{subtitle}</p>
        {media ? (
          <a
            href={media.mediaUrl}
            download={downloadName}
            className="mt-0.5 inline-flex w-fit items-center rounded-full border border-pink-200 bg-pink-50 px-3 py-1 font-mono text-[10px] font-bold text-pink-600 uppercase transition active:scale-95 hover:bg-pink-100"
          >
            ⬇ โหลดไฟล์
          </a>
        ) : null}
      </div>
    </div>
  );
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

  const [photoQr, setPhotoQr] = useState<QrMediaState | null>(null);
  const [gifQr, setGifQr] = useState<QrMediaState | null>(null);
  const [isBuildingPhotoQr, setIsBuildingPhotoQr] = useState(false);
  const [isBuildingGifQr, setIsBuildingGifQr] = useState(false);

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

  // สร้าง QR โหลดรูปภาพ (.png) อัตโนมัติ และอัปเดตเมื่อลูกค้าติดสติกเกอร์เพิ่ม
  useEffect(() => {
    if (photos.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsBuildingPhotoQr(true);
      try {
        const stripDataUrl = await renderPhotoboothStrip({
          frame,
          photos,
          stickers: placedStickers,
        });
        if (cancelled) return;

        setPrintStripUrl(stripDataUrl);
        const stripBlob = await dataUrlToBlob(stripDataUrl);
        const media = await uploadMediaForQr("png", stripBlob);
        if (!cancelled) {
          setPhotoQr(media);
        }
      } catch (error) {
        console.error("Photo QR error:", error);
      } finally {
        if (!cancelled) setIsBuildingPhotoQr(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [frame, photos, placedStickers]);

  // สร้าง QR โหลดไฟล์ภาพเคลื่อนไหว GIF Animation (.gif)
  useEffect(() => {
    if (photos.length === 0) return;

    let cancelled = false;
    async function buildGifQr() {
      setIsBuildingGifQr(true);
      try {
        const motionFrames = await loadMotionFrames();
        const gifBlob = await createAnimatedGifBlob(motionFrames, photos);
        if (cancelled || !gifBlob) return;

        const media = await uploadMediaForQr("gif", gifBlob);
        if (!cancelled) {
          setGifQr(media);
        }
      } catch (error) {
        console.error("GIF QR error:", error);
      } finally {
        if (!cancelled) setIsBuildingGifQr(false);
      }
    }

    void buildGifQr();

    return () => {
      cancelled = true;
    };
  }, [photos]);

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

          {/* ฝั่งขวา/ล่าง: QR โหลดภาพ & วิดีโอ GIF (ด้านบน) + สติกเกอร์ + ปุ่มปริ้นต์เดียว */}
          <div className="flex max-h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-pink-500/10 sm:p-6 landscape:max-w-xl landscape:max-h-[82dvh] portrait:max-h-[48dvh]">
            {/* โซนบนสุดเหนือสติกเกอร์: QR โหลดรูปภาพ (.png) และ QR โหลด GIF Animation (.gif) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <QrMediaCard
                title="QR โหลดภาพ (.PNG)"
                subtitle="สแกนบันทึกรูปภาพ"
                downloadName={`studio-booth-${frame.id}.png`}
                media={photoQr}
                isLoading={isBuildingPhotoQr}
              />
              <QrMediaCard
                title="QR โหลดวิดีโอ GIF"
                subtitle="สแกนเก็บ GIF เคลื่อนไหว"
                downloadName={`studio-booth-${frame.id}.gif`}
                media={gifQr}
                isLoading={isBuildingGifQr}
              />
            </div>

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
              <p className="text-xs font-medium text-rose-500">{exportError}</p>
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
