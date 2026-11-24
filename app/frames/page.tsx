import { Suspense } from "react";
import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { FramesPageClient } from "@/app/components/frames/FramesPageClient";

export default function FramesPage() {
  return (
    <main className="relative flex min-h-dvh md:h-dvh md:max-h-dvh w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto md:overflow-hidden bg-gradient-to-br from-[#fdfbf7] via-[#faf5ed] to-[#f4ede2] px-3 py-3 text-zinc-900 sm:px-6 sm:py-4 select-none">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-red-400/20 blur-3xl" />

      <div className="relative z-10 flex w-full justify-center shrink-0">
        <BoothHeader
          title="SELECT YOUR FRAME"
          theme="light"
          currentStep={3}
        />
      </div>

      <div className="relative z-10 flex w-full flex-1 items-center justify-center py-1 sm:py-2 my-auto">
        <Suspense
          fallback={
            <p className="font-mono text-lg font-black text-red-700">
              LOADING FRAMES...
            </p>
          }
        >
          <FramesPageClient />
        </Suspense>
      </div>
    </main>
  );
}
