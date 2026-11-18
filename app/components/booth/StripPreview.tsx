"use client";

import type { CSSProperties, ReactNode } from "react";
import type { FrameConfig, PhotoShot } from "@/types/photobooth";

const HEART_MASK_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 88'%3E%3Cpath d='M50 85C50 85 5 57 5 27C5 12 16 2 30 2C39 2 46 7 50 14C54 7 61 2 70 2C84 2 95 12 95 27C95 57 50 85 50 85Z' fill='black'/%3E%3C/svg%3E\")";

const HEART_MASK_STYLE: CSSProperties = {
  maskImage: HEART_MASK_DATA_URI,
  WebkitMaskImage: HEART_MASK_DATA_URI,
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

interface StripPreviewProps {
  frame: FrameConfig;
  photos?: PhotoShot[];
  filterCss?: string;
  activeSlotIndex?: number | null;
  onSlotClick?: (index: number) => void;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * แสดงแถบรูป Photobooth 1–4 ช่อง รองรับทั้งแนวตั้ง แนวนอน และกรอบ overlayImage
 */
export function StripPreview({
  frame,
  photos = [],
  filterCss = "none",
  activeSlotIndex = null,
  onSlotClick,
  compact = false,
  className = "",
  children,
}: StripPreviewProps) {
  const isHorizontal = frame.orientation === "horizontal";

  const sizeClass = isHorizontal
    ? compact
      ? "h-auto w-[min(48vw,350px)] lg:w-[min(42vw,400px)] portrait:w-[min(64vw,340px)]"
      : "h-auto w-[min(40vw,480px)] portrait:w-[min(86vw,600px)]"
    : compact
    ? "h-[min(46dvh,390px)] lg:h-[min(48dvh,420px)] w-auto portrait:h-[min(32dvh,350px)]"
    : "h-[min(64dvh,540px)] w-auto portrait:h-[min(30dvh,420px)]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl shadow-lg ${sizeClass} ${className}`}
      style={{
        backgroundColor: frame.overlayImage ? "#ffffff" : frame.backgroundColor,
        aspectRatio: `${frame.canvasWidth} / ${frame.canvasHeight}`,
      }}
    >
      {/* ชั้นล่าง: ช่องรูปถ่ายทั้ง 1-4 ช่องวางตามสัดส่วนพิกัดจริง */}
      {frame.slots.map((slot, index) => {
        const shot = photos[index];
        const isHeart = !frame.overlayImage && slot.shape === "heart";
        const isActive = activeSlotIndex === index;

        return (
          <div
            key={index}
            onClick={() => onSlotClick?.(index)}
            className={`absolute overflow-hidden bg-white transition-all ${
              onSlotClick ? "cursor-pointer" : ""
            } ${
              isActive
                ? "z-10 ring-4 ring-pink-500 ring-offset-2 ring-offset-black/60 shadow-lg shadow-pink-500/50"
                : ""
            }`}
            style={{
              left: `${(slot.x / frame.canvasWidth) * 100}%`,
              top: `${(slot.y / frame.canvasHeight) * 100}%`,
              width: `${(slot.width / frame.canvasWidth) * 100}%`,
              height: `${(slot.height / frame.canvasHeight) * 100}%`,
              border: frame.overlayImage
                ? undefined
                : `2px solid ${frame.accentColor}`,
              ...(isHeart ? HEART_MASK_STYLE : {}),
            }}
          >
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shot.dataUrl}
                alt={`Shot ${index + 1}`}
                className="h-full w-full object-cover transition"
                style={{ filter: filterCss || "none" }}
              />
            ) : null}

            {onSlotClick ? (
              <span className="pointer-events-none absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-sm">
                #{index + 1}
              </span>
            ) : null}
          </div>
        );
      })}

      {/* ชั้นบน: กรอบ SVG/PNG หรือแถบชื่อกรอบสีสำหรับ 1-3 รูป / แนวนอน */}
      {frame.overlayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.overlayImage}
          alt={frame.name}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2"
          style={{ color: frame.accentColor }}
        >
          <span className="text-[11px] font-black tracking-wider uppercase">
            {frame.name}
          </span>
          <span className="font-mono text-[11px] font-bold">
            {frame.labelText}
          </span>
        </div>
      )}

      {/* ชั้นบนสุด: สติกเกอร์เพิ่มเติมที่ผู้ใช้แปะเอง */}
      <div className="pointer-events-none absolute inset-0 z-20">{children}</div>
    </div>
  );
}
