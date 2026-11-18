"use client";

import type { StickerItem } from "@/types/photobooth";

interface StickerPickerProps {
  stickers: StickerItem[];
  theme?: "dark" | "light";
  onAddSticker: (sticker: StickerItem) => void;
}

/**
 * พาเนลกดเพิ่มสติกเกอร์ รองรับทั้งธีมมืด (Dark) สไตล์สตูดิโอ และธีมสว่าง
 */
export function StickerPicker({
  stickers,
  theme = "dark",
  onAddSticker,
}: StickerPickerProps) {
  if (stickers.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        ยังไม่มีสติกเกอร์ — เพิ่มไฟล์ใน public/stickers/ และ lib/stickers.ts
      </p>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
      {stickers.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          onClick={() => onAddSticker(sticker)}
          className={`flex min-h-22 sm:min-h-26 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 sm:p-3 transition-all hover:scale-105 active:scale-95 touch-manipulation cursor-pointer shadow-md ${
            isDark
              ? "border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-pink-500 hover:bg-zinc-800"
              : "border-zinc-300 bg-zinc-50/90 text-zinc-800 hover:border-pink-400 hover:bg-pink-50"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sticker.src}
            alt={sticker.name}
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-sm"
          />
          <span className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase text-center">
            {sticker.name}
          </span>
        </button>
      ))}
    </div>
  );
}
