"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { PlacedSticker } from "@/types/photobooth";

interface StickerCanvasProps {
  stickers: PlacedSticker[];
  selectedStickerId?: string | null;
  isHorizontal?: boolean;
  readOnly?: boolean;
  onSelectSticker?: (instanceId: string | null) => void;
  onUpdateSticker?: (
    instanceId: string,
    patch: Partial<Pick<PlacedSticker, "x" | "y" | "scale" | "rotation">>
  ) => void;
  onRemoveSticker?: (instanceId: string) => void;
}

interface DragState {
  instanceId: string;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  containerRect: DOMRect;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * พื้นที่สำหรับลากย้ายและเลือกสติกเกอร์บนแถบรูป (รองรับนิ้วสัมผัสและเมาส์ด้วย Pointer Events)
 */
export function StickerCanvas({
  stickers,
  selectedStickerId = null,
  isHorizontal = false,
  readOnly = false,
  onSelectSticker = () => {},
  onUpdateSticker = () => {},
  onRemoveSticker = () => {},
}: StickerCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  if (readOnly) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stickers.map((sticker) => (
          <div
            key={sticker.instanceId}
            className="absolute aspect-square"
            style={{
              width: isHorizontal ? undefined : "22%",
              height: isHorizontal ? "22%" : undefined,
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sticker.src}
              alt={sticker.stickerId}
              draggable={false}
              className="h-full w-full object-contain drop-shadow-sm"
            />
          </div>
        ))}
      </div>
    );
  }

  const handleStickerPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    sticker: PlacedSticker
  ) => {
    e.stopPropagation();
    onSelectSticker(sticker.instanceId);

    const container = containerRef.current;
    if (!container) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      instanceId: sticker.instanceId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startX: sticker.x,
      startY: sticker.y,
      containerRect: container.getBoundingClientRect(),
    };
  };

  const handleStickerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dxPercent =
      ((e.clientX - drag.startPointerX) / drag.containerRect.width) * 100;
    const dyPercent =
      ((e.clientY - drag.startPointerY) / drag.containerRect.height) * 100;

    onUpdateSticker(drag.instanceId, {
      x: clamp(drag.startX + dxPercent, 5, 95),
      y: clamp(drag.startY + dyPercent, 3, 97),
    });
  };

  const handleStickerPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ข้ามถ้าไม่ได้ capture อยู่
      }
      dragRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={() => onSelectSticker(null)}
      className="pointer-events-auto absolute inset-0 overflow-hidden touch-none"
    >
      {stickers.map((sticker) => {
        const isSelected = sticker.instanceId === selectedStickerId;
        return (
          <div
            key={sticker.instanceId}
            role="button"
            tabIndex={0}
            aria-label={`Sticker ${sticker.stickerId}`}
            onPointerDown={(e) => handleStickerPointerDown(e, sticker)}
            onPointerMove={handleStickerPointerMove}
            onPointerUp={handleStickerPointerUp}
            onPointerCancel={handleStickerPointerUp}
            className={`absolute aspect-square cursor-grab touch-none active:cursor-grabbing ${
              isSelected
                ? "rounded-xl border-2 border-dashed border-sky-400 bg-sky-400/10"
                : ""
            }`}
            style={{
              width: isHorizontal ? undefined : "22%",
              height: isHorizontal ? "22%" : undefined,
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sticker.src}
              alt={sticker.stickerId}
              draggable={false}
              className="pointer-events-none h-full w-full object-contain drop-shadow-sm"
            />

            {isSelected ? (
              <button
                type="button"
                aria-label="Remove sticker"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSticker(sticker.instanceId);
                }}
                className="absolute -top-3.5 -right-3.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-950 bg-rose-500 text-sm font-black text-white shadow transition active:scale-90"
              >
                ✕
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
