"use client";

import { useEffect, useState } from "react";

interface FullscreenButtonProps {
  theme?: "dark" | "light";
}

/**
 * ปุ่มกดเข้า/ออกโหมดเต็มจอ (Fullscreen) สำหรับจอตู้ Photobooth
 */
export function FullscreenButton({ theme = "dark" }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // เบราว์เซอร์บางตัวอาจไม่อนุญาต
    }
  };

  const themeClass =
    theme === "light"
      ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:border-red-600 hover:text-red-700"
      : "border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-amber-400";

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      title={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
      className={`inline-flex h-9 sm:h-12 items-center gap-2 rounded-full border px-3.5 sm:px-6 text-xs sm:text-base font-black tracking-wider uppercase transition active:scale-95 touch-manipulation cursor-pointer shadow-md ${themeClass}`}
    >
      <span className="text-sm sm:text-base">{isFullscreen ? "✕" : "⛶"}</span>
      <span className="hidden sm:inline">{isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}</span>
    </button>
  );
}
