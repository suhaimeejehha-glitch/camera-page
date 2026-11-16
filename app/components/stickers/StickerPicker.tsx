"use client";

import type { StickerItem } from "@/types/photobooth";

interface StickerPickerProps {
  stickers: StickerItem[];
  onAddSticker: (sticker: StickerItem) => void;
}

/**
 * พาเนลกดเพิ่มสติกเกอร์โทนสว่างสะอาดตา ปุ่มใหญ่สำหรับจอทัชสกรีน
 */
export function StickerPicker({ stickers, onAddSticker }: StickerPickerProps) {
  if (stickers.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        ยังไม่มีสติกเกอร์ — เพิ่มไฟล์ใน public/stickers/ และ lib/stickers.ts
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {stickers.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          onClick={() => onAddSticker(sticker)}
          className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 transition active:scale-95 hover:border-pink-400 hover:bg-pink-50/50 sm:min-h-20 sm:p-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sticker.src}
            alt={sticker.name}
            className="h-9 w-9 object-contain sm:h-11 sm:w-11"
          />
          <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-700 uppercase sm:text-xs">
            {sticker.name}
          </span>
        </button>
      ))}
    </div>
  );
}
