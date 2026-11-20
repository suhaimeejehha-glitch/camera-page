"use client";

interface CountdownOverlayProps {
  secondsLeft: number | null;
}

/**
 * Component แสดงตัวเลขนับถอยหลัง (3, 2, 1) พร้อมขีดเอฟเฟกต์สีชมพูและข้อความ Get Ready...
 */
export function CountdownOverlay({ secondsLeft }: CountdownOverlayProps) {
  if (secondsLeft === null) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/30">
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {/* ขีดเอฟเฟกต์ฝั่งซ้าย */}
        <svg
          viewBox="0 0 40 60"
          className="h-14 w-10 text-sky-400 sm:h-20 sm:w-12"
          aria-hidden="true"
        >
          <line
            x1="8"
            y1="8"
            x2="34"
            y2="20"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="30"
            x2="32"
            y2="30"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="52"
            x2="34"
            y2="40"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        <span className="text-8xl font-black text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)] sm:text-9xl">
          {secondsLeft}
        </span>

        {/* ขีดเอฟเฟกต์ฝั่งขวา */}
        <svg
          viewBox="0 0 40 60"
          className="h-14 w-10 text-sky-400 sm:h-20 sm:w-12"
          aria-hidden="true"
        >
          <line
            x1="32"
            y1="8"
            x2="6"
            y2="20"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="36"
            y1="30"
            x2="8"
            y2="30"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="52"
            x2="6"
            y2="40"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="text-xl font-bold tracking-wide text-white drop-shadow sm:text-2xl">
        Get Ready...
      </p>
    </div>
  );
}
