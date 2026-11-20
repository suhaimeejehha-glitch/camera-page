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
    ? "border-zinc-300 bg-white text-zinc-700 shadow-sm hover:border-sky-400 hover:text-sky-600"
    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-sky-400";
  const brandTextClass = isLight ? "text-zinc-900" : "text-white";
  const titleClass = isLight ? "text-zinc-600" : "text-zinc-300";

  return (
    <header className="flex w-full max-w-6xl shrink-0 flex-col gap-1.5">
      <div
        className={`flex items-center justify-between gap-3 border-b pb-2 sm:pb-3 ${borderClass}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className={`inline-flex h-11 sm:h-12 items-center justify-center rounded-full border-2 px-4 sm:px-6 text-sm sm:text-base font-black tracking-wider uppercase transition active:scale-95 touch-manipulation cursor-pointer ${backBtnClass}`}
            >
              ← Back
            </Link>
          ) : null}

          <div
            className={`inline-flex items-center gap-2.5 sm:gap-3 font-black tracking-wider uppercase text-sm sm:text-lg ${brandTextClass}`}
          >
            <span className="inline-flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-sky-500 font-mono text-sm sm:text-base font-black text-white shadow-md shadow-sky-500/30">
              ◉
            </span>
            <span className="hidden xs:inline">{brandName}</span>
          </div>
        </div>

        {/* ตัวบอกขั้นตอน 1 - 6 */}
        {currentStep ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1;
              const isCurrent = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              return (
                <div key={stepNum} className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full font-mono text-xs sm:text-base font-black transition ${
                      isCurrent
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/40 scale-110"
                        : isDone
                        ? isLight
                          ? "border-2 border-sky-300 bg-sky-50 text-sky-600"
                          : "border border-sky-400/50 bg-sky-500/20 text-sky-300"
                        : isLight
                        ? "border-2 border-zinc-200 bg-white text-zinc-400"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {stepNum}
                  </span>
                  {stepNum < totalSteps ? (
                    <span
                      className={`h-0.5 sm:h-1 w-3 sm:w-5 rounded-full ${
                        isDone
                          ? "bg-sky-400"
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
