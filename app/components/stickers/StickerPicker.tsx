"use client";

import type { StickerTheme } from "@/lib/stickers";

interface StickerPickerProps {
  themes: StickerTheme[];
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

/**
 * แผงเลือกธีมสติกเกอร์สำเร็จรูป (1-Tap Preset Decorative Themes)
 * ออกแบบปุ่มขนาดใหญ่สำหรับจอทัชสกรีนตู้ Kiosk แตะเพียงครั้งเดียว ตกแต่งให้อัตโนมัติทั้งแผ่น
 */
export function StickerPicker({
  themes,
  activeThemeId,
  onSelectTheme,
}: StickerPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 select-none">
      {themes.map((theme) => {
        const isActive = activeThemeId === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelectTheme(theme.id)}
            className={`relative flex min-h-20 sm:min-h-24 flex-col justify-between rounded-2xl border-2 p-3 text-left transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer ${
              isActive
                ? "border-amber-400 bg-gradient-to-br from-red-950/90 via-red-900/60 to-zinc-900 text-white shadow-[0_0_22px_rgba(245,158,11,0.4)] ring-2 ring-amber-300/40"
                : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/90"
            }`}
          >
            {/* ป้ายกำกับด้านบน: ไอคอน + Badge */}
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl sm:text-3xl drop-shadow-sm">{theme.icon}</span>

              {theme.badge ? (
                <span className="rounded-full bg-red-600/90 px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black text-amber-200 uppercase tracking-wider">
                  {theme.badge}
                </span>
              ) : isActive ? (
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black text-amber-300 border border-amber-400/40">
                  ✓ เลือกอยู่
                </span>
              ) : null}
            </div>

            {/* ข้อมูลชื่อธีม */}
            <div className="flex flex-col gap-0.5 mt-1.5">
              <span
                className={`text-sm sm:text-base font-black tracking-tight leading-snug ${
                  isActive ? "text-amber-300" : "text-white"
                }`}
              >
                {theme.thaiName}
              </span>
              <span className="font-mono text-[11px] sm:text-xs text-zinc-400 truncate">
                {theme.name}
              </span>
            </div>

            {/* ไอคอนตัวอย่างสติกเกอร์ในธีม */}
            {theme.previewIcons.length > 0 ? (
              <div className="flex items-center gap-1.5 pt-1.5 opacity-80">
                {theme.previewIcons.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-4 w-4 sm:h-5 sm:w-5 object-contain"
                  />
                ))}
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  + จัดวางรอบกรอบ
                </span>
              </div>
            ) : (
              <div className="pt-1.5 text-[10px] font-mono text-zinc-500 font-bold">
                กรอบรูปเรียบหรู คมชัด
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
