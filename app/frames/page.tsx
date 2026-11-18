import { Suspense } from "react";
import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { FramesPageClient } from "@/app/components/frames/FramesPageClient";

export default function FramesPage() {
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-white via-[#fff5fa] to-white px-4 py-3 text-zinc-900 sm:px-6 sm:py-4 select-none">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-pink-200/35 blur-3xl" />

      <div className="relative z-10 flex w-full justify-center shrink-0">
        <BoothHeader
          title="SELECT YOUR FRAME"
          theme="light"
          currentStep={3}
        />
      </div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center py-1 sm:py-2">
        <Suspense
          fallback={
            <p className="font-mono text-lg font-black text-pink-600">
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
