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
import { renderPhotoboothStrip, renderPrintSheet } from "@/lib/canvasRenderer";
import { clearMotionFrames, loadMotionFrames } from "@/lib/mediaStore";
import { createAnimatedGifBlob } from "@/lib/gifBuilder";
import { PHOTO_TONES, type PhotoTone } from "@/lib/filters";
import type { PhotoShot, PlacedSticker, StickerItem } from "@/types/photobooth";

const STORAGE_KEY = "photobooth_photos";
const ALL_PHOTOS_KEY = "photobooth_all_photos";
const SELECTED_TONE_KEY = "photobooth_selected_tone";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface DriveQrState {
  qrDataUrl: string;
  folderUrl: string;
  folderId?: string;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
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
  const [selectedToneId, setSelectedToneId] = useState<string>("normal");

  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const [driveQr, setDriveQr] = useState<DriveQrState | null>(null);
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isFileSyncing, setIsFileSyncing] = useState(false);
  const [gifBlobCache, setGifBlobCache] = useState<Blob | null>(null);

  const [printStripUrl, setPrintStripUrl] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [postPrintSeconds, setPostPrintSeconds] = useState(15);
  const [exportError, setExportError] = useState<string | null>(null);

  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderIdRef = useRef<string | null>(null);
  const gifUploadedRef = useRef<boolean>(false);

  const activeTone = useMemo<PhotoTone>(
    () => PHOTO_TONES.find((t) => t.id === selectedToneId) ?? PHOTO_TONES[0],
    [selectedToneId]
  );

  // โหลดรูปภาพและโทนสีที่เลือกมาจากหน้ากล้อง (/booth)
  useEffect(() => {
    try {
      const rawSelected = sessionStorage.getItem(STORAGE_KEY);
      if (rawSelected) {
        const parsed = JSON.parse(rawSelected) as PhotoShot[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotos(parsed);
        }
      }

      const savedTone = sessionStorage.getItem(SELECTED_TONE_KEY);
      if (savedTone) {
        setSelectedToneId(savedTone);
      }
    } catch {
      // ข้ามถ้าอ่าน storage ไม่ได้
    }

    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
    };
  }, []);

  // 1. สร้างโฟลเดอร์ Google Drive ล่วงหน้าทันที เพื่อให้แสดง QR Code ได้อัตโนมัติภายใน <1 วินาที!
  useEffect(() => {
    let cancelled = false;

    async function initDriveFolder() {
      try {
        const raw = sessionStorage.getItem("photobooth_drive_qr");
        if (raw) {
          const parsed = JSON.parse(raw) as DriveQrState;
          if (parsed && parsed.qrDataUrl) {
            folderIdRef.current = parsed.folderId || null;
            setDriveQr(parsed);
            setIsDriveReady(true);
            return;
          }
        }
      } catch {}

      try {
        const fd = new FormData();
        fd.append("action", "create-folder");

        const res = await fetch("/api/upload-drive", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) throw new Error("ไม่สามารถสร้างโฟลเดอร์ Drive ได้");

        const data = (await res.json()) as {
          folderId: string;
          folderUrl: string;
        };

        if (cancelled) return;

        folderIdRef.current = data.folderId;
        const qrDataUrl = await QRCode.toDataURL(data.folderUrl, {
          width: 280,
          margin: 1,
          color: {
            dark: "#09090b",
            light: "#ffffff",
          },
        });

        const state: DriveQrState = {
          qrDataUrl,
          folderUrl: data.folderUrl,
          folderId: data.folderId,
        };

        setDriveQr(state);
        setIsDriveReady(true);
        sessionStorage.setItem("photobooth_drive_qr", JSON.stringify(state));
      } catch (err) {
        console.error("Init drive folder error:", err);
        try {
          const fallbackUrl =
            "https://drive.google.com/drive/folders/1Fd5YvZXhsASQAObgnYk53ybwjgxeQB35?usp=sharing";
          const qrDataUrl = await QRCode.toDataURL(fallbackUrl, {
            width: 280,
            margin: 1,
            color: { dark: "#09090b", light: "#ffffff" },
          });
          if (!cancelled) {
            const state: DriveQrState = { qrDataUrl, folderUrl: fallbackUrl };
            setDriveQr(state);
            setIsDriveReady(true);
            sessionStorage.setItem("photobooth_drive_qr", JSON.stringify(state));
          }
        } catch {}
      }
    }

    void initDriveFolder();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. สร้างไฟล์ GIF ล่วงหน้าในพื้นหลัง
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

  // 3. อัปโหลดไฟล์ (รูปภาพพร้อมฟิลเตอร์โทนสี + GIF) เข้าโฟลเดอร์ Google Drive ในพื้นหลัง
  useEffect(() => {
    if (photos.length === 0 || !isDriveReady) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsFileSyncing(true);
      setExportError(null);
      try {
        const stripDataUrl = await renderPhotoboothStrip({
          frame,
          photos,
          stickers: placedStickers,
          filterCss: activeTone.cssFilter,
        });
        if (cancelled) return;

        setPrintStripUrl(stripDataUrl);
        const stripBlob = await dataUrlToBlob(stripDataUrl);

        const formData = new FormData();
        if (folderIdRef.current) {
          formData.append("folderId", folderIdRef.current);
        }
        formData.append("photo", stripBlob, "photo-strip.png");

        // ส่ง GIF เพียงครั้งเดียว
        const shouldUploadGif = Boolean(gifBlobCache && !gifUploadedRef.current);
        if (shouldUploadGif && gifBlobCache) {
          formData.append("gif", gifBlobCache, "photo-motion.gif");
        }

        const uploadRes = await fetch("/api/upload-drive", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = (await uploadRes.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(errData?.error ?? "อัปโหลดไฟล์เข้า Drive ไม่สำเร็จ");
        }

        if (shouldUploadGif) {
          gifUploadedRef.current = true;
        }
      } catch (error) {
        console.error("Background sync error:", error);
        if (!cancelled) {
          const msg =
            error instanceof Error
              ? error.message
              : "กำลังซิงค์ไฟล์เข้า Google Drive...";
          setExportError(msg);
        }
      } finally {
        if (!cancelled) setIsFileSyncing(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [frame, photos, placedStickers, activeTone, gifBlobCache, isDriveReady]);

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
        filterCss: activeTone.cssFilter,
      });

      // สร้างแผ่นพิมพ์ขนาด 4x6 นิ้ว (ถ้าเป็นกรอบแนวตั้ง จะวาง 2 แถบคู่กันเป็น 2 ชุดสำหรับตัดแบ่ง)
      const printSheetDataUrl = await renderPrintSheet(stripDataUrl, orientation);
      setPrintStripUrl(printSheetDataUrl);

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
      sessionStorage.removeItem(ALL_PHOTOS_KEY);
      sessionStorage.removeItem("photobooth_drive_qr");
    } catch {}
    gifUploadedRef.current = false;
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
          title="CUSTOMIZE & PRINT"
          theme="dark"
          currentStep={5}
        />

        {/* พื้นที่หลัก: แถบรูปคู่ 2 ชุดทางซ้าย | QR Code Google Drive + สติกเกอร์ + สั่งปริ้นต์ทางขวา */}
        <div className="flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-evenly gap-5 py-2 landscape:flex-row landscape:items-center landscape:justify-center landscape:gap-10">
          
          {/* ฝั่งซ้าย: ตัวอย่างแถบรูป (แสดง 2 แถบคู่กันสำหรับแนวตั้งเหมือนหน้าตู้จริง) */}
          <div className="flex shrink-0 flex-col items-center gap-2.5">
            {orientation === "vertical" ? (
              <div className="flex items-center justify-center gap-2.5 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-md">
                {/* แถบที่ 1 (แถบหลักสำหรับแปะสติกเกอร์) */}
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  >
                    <StickerCanvas
                      stickers={placedStickers}
                      selectedStickerId={selectedStickerId}
                      isHorizontal={false}
                      onSelectSticker={setSelectedStickerId}
                      onUpdateSticker={handleUpdateSticker}
                      onRemoveSticker={handleRemoveSticker}
                    />
                  </StripPreview>
                </div>

                {/* แถบที่ 2 (แถบคู่แฝด สะท้อนเหมือนชุดที่ 1 สำหรับพิมพ์ 2 ชุด) */}
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  >
                    <StickerCanvas
                      stickers={placedStickers}
                      isHorizontal={false}
                      readOnly
                    />
                  </StripPreview>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-md">
                {/* แถบที่ 1 (แถบหลักสำหรับแปะสติกเกอร์) */}
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  >
                    <StickerCanvas
                      stickers={placedStickers}
                      selectedStickerId={selectedStickerId}
                      isHorizontal={true}
                      onSelectSticker={setSelectedStickerId}
                      onUpdateSticker={handleUpdateSticker}
                      onRemoveSticker={handleRemoveSticker}
                    />
                  </StripPreview>
                </div>

                {/* แถบที่ 2 (แถบคู่เหมือนชุดที่ 1 สำหรับพิมพ์ 2 ชุด) */}
                <div className="relative">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                  >
                    <StickerCanvas
                      stickers={placedStickers}
                      isHorizontal={true}
                      readOnly
                    />
                  </StripPreview>
                </div>
              </div>
            )}
            <p className="text-center text-xs text-zinc-400">
              แตะและลากสติกเกอร์เพื่อตกแต่งภาพ (แสดง 2 แถบคู่กัน)
            </p>
          </div>

          {/* ฝั่งขวา: QR Code + สติกเกอร์ + สั่งปริ้นต์ ในดีไซน์ Dark Studio Kiosk */}
          <div className="flex max-h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-md sm:p-6 landscape:max-w-xl landscape:max-h-[82dvh] portrait:max-h-[48dvh]">
            
            {/* โซนบน: QR Code ตรงกลาง ขนาดใหญ่ขึ้น และคำอธิบายอยู่ใต้คิวอาร์ */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-white p-2 shadow-sm sm:h-40 sm:w-40">
                {driveQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driveQr.qrDataUrl}
                    alt="Google Drive QR Code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                    <span className="font-mono text-xs text-zinc-400">
                      กำลังเตรียม QR...
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs font-medium text-zinc-400 sm:text-sm">
                สแกนด้วยมือถือเพื่อเปิดโฟลเดอร์ Google Drive รวมทั้งรูปภาพและ GIF ทันที
              </p>
            </div>

            {/* โซนสติกเกอร์ */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  STICKERS
                </span>
                {placedStickers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPlacedStickers([]);
                      setSelectedStickerId(null);
                    }}
                    className="font-mono text-xs font-medium text-rose-400 transition hover:underline"
                  >
                    ลบทั้งหมด
                  </button>
                ) : null}
              </div>
              <StickerPicker
                stickers={STICKERS}
                theme="dark"
                onAddSticker={handleAddSticker}
              />
            </div>

            {selectedSticker ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-wider text-pink-400 uppercase">
                    Selected: {selectedSticker.stickerId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSticker(selectedSticker.instanceId)}
                    className="min-h-9 rounded-full border border-rose-500/30 bg-rose-500/20 px-3.5 text-xs font-bold text-rose-300 transition active:scale-95 hover:bg-rose-500/30"
                  >
                    ลบชิ้นนี้
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400">Size</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          scale: clamp(Number((selectedSticker.scale - 0.15).toFixed(2)), 0.5, 2.2),
                        })
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg font-bold text-white shadow-sm transition active:scale-95 hover:bg-zinc-700"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-mono text-xs font-bold text-zinc-200">
                      {Math.round(selectedSticker.scale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          scale: clamp(Number((selectedSticker.scale + 0.15).toFixed(2)), 0.5, 2.2),
                        })
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg font-bold text-white shadow-sm transition active:scale-95 hover:bg-zinc-700"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-400">Rotate</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSticker(selectedSticker.instanceId, {
                          rotation: selectedSticker.rotation - 15,
                        })
                      }
                      className="h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 font-mono text-xs font-bold text-zinc-200 shadow-sm transition active:scale-95 hover:bg-zinc-700"
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
                      className="h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 font-mono text-xs font-bold text-zinc-400 shadow-sm transition active:scale-95 hover:bg-zinc-700"
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
                      className="h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 font-mono text-xs font-bold text-zinc-200 shadow-sm transition active:scale-95 hover:bg-zinc-700"
                    >
                      ↻ +15°
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {exportError ? (
              <p className="text-xs font-medium text-rose-400">{exportError}</p>
            ) : null}
          </div>
        </div>

        {/* แถบปุ่ม Back (ซ้ายล่าง) และ Print / Next (ขวาล่าง) สไตล์ White Pill Kiosk */}
        <div className="flex w-full max-w-6xl shrink-0 items-center justify-between gap-4 pt-3">
          <Link
            href={`/booth?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 px-8 text-sm font-bold tracking-wider text-zinc-200 uppercase shadow-lg transition active:scale-95 hover:bg-zinc-700 hover:text-white"
          >
            ← Back
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || photos.length === 0}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-9 text-base font-black tracking-wider text-zinc-950 uppercase shadow-xl transition active:scale-95 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? "กำลังสั่งปริ้นต์..." : "🖨️ ปริ้นต์รูป (Print)"}
            </button>

            {hasPrinted ? (
              <button
                type="button"
                onClick={handleFinishSession}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-pink-500 px-8 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400"
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
