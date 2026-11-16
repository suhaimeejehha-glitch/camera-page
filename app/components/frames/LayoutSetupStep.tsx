"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearMotionFrames } from "@/lib/mediaStore";
import type { LayoutOrientation, ShotCount } from "@/types/photobooth";

const SHOT_OPTIONS: { count: ShotCount; label: string; desc: string }[] = [
  { count: 1, label: "1 รูป", desc: "ภาพเดี่ยวเต็มใบ" },
  { count: 2, label: "2 รูป", desc: "คู่ 2 ช็อต" },
  { count: 3, label: "3 รูป", desc: "แถบ 3 ช็อต" },
  { count: 4, label: "4 รูป", desc: "แถบ 4 ช็อตยอดฮิต" },
];

const ORIENTATION_OPTIONS: {
  value: LayoutOrientation;
  label: string;
  sub: string;
  desc: string;
}[] = [
  {
    value: "vertical",
    label: "แนวตั้ง",
    sub: "Vertical Strip",
    desc: "แถบรูปแนวตั้งเรียงลงล่าง คลาสสิกยอดฮิต",
  },
  {
    value: "horizontal",
    label: "แนวนอน",
    sub: "Horizontal Strip",
    desc: "แถบรูปแนวนอนกว้าง เหมาะถ่ายหลายคน",
  },
];

function OrientationSampleIcon({ isVertical }: { isVertical: boolean }) {
  if (isVertical) {
    return (
      <svg
        viewBox="0 0 100 126"
        className="h-32 w-26 drop-shadow-sm sm:h-36 sm:w-28"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="122"
          rx="4"
          fill="#e4e4e7"
          stroke="#27272a"
          strokeWidth="2.5"
        />
        {/* คนฝั่งซ้าย */}
        <circle cx="33" cy="60" r="11" fill="#18181b" />
        <path
          d="M14 123V94C14 82 22 75 33 75C44 75 50 82 50 94V123H14Z"
          fill="#18181b"
        />
        {/* คนฝั่งขวา */}
        <circle cx="66" cy="60" r="11" fill="#18181b" />
        <path
          d="M50 123V94C50 82 56 75 67 75C78 75 86 82 86 94V123H50Z"
          fill="#18181b"
          stroke="#e4e4e7"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 136 96"
      className="h-28 w-40 drop-shadow-sm sm:h-32 sm:w-44"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="132"
        height="92"
        rx="4"
        fill="#e4e4e7"
        stroke="#27272a"
        strokeWidth="2.5"
      />
      {/* คนฝั่งซ้าย */}
      <circle cx="48" cy="36" r="12" fill="#18181b" />
      <path
        d="M22 93V74C22 59 33 52 48 52C63 52 72 59 72 74V93H22Z"
        fill="#18181b"
      />
      {/* คนฝั่งขวา */}
      <circle cx="88" cy="36" r="12" fill="#18181b" />
      <path
        d="M64 93V74C64 59 73 52 88 52C103 52 114 59 114 74V93H64Z"
        fill="#18181b"
        stroke="#e4e4e7"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MiniLayoutIcon({
  count,
  orientation,
  active,
}: {
  count: ShotCount;
  orientation: LayoutOrientation;
  active: boolean;
}) {
  const isVertical = orientation === "vertical";
  return (
    <div
      className={`flex gap-1 rounded-lg border p-1.5 transition-all ${
        active
          ? "border-pink-400 bg-pink-50"
          : "border-zinc-200 bg-zinc-100"
      } ${isVertical ? "h-16 w-9 flex-col" : "h-10 w-20 flex-row"}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`flex-1 rounded-[2px] ${
            active ? "bg-pink-400" : "bg-zinc-400"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * ขั้นตอนตั้งค่ารูปแบบก่อนเลือกกรอบ:
 * Step 1: เลือกแนวตั้ง หรือ แนวนอน
 * Step 2: แสดงรูปแบบ 1-4 รูป ที่ปรับตามแนวที่เลือกไว้โดยอัตโนมัติ
 */
export function LayoutSetupStep() {
  const [step, setStep] = useState<"orientation" | "shots">("orientation");
  const [orientation, setOrientation] =
    useState<LayoutOrientation>("vertical");
  const [shots, setShots] = useState<ShotCount>(4);

  useEffect(() => {
    try {
      sessionStorage.removeItem("photobooth_photos");
    } catch {
      // ข้ามถ้าลบ storage ไม่ได้
    }
    void clearMotionFrames();
  }, []);

  const handleSelectOrientation = (nextOrientation: LayoutOrientation) => {
    setOrientation(nextOrientation);
  };

  if (step === "orientation") {
    return (
      <div className="flex max-h-full w-full max-w-5xl flex-col items-center justify-center gap-6 portrait:gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="rounded-full border border-pink-200 bg-pink-50 px-4 py-1 font-mono text-xs font-bold tracking-widest text-pink-600 uppercase">
            Step 1 of 2
          </span>
          <h2 className="text-2xl font-black text-zinc-900 sm:text-4xl">
            เลือกแนวกรอบที่ต้องการ
          </h2>
          <p className="text-sm font-medium text-zinc-600 sm:text-base">
            แตะเลือก แนวตั้ง หรือ แนวนอน แล้วกด Next เพื่อเลือกรูปแบบจำนวนรูป
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          {ORIENTATION_OPTIONS.map((opt) => {
            const isVertical = opt.value === "vertical";
            const isSelected = orientation === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOrientation(opt.value)}
                className={`group relative flex min-h-56 flex-col items-center justify-center gap-5 rounded-3xl border-2 bg-white p-8 text-center shadow-xl transition active:scale-95 portrait:min-h-64 ${
                  isSelected
                    ? "border-pink-500 shadow-pink-500/15 ring-4 ring-pink-500/10"
                    : "border-zinc-200 shadow-pink-500/5 hover:border-pink-300"
                }`}
              >
                {isSelected ? (
                  <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-sm font-black text-white shadow-md">
                    ✓
                  </span>
                ) : null}

                {/* ไอคอนพรีวิวแนวตั้ง vs แนวนอน พร้อมรูปคนตัวอย่าง */}
                <div className="flex h-36 items-center justify-center">
                  <OrientationSampleIcon isVertical={isVertical} />
                </div>

                <div className="flex flex-col gap-1">
                  <span
                    className={`text-2xl font-black transition sm:text-3xl ${
                      isSelected
                        ? "text-pink-600"
                        : "text-zinc-900 group-hover:text-pink-600"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="font-mono text-xs font-bold tracking-wider text-pink-500 uppercase">
                    {opt.sub}
                  </span>
                  <span className="mt-0.5 text-sm text-zinc-600">
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ขั้นตอนแรกหลังจ่ายเงิน: ไม่มีปุ่ม Back เพื่อกันกดย้อนกลับไปหน้าแรก/จ่ายเงินซ้ำ */}
        <div className="flex w-full items-center justify-end gap-4 pt-1">
          <button
            type="button"
            onClick={() => setStep("shots")}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-pink-500 px-10 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/25 transition active:scale-95 hover:bg-pink-400"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="rounded-full border border-pink-200 bg-pink-50 px-4 py-1 font-mono text-xs font-bold tracking-widest text-pink-600 uppercase">
          Step 2 of 2 • {orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"}
        </span>
        <h2 className="text-2xl font-black text-zinc-900 sm:text-3xl">
          เลือกรูปแบบจำนวนรูป ({orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"})
        </h2>
      </div>

      {/* ตัวเลือกจำนวนรูป 1-4 เด้งปรับตามแนวตั้ง/แนวนอนอัตโนมัติ + พรีวิว */}
      <div className="grid w-full grid-cols-1 gap-5 landscape:grid-cols-12 landscape:gap-6 portrait:gap-6">
        <div className="flex flex-col justify-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-pink-500/5 sm:p-7 landscape:col-span-7">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {SHOT_OPTIONS.map((opt) => {
              const active = shots === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setShots(opt.count)}
                  className={`relative flex min-h-40 flex-col items-center justify-center gap-2.5 rounded-2xl border-2 p-4 transition active:scale-95 portrait:min-h-44 ${
                    active
                      ? "border-pink-500 bg-pink-50/70 text-pink-600 shadow-lg shadow-pink-500/15"
                      : "border-zinc-200 bg-zinc-50/70 text-zinc-700 hover:border-pink-300 hover:bg-white"
                  }`}
                >
                  {active ? (
                    <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white shadow">
                      ✓
                    </span>
                  ) : null}

                  <MiniLayoutIcon
                    count={opt.count}
                    orientation={orientation}
                    active={active}
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-base font-black sm:text-lg">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ฝั่งตัวอย่างโครงกรอบ */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-pink-500/5 sm:p-7 landscape:col-span-5">
          <div className="text-center">
            <p className="font-mono text-xs font-bold tracking-widest text-zinc-500 uppercase">
              Layout Preview
            </p>
            <p className="mt-1 text-lg font-black text-zinc-900 sm:text-xl">
              {shots} รูป • {orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"}
            </p>
          </div>

          <div className="flex min-h-40 w-full items-center justify-center portrait:min-h-48">
            <div
              className={`flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 p-3.5 shadow-inner transition-all ${
                orientation === "vertical"
                  ? "w-32 flex-col"
                  : "w-full max-w-[320px] flex-row"
              }`}
            >
              {Array.from({ length: shots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-md bg-white shadow-sm ${
                    orientation === "vertical"
                      ? shots === 1
                        ? "h-36 w-full"
                        : shots === 2
                        ? "h-22 w-full"
                        : shots === 3
                        ? "h-16 w-full"
                        : "h-12 w-full"
                      : "h-24 flex-1"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ปุ่ม Back / Next ด้านล่างเหมือนภาพตัวอย่าง */}
      <div className="flex w-full items-center justify-between gap-4 pt-1">
        <button
          type="button"
          onClick={() => setStep("orientation")}
          className="inline-flex min-h-14 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-bold tracking-wider text-zinc-700 uppercase shadow-sm transition active:scale-95 hover:border-pink-400 hover:text-pink-600"
        >
          ← Back
        </button>

        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-pink-500 px-10 text-base font-black tracking-wider text-white uppercase shadow-lg shadow-pink-500/25 transition active:scale-95 hover:bg-pink-400"
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
