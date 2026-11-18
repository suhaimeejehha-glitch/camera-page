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
    <div className="flex h-full w-full max-w-6xl lg:max-w-7xl flex-col items-center justify-center">
      <FrameSelector frames={frames} shots={shots} orientation={orientation} />
    </div>
  );
}
