import { Suspense } from "react";
import { ResultClient } from "@/app/components/stickers/ResultClient";

export default function ResultPage() {
  return (
    <main className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-gradient-to-br from-white via-[#fff5fa] to-white px-5 py-4 text-zinc-900 sm:px-8 sm:py-5 print:h-auto print:overflow-visible print:bg-white print:p-0">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-200/35 blur-3xl print:hidden" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-pink-200/35 blur-3xl print:hidden" />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center">
        <Suspense
          fallback={
            <p className="mt-12 font-mono text-sm text-zinc-500">
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
