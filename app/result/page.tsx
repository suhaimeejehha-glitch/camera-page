import { Suspense } from "react";
import { ResultClient } from "@/app/components/stickers/ResultClient";

export default function ResultPage() {
  return (
    <main className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-[#0c0a10] px-2.5 py-2 text-zinc-100 sm:px-6 sm:py-4 md:px-8 print:h-auto print:overflow-visible print:bg-white print:p-0">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-pink-600/15 blur-3xl print:hidden" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[28rem] w-[28rem] rounded-full bg-pink-500/15 blur-3xl print:hidden" />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center">
        <Suspense
          fallback={
            <p className="mt-12 font-mono text-sm text-zinc-400">
              LOADING STUDIO...
            </p>
          }
        >
          <ResultClient />
        </Suspense>
      </div>
    </main>
  );
}
