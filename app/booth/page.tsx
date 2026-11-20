import { Suspense } from "react";
import { BoothClient } from "@/app/components/booth/BoothClient";

export default function BoothPage() {
  return (
    <main className="relative flex min-h-dvh md:h-dvh w-full flex-col items-center overflow-x-hidden overflow-y-auto md:overflow-hidden bg-[#080e1e] px-2 py-2 text-zinc-100 sm:px-6 sm:py-4 md:px-8">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[28rem] w-[28rem] rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center">
        <Suspense
          fallback={
            <p className="mt-12 font-mono text-sm text-zinc-400">
              LOADING BOOTH...
            </p>
          }
        >
          <BoothClient />
        </Suspense>
      </div>
    </main>
  );
}
