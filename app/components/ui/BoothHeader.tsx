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
 * แถบหัวด้านบนสไตล์กว้างสะอาดตา ขนาดพอดีกับจอตู้ทัชสกรีน ไม่กินพื้นที่แนวตั้ง
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

  const borderClass = isLight ? "border-zinc-200" : "border-zinc-800";
  const backBtnClass = isLight
    ? "border-zinc-300 bg-white text-zinc-700 shadow-sm hover:border-pink-400 hover:text-pink-600"
    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-pink-400";
  const brandTextClass = isLight ? "text-zinc-900" : "text-white";
  const titleClass = isLight ? "text-zinc-600" : "text-zinc-300";

  return (
    <header className="flex w-full max-w-6xl shrink-0 flex-col gap-1.5">
      <div
        className={`flex items-center justify-between gap-3 border-b pb-2 sm:pb-3 ${borderClass}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className={`inline-flex h-11 items-center justify-center rounded-full border-2 px-4 sm:px-5 text-sm font-black tracking-wider uppercase transition active:scale-95 touch-manipulation cursor-pointer ${backBtnClass}`}
            >
              ← Back
            </Link>
          ) : null}

          <div
            className={`inline-flex items-center gap-2.5 font-black tracking-wider uppercase text-sm sm:text-base ${brandTextClass}`}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 font-mono text-sm font-black text-white shadow-md shadow-pink-500/30">
              ◉
            </span>
            <span className="hidden xs:inline">{brandName}</span>
          </div>
        </div>

        {/* ตัวบอกขั้นตอน 1 - 6 */}
        {currentStep ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1;
              const isCurrent = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              return (
                <div key={stepNum} className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full font-mono text-xs sm:text-sm font-black transition ${
                      isCurrent
                        ? "bg-pink-500 text-white shadow-md shadow-pink-500/40 scale-105"
                        : isDone
                        ? isLight
                          ? "border border-pink-300 bg-pink-50 text-pink-600"
                          : "border border-pink-400/50 bg-pink-500/20 text-pink-300"
                        : isLight
                        ? "border border-zinc-200 bg-white text-zinc-400"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {stepNum}
                  </span>
                  {stepNum < totalSteps ? (
                    <span
                      className={`h-0.5 w-3 sm:w-4 rounded-full ${
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
            className={`truncate px-2 text-center font-mono text-xs sm:text-sm font-black tracking-wider uppercase ${titleClass}`}
          >
            {title}
          </p>
        )}

        <FullscreenButton theme={theme} />
      </div>
    </header>
  );
}
