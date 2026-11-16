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
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {stickers.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          onClick={() => onAddSticker(sticker)}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition active:scale-95 sm:min-h-20 sm:p-3 ${
            isDark
              ? "border-zinc-800/90 bg-zinc-900/90 text-zinc-300 hover:border-pink-500/80 hover:bg-zinc-800/90"
              : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-pink-400 hover:bg-pink-50/50"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sticker.src}
            alt={sticker.name}
            className="h-9 w-9 object-contain sm:h-11 sm:w-11"
          />
          <span className="font-mono text-[10px] font-bold tracking-wider uppercase sm:text-xs">
            {sticker.name}
          </span>
        </button>
      ))}
    </div>
  );
}
