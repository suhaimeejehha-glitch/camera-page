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
      ? "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-pink-400 hover:text-pink-600"
      : "border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-pink-400";

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className={`inline-flex min-h-11 sm:min-h-12 items-center gap-2 rounded-full border px-4 sm:px-5 text-xs sm:text-sm font-bold tracking-wider uppercase transition active:scale-95 touch-manipulation cursor-pointer ${themeClass}`}
    >
      <span>{isFullscreen ? "✕ ออกจากเต็มจอ" : "⛶ เต็มจอ (Fullscreen)"}</span>
    </button>
  );
}
