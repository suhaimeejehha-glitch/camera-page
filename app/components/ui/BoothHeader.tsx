import Link from "next/link";
import { FullscreenButton } from "@/app/components/ui/FullscreenButton";

interface BoothHeaderProps {
  title?: string;
  backHref?: string;
  brandName?: string;
  theme?: "dark" | "light";
  currentStep?: number;
  totalSteps?: number;
}

/**
 * แถบหัวด้านบนสไตล์กว้างสะอาดตา รองรับทั้งธีมสว่าง (Light) และมืด (Dark) พร้อม Step Indicator
 */
export function BoothHeader({
  title = "READY // STRIKE A POSE",
  backHref,
  brandName = "STUDIO BOOTH",
  theme = "dark",
  currentStep,
  totalSteps = 6,
}: BoothHeaderProps) {
  const isLight = theme === "light";

  const borderClass = isLight ? "border-zinc-200/80" : "border-zinc-800";
  const backBtnClass = isLight
    ? "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-pink-400 hover:text-pink-600"
    : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-pink-400";
  const brandTextClass = isLight ? "text-zinc-900" : "text-white";
  const titleClass = isLight ? "text-zinc-700" : "text-zinc-200";

  return (
    <header className="flex w-full max-w-6xl shrink-0 flex-col gap-2.5 portrait:gap-3">
      <div
        className={`flex items-center justify-between gap-3 border-b pb-3 ${borderClass}`}
      >
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className={`hidden min-h-14 items-center justify-center rounded-full border-2 px-6 text-sm font-black tracking-wider uppercase transition active:scale-95 landscape:inline-flex touch-manipulation cursor-pointer ${backBtnClass}`}
            >
              ← Back
            </Link>
          ) : null}

          {currentStep && currentStep >= 2 ? (
            <div
              className={`inline-flex min-h-14 items-center gap-3 text-base font-black tracking-widest uppercase sm:text-lg ${brandTextClass}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500 font-mono text-base font-black text-white shadow-md shadow-pink-500/30">
                ◉
              </span>
              <span>{brandName}</span>
            </div>
          ) : (
            <Link
              href="/"
              className={`inline-flex min-h-14 items-center gap-3 text-base font-black tracking-widest uppercase sm:text-lg ${brandTextClass}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500 font-mono text-base font-black text-white shadow-md shadow-pink-500/30">
                ◉
              </span>
              <span>{brandName}</span>
            </Link>
          )}
        </div>

        {/* ตัวบอกขั้นตอน 1 - 6 แบบสะอาดตา (หรือแสดง Title ถ้าไม่ส่ง currentStep) */}
        {currentStep ? (
          <div className="hidden items-center gap-2 sm:flex">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1;
              const isCurrent = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              return (
                <div key={stepNum} className="flex items-center gap-2">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm font-black transition ${
                      isCurrent
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/40 scale-110"
                        : isDone
                        ? isLight
                          ? "border-2 border-pink-300 bg-pink-50 text-pink-600"
                          : "border-2 border-pink-400/50 bg-pink-500/20 text-pink-300"
                        : isLight
                        ? "border border-zinc-200 bg-white text-zinc-400"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {stepNum}
                  </span>
                  {stepNum < totalSteps ? (
                    <span
                      className={`h-1 w-5 rounded-full ${
                        isDone
                          ? "bg-pink-400"
                          : isLight
                          ? "bg-zinc-200"
                          : "bg-zinc-800"
                      }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p
            className={`hidden truncate px-2 text-center font-mono text-sm sm:text-base font-black tracking-[0.2em] uppercase landscape:block ${titleClass}`}
          >
            {title}
          </p>
        )}

        <FullscreenButton theme={theme} />
      </div>

      {/* จอแนวตั้ง (9:16 / มือถือ): แยกแถว Back + Title/Step ให้อ่านชัด */}
      <div className="flex items-center justify-between gap-3 landscape:hidden">
        {backHref ? (
          <Link
            href={backHref}
            className={`inline-flex min-h-13 items-center justify-center rounded-full border-2 px-6 text-sm font-black tracking-wider uppercase transition active:scale-95 touch-manipulation cursor-pointer ${backBtnClass}`}
          >
            ← Back
          </Link>
        ) : (
          <div className="w-20" />
        )}

        <p
          className={`truncate text-center font-mono text-xs font-bold tracking-[0.18em] uppercase sm:text-sm ${titleClass}`}
        >
          {currentStep ? `STEP ${currentStep} OF ${totalSteps}` : title}
        </p>

        <div className="w-20" />
      </div>
    </header>
  );
}
