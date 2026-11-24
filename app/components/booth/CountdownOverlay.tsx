"use client";

interface CountdownOverlayProps {
  secondsLeft: number | null;
}

/**
 * Component แสดงตัวเลขนับถอยหลัง (3, 2, 1) ขนาดใหญ่กลางจอเท่านั้น
 */
export function CountdownOverlay({ secondsLeft }: CountdownOverlayProps) {
  if (secondsLeft === null) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/25">
      <span className="text-9xl sm:text-[12rem] font-black text-white drop-shadow-[0_8px_36px_rgba(0,0,0,0.85)] select-none">
        {secondsLeft}
      </span>
    </div>
  );
}
