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

  const [allPhotos, setAllPhotos] = useState<PhotoShot[]>([]);
  const [photos, setPhotos] = useState<PhotoShot[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
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

  const activeTone = useMemo<PhotoTone>(
    () => PHOTO_TONES.find((t) => t.id === selectedToneId) ?? PHOTO_TONES[0],
    [selectedToneId]
  );

  // โหลดรูปภาพทั้งหมดที่ถ่ายมา และรูปที่เลือกใส่ในแต่ละช่อง
  useEffect(() => {
    try {
      let captured: PhotoShot[] = [];
      const rawAll = sessionStorage.getItem(ALL_PHOTOS_KEY);
      if (rawAll) {
        const parsed = JSON.parse(rawAll);
        if (Array.isArray(parsed) && parsed.length > 0) {
          captured = parsed;
        }
      }

      let selected: PhotoShot[] = [];
      const rawSelected = sessionStorage.getItem(STORAGE_KEY);
      if (rawSelected) {
        const parsed = JSON.parse(rawSelected);
        if (Array.isArray(parsed) && parsed.length > 0) {
          selected = parsed;
        }
      }

      if (captured.length === 0 && selected.length > 0) {
        captured = selected;
      }
      if (selected.length === 0 && captured.length > 0) {
        selected = captured.slice(0, frame.shotCount);
      }

      // เติมให้ครบจำนวนช่องของกรอบ
      if (selected.length < frame.shotCount && captured.length > 0) {
        const filled = [...selected];
        for (let i = filled.length; i < frame.shotCount; i++) {
          filled.push(captured[i % captured.length]);
        }
        selected = filled;
      }

      setAllPhotos(captured);
      setPhotos(selected);
    } catch {
      // ข้ามถ้าอ่าน storage ไม่ได้
    }

    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
    };
  }, [frame.shotCount]);

  // รูปที่กำลังแสดงพรีวิวขนาดใหญ่
  const activePhoto = useMemo(() => {
    if (photos[activeSlotIndex]) return photos[activeSlotIndex];
    if (allPhotos.length > 0) return allPhotos[0];
    return null;
  }, [photos, activeSlotIndex, allPhotos]);

  // เมื่อผู้ใช้กดเลือกรูปภาพจากแถบด้านล่าง
  const handleSelectPhotoForSlot = (shot: PhotoShot) => {
    setPhotos((prev) => {
      const next = [...prev];
      while (next.length < frame.shotCount) {
        next.push(shot);
      }
      next[activeSlotIndex] = shot;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // เลื่อนไปยังช่องถัดไปอัตโนมัติ เพื่อให้ผู้ใช้กดเลือกทีละช่องได้สะดวก
    setActiveSlotIndex((prev) => (prev + 1) % frame.shotCount);
  };

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
        if (gifBlobCache) {
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
    }, 400);

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
    } catch {}
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

        {/* พื้นที่หลัก: แบ่ง 2 ฝั่ง (ฝั่งซ้าย: ดูรูปใหญ่ + เลือกโทนสี + แถบเลือกรูปด้านล่าง | ฝั่งขวา: พรีวิวแถบคู่ + QR + สติกเกอร์ + สั่งปริ้นต์) */}
        <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 overflow-y-auto px-3 py-2 sm:px-6 landscape:flex-row landscape:items-start landscape:justify-center landscape:gap-6">
          
          {/* ฝั่งซ้าย: การเลือกรูปภาพและปรับโทนสี (ตามรูปตัวอย่างตู้ Photobooth) */}
          <div className="flex flex-1 flex-col gap-3 rounded-3xl border border-zinc-800/90 bg-zinc-950/70 p-4 shadow-2xl backdrop-blur-md sm:p-5">
            
            {/* 1. รูปภาพพรีวิวขนาดใหญ่ของช่องที่กำลังเลือก */}
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-inner sm:max-h-[38dvh]">
              {activePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePhoto.dataUrl}
                  alt={`Slot ${activeSlotIndex + 1} Preview`}
                  className="h-full w-full object-contain transition duration-200"
                  style={{ filter: activeTone.cssFilter }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <span className="font-mono text-sm">ไม่มีรูปภาพ</span>
                </div>
              )}

              {/* ป้ายบอกช่องปัจจุบัน */}
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-full border border-pink-500/40 bg-black/75 px-3.5 py-1 text-xs font-bold text-pink-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                <span>ช่องที่ {activeSlotIndex + 1} จาก {frame.shotCount}</span>
              </div>

              {/* ป้ายบอกโทนสีที่กำลังใช้ */}
              <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3 py-1 font-mono text-xs font-bold text-zinc-200 backdrop-blur-md">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: activeTone.previewColor }}
                />
                <span>{activeTone.labelEn}</span>
              </div>
            </div>

            {/* 2. โซนเลือกโทนสีหลายๆโทน (Color Tones) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  🎨 โทนสีรูปภาพ / COLOR TONES
                </span>
                <span className="text-xs text-pink-400 font-medium">
                  {activeTone.name} ({activeTone.labelEn})
                </span>
              </div>

              {/* แถบชิปโทนสีเลื่อนแนวนอน */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {PHOTO_TONES.map((tone) => {
                  const isSelected = tone.id === selectedToneId;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedToneId(tone.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                        isSelected
                          ? "border-pink-500 bg-pink-500/20 text-white shadow-md shadow-pink-500/30"
                          : "border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/30"
                        style={{ backgroundColor: tone.previewColor }}
                      />
                      <span>{tone.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. แถบกดเลือกภาพด้านล่าง (Filmstrip Selector ตรงตามรูปภาพที่ลูกค้าส่งมา) */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider text-zinc-400 uppercase">
                  📸 แตะเลือกรูปสำหรับช่องที่ {activeSlotIndex + 1}
                </span>
                <span className="text-[11px] text-zinc-500">
                  แตะรูปเพื่อเปลี่ยนรูปในช่องนี้
                </span>
              </div>

              {/* แถบรูปภาพแนวนอนเลื่อนได้ */}
              <div className="flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-2.5 no-scrollbar">
                {allPhotos.map((shot, idx) => {
                  // ตรวจสอบว่ารูปนี้ถูกเลือกใส่ในช่องไหนบ้าง
                  const placedSlotIndices = photos
                    .map((p, i) => (p?.id === shot.id ? i + 1 : null))
                    .filter((v): v is number => v !== null);

                  const isCurrentActive =
                    photos[activeSlotIndex]?.id === shot.id;

                  return (
                    <button
                      key={shot.id}
                      type="button"
                      onClick={() => handleSelectPhotoForSlot(shot)}
                      className={`group relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition active:scale-95 sm:h-24 sm:w-32 ${
                        isCurrentActive
                          ? "border-pink-500 ring-2 ring-pink-500/50 shadow-lg shadow-pink-500/30"
                          : placedSlotIndices.length > 0
                          ? "border-zinc-700 opacity-90 hover:border-pink-400"
                          : "border-zinc-800 opacity-75 hover:border-zinc-600 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.dataUrl}
                        alt={`Photo shot ${idx + 1}`}
                        className="h-full w-full object-cover transition"
                        style={{ filter: activeTone.cssFilter }}
                      />

                      {/* หมายเลขช็อตที่ถ่าย */}
                      <span className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                        #{idx + 1}
                      </span>

                      {/* ป้ายบอกว่าวางอยู่ในช่องไหนของกรอบรูป */}
                      {placedSlotIndices.length > 0 ? (
                        <span className="absolute right-1 bottom-1 rounded bg-pink-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          ช่อง {placedSlotIndices.join(", ")}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ฝั่งขวา: พรีวิวกรอบรูปคู่ 2 ชุด + Google Drive QR + สติกเกอร์ + สั่งปริ้นต์ */}
          <div className="flex w-full flex-col items-center gap-4 landscape:w-[420px] landscape:shrink-0">
            
            {/* พรีวิวแถบรูปคู่ (Dual Strip) หรือแผ่นเดี่ยว */}
            <div className="flex flex-col items-center gap-2">
              {orientation === "vertical" ? (
                <div className="flex items-center justify-center gap-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-2.5 shadow-2xl backdrop-blur-md">
                  {/* แถบที่ 1 (แถบหลักสำหรับแปะสติกเกอร์และแตะเลือกช่อง) */}
                  <div className="relative">
                    <StripPreview
                      frame={frame}
                      photos={photos}
                      filterCss={activeTone.cssFilter}
                      activeSlotIndex={activeSlotIndex}
                      onSlotClick={(index) => setActiveSlotIndex(index)}
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

                  {/* แถบที่ 2 (แถบคู่แฝด สำหรับปริ้นต์ 2 ชุดในใบ 4x6 เดียวกัน) */}
                  <div className="relative">
                    <StripPreview
                      frame={frame}
                      photos={photos}
                      filterCss={activeTone.cssFilter}
                      activeSlotIndex={activeSlotIndex}
                      onSlotClick={(index) => setActiveSlotIndex(index)}
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
                <div className="flex items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-md">
                  <StripPreview
                    frame={frame}
                    photos={photos}
                    filterCss={activeTone.cssFilter}
                    activeSlotIndex={activeSlotIndex}
                    onSlotClick={(index) => setActiveSlotIndex(index)}
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
              )}

              <p className="text-center text-[11px] text-zinc-400">
                แตะช่องบนแถบรูปเพื่อเปลี่ยนรูป • ลากสติกเกอร์เพื่อตกแต่ง
              </p>
            </div>

            {/* การ์ด QR Code ของ Google Drive แบบตรงกลางขนาดใหญ่ พร้อมคำอธิบาย */}
            <div className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 text-center shadow-lg">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-white p-2 shadow-sm sm:h-36 sm:w-36">
                {driveQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driveQr.qrDataUrl}
                    alt="Google Drive QR Code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                    <span className="font-mono text-[10px] text-zinc-400">
                      กำลังเตรียม QR...
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs font-medium text-zinc-300">
                สแกนด้วยมือถือเพื่อเปิดโฟลเดอร์ Google Drive รวมทั้งรูปภาพและ GIF ทันที
              </p>
            </div>

            {/* โซนสติกเกอร์ (แบบกระชับ) */}
            <div className="flex w-full flex-col gap-2 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-3 shadow-lg">
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

              {selectedSticker ? (
                <div className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-pink-400">
                      สติกเกอร์ที่เลือก
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSticker(selectedSticker.instanceId)}
                      className="rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300"
                    >
                      ลบชิ้นนี้
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">ขนาด:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSticker(selectedSticker.instanceId, {
                            scale: clamp(Number((selectedSticker.scale - 0.15).toFixed(2)), 0.5, 2.2),
                          })
                        }
                        className="h-7 w-7 rounded border border-zinc-700 bg-zinc-800 text-white"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSticker(selectedSticker.instanceId, {
                            scale: clamp(Number((selectedSticker.scale + 0.15).toFixed(2)), 0.5, 2.2),
                          })
                        }
                        className="h-7 w-7 rounded border border-zinc-700 bg-zinc-800 text-white"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">หมุน:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSticker(selectedSticker.instanceId, {
                            rotation: selectedSticker.rotation - 15,
                          })
                        }
                        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200"
                      >
                        ↺ -15°
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSticker(selectedSticker.instanceId, {
                            rotation: selectedSticker.rotation + 15,
                          })
                        }
                        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200"
                      >
                        ↻ +15°
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {exportError ? (
              <p className="text-center text-xs font-medium text-rose-400">
                {exportError}
              </p>
            ) : null}

          </div>
        </div>

        {/* แถบปุ่ม Back (ซ้ายล่าง) และ Print / Next (ขวาล่าง) สไตล์ White Pill Kiosk */}
        <div className="flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href={`/booth?frame=${frame.id}&shots=${shots}&orientation=${orientation}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/80 px-7 text-sm font-bold tracking-wider text-zinc-200 uppercase shadow-lg transition active:scale-95 hover:bg-zinc-700 hover:text-white"
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
