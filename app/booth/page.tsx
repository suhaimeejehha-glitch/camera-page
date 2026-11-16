import { Suspense } from "react";
import { BoothClient } from "@/app/components/booth/BoothClient";

export default function BoothPage() {
  return (
    <main className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-black">
      <Suspense
        fallback={
          <p className="mt-12 font-mono text-sm text-zinc-400">
            LOADING BOOTH...
          </p>
        }
      >
        <BoothClient />
      </Suspense>
    </main>
  );
}
