"use client";

interface CountdownOverlayProps {
  secondsLeft: number | null;
  currentShotIndex?: number | null;
  totalShots?: number;
  intermissionText?: string | null;
}

/**
 * Component แสดงตัวเลขนับถอยหลัง (3, 2, 1) พร้อมเอฟเฟกต์ไฟมาร์คี และป้ายเตือนเปลี่ยนท่าระหว่างช็อต
 */
export function CountdownOverlay({
  secondsLeft,
  currentShotIndex,
  totalShots,
  intermissionText,
}: CountdownOverlayProps) {
  // 1. หน้าจอเตือนเตรียมเปลี่ยนท่าโพส (Intermission ระหว่างช็อตต่อเนื่อง)
  if (intermissionText) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-2.5 rounded-3xl border-2 border-amber-400 bg-red-950/95 px-6 py-5 sm:px-10 sm:py-7 shadow-2xl shadow-red-950/90 text-center max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-amber-500/25 px-4 py-1 font-mono text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest">
            ★ NEXT POSE • เตรียมเปลี่ยนท่า ★
          </span>
          <p className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
            {intermissionText}
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-xs sm:text-sm font-bold text-amber-300/90">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>นับถอยหลังจะเริ่มใน 2 วินาที...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. ถ้าไม่ได้นับถอยหลัง
  if (secondsLeft === null) return null;

  // 3. กำลังนับถอยหลัง 3, 2, 1
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/35">
      {currentShotIndex && totalShots ? (
        <span className="rounded-full border-2 border-amber-400/90 bg-red-950/90 px-5 py-1.5 font-mono text-xs sm:text-sm lg:text-base font-black tracking-widest text-amber-200 uppercase shadow-xl backdrop-blur-md">
          ช็อตที่ {currentShotIndex} จาก {totalShots}
        </span>
      ) : null}

      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {/* ขีดเอฟเฟกต์ฝั่งซ้าย */}
        <svg
          viewBox="0 0 40 60"
          className="h-14 w-10 text-amber-400 sm:h-20 sm:w-12 animate-pulse"
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

        <span className="text-8xl font-black text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.8)] sm:text-9xl">
          {secondsLeft}
        </span>

        {/* ขีดเอฟเฟกต์ฝั่งขวา */}
        <svg
          viewBox="0 0 40 60"
          className="h-14 w-10 text-amber-400 sm:h-20 sm:w-12 animate-pulse"
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

      <p className="text-xl font-black tracking-wider text-amber-200 drop-shadow sm:text-2xl uppercase">
        Get Ready... ยิ้มเลย!
      </p>
    </div>
  );
}
