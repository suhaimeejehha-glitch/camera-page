"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { StripPreview } from "@/app/components/booth/StripPreview";
import { FRAME_CATEGORIES } from "@/lib/frames";
import type {
  FrameCategory,
  FrameConfig,
  LayoutOrientation,
  ShotCount,
} from "@/types/photobooth";

interface FrameSelectorProps {
  frames: FrameConfig[];
  shots: ShotCount;
  orientation: LayoutOrientation;
}

/**
 * หน้าเลือกกรอบแบบเลื่อนซ้าย-ขวาได้ต่อเนื่อง (Touch Swipe + Mouse Drag + ปุ่ม ◀ / ▶ เลื่อนลื่นๆ)
 */
export function FrameSelector({
  frames,
  shots,
  orientation,
}: FrameSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | FrameCategory
  >("all");
  const [selectedFrameId, setSelectedFrameId] = useState<string>(
    () => frames[0]?.id ?? ""
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const mouseDragRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  }>({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  const filteredFrames =
    selectedCategory === "all"
      ? frames
      : frames.filter((frame) => frame.category === selectedCategory);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    const rafId = requestAnimationFrame(updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    const observer =
      el && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollButtons)
        : null;
    if (el && observer) {
      observer.observe(el);
    }
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateScrollButtons);
      observer?.disconnect();
    };
  }, [filteredFrames.length, orientation, updateScrollButtons]);

  const handleSelectCategory = (category: "all" | FrameCategory) => {
    setSelectedCategory(category);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const scrollByAmount = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // รองรับลากด้วยเมาส์บนคอมพ์ (ส่วนทัชสกรีนใช้ native touch-pan-x ที่ลื่นที่สุด)
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    mouseDragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mouseDragRef.current;
    if (!drag.active || e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;

    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 6) {
      drag.moved = true;
    }
    el.scrollLeft = drag.startScrollLeft - dx;
  };

  const handlePointerUp = () => {
    mouseDragRef.current.active = false;
  };

  const handleSelectFrame = (frameId: string) => {
    if (mouseDragRef.current.moved) {
      mouseDragRef.current.moved = false;
      return;
    }
    setSelectedFrameId(frameId);
  };

  const activeFrameId = filteredFrames.some((f) => f.id === selectedFrameId)
    ? selectedFrameId
    : filteredFrames[0]?.id ?? frames[0]?.id ?? "";

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-4 portrait:gap-6">
      {/* แถบปุ่มหมวดหมู่ด้านบน (Chunky Touch Pills) */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
        {FRAME_CATEGORIES.map((cat) => {
          const count =
            cat.id === "all"
              ? frames.length
              : frames.filter((f) => f.category === cat.id).length;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`h-10 sm:h-11 rounded-full border-2 px-4 sm:px-6 text-xs sm:text-sm font-black tracking-wide transition active:scale-95 touch-manipulation cursor-pointer shadow-sm ${
                isActive
                  ? "border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-500/30 ring-2 ring-pink-500/20"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-pink-300 hover:text-pink-600"
              }`}
            >
              {cat.label}{" "}
              <span
                className={`ml-1 font-mono text-xs ${
                  isActive ? "text-pink-100 font-black" : "text-zinc-500 font-bold"
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* แถบเลื่อนกรอบแนวนอนพร้อมปุ่ม ◀ / ▶ */}
      <div className="relative flex w-full items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className="flex h-16 w-11 sm:h-20 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white text-xl sm:text-2xl font-black text-zinc-800 shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-20 touch-manipulation cursor-pointer"
        >
          ◀
        </button>

        <div
          ref={trackRef}
          onScroll={updateScrollButtons}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="flex flex-1 cursor-grab items-center gap-4 sm:gap-5 overflow-x-auto scroll-smooth px-2 py-2 touch-pan-x snap-x snap-mandatory active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {filteredFrames.map((frame) => {
            const isSelected = frame.id === activeFrameId;
            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelectFrame(frame.id)}
                draggable={false}
                className={`group relative flex shrink-0 snap-start flex-col items-center gap-2.5 rounded-2xl border-2 bg-white p-3.5 sm:p-4 transition duration-200 hover:-translate-y-1 active:scale-95 touch-manipulation cursor-pointer ${
                  isSelected
                    ? "border-pink-500 shadow-xl shadow-pink-500/20 ring-4 ring-pink-500/15"
                    : "border-zinc-200 shadow-sm hover:border-pink-300"
                }`}
              >
                {isSelected ? (
                  <span className="absolute -top-2.5 -right-2.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-sm font-black text-white shadow-md">
                    ✓
                  </span>
                ) : frame.badge ? (
                  <span
                    className={`absolute top-2.5 right-2.5 z-30 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-black tracking-wider shadow-sm ${
                      frame.badge === "HOT"
                        ? "bg-rose-500 text-white"
                        : "bg-pink-500 text-white"
                    }`}
                  >
                    {frame.badge}
                  </span>
                ) : null}

                <StripPreview frame={frame} compact />

                <span
                  className={`rounded-full border px-4 py-1 font-mono text-xs sm:text-sm font-black tracking-wider uppercase transition ${
                    isSelected
                      ? "border-pink-400 bg-pink-50 text-pink-600"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800 group-hover:border-pink-300 group-hover:text-pink-600"
                  }`}
                >
                  {frame.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className="flex h-16 w-11 sm:h-20 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white text-xl sm:text-2xl font-black text-zinc-800 shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-20 touch-manipulation cursor-pointer"
        >
          ▶
        </button>
      </div>

      {/* ปุ่ม Back / Next ด้านล่าง */}
      <div className="flex w-full items-center justify-between gap-3 pt-1">
        <Link
          href="/setup"
          className="inline-flex h-13 sm:h-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-7 sm:px-9 text-base sm:text-lg font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
        >
          ← Back
        </Link>

        <Link
          href={`/booth?frame=${activeFrameId}&shots=${shots}&orientation=${orientation}`}
          className="inline-flex h-13 sm:h-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-10 sm:px-14 text-lg sm:text-xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
