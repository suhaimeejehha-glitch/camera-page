"use client";

import { useSearchParams } from "next/navigation";
import { FrameSelector } from "@/app/components/frames/FrameSelector";
import {
  getFramesForLayout,
  parseOrientation,
  parseShotCount,
} from "@/lib/frames";

export function FramesPageClient() {
  const searchParams = useSearchParams();
  const shots = parseShotCount(searchParams.get("shots"));
  const orientation = parseOrientation(searchParams.get("orientation"));
  const frames = getFramesForLayout(shots, orientation);

  return (
    <div className="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-4 portrait:gap-6">

      <FrameSelector frames={frames} shots={shots} orientation={orientation} />

      <p className="text-center font-mono text-xs font-medium tracking-widest text-zinc-600 uppercase">
        แตะเลือกกรอบที่ชอบ แล้วกด Next เพื่อเริ่มถ่ายรูป
      </p>
    </div>
  );
}
