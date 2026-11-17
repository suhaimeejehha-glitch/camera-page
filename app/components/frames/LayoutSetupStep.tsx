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
      className={`flex gap-1.5 rounded-xl border-2 p-1.5 shadow-sm transition-all ${
        active
          ? "border-pink-500 bg-pink-100/60 shadow-pink-500/20"
          : "border-zinc-200 bg-zinc-100"
      } ${isVertical ? "h-20 w-11 flex-col" : "h-12 w-24 flex-row"}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`flex-1 rounded-sm transition-colors ${
            active ? "bg-pink-500" : "bg-zinc-400"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * รูปภาพตัวอย่างคนในกรอบสไตล์ตู้สติกเกอร์ / Photobooth สำหรับแสดงใน Layout Preview
 */
function SamplePosePhoto({ poseIndex }: { poseIndex: number }) {
  const index = (poseIndex % 4) + 1;

  if (index === 1) {
    // Pose 1: ชูสองนิ้ว V-Sign ✌️ + ขยิบตายิ้มสดใส
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full object-cover" aria-hidden="true">
        <defs>
          <linearGradient id="pose1Bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="100%" stopColor="#fce7f3" />
          </linearGradient>
        </defs>
        <rect width="160" height="110" fill="url(#pose1Bg)" />
        <circle cx="80" cy="55" r="48" fill="#fbcfe8" opacity="0.45" />

        {/* เสื้อผ้าสีสดใสสไตล์เกาหลี */}
        <path d="M38 110 C44 84 58 78 80 78 C102 78 116 84 122 110 Z" fill="#ec4899" />
        <path d="M70 78 C70 86 90 86 90 78 Z" fill="#fce7f3" />

        {/* คอ */}
        <rect x="74" y="65" width="12" height="16" rx="4" fill="#fed7aa" />

        {/* ใบหน้า */}
        <ellipse cx="80" cy="50" rx="20" ry="24" fill="#fed7aa" />

        {/* ทรงผมวัยรุ่นสไตล์ Y2K / Photobooth */}
        <path d="M60 48 C58 30 70 24 80 24 C90 24 102 30 100 48 C96 35 90 32 80 32 C70 32 64 35 60 48 Z" fill="#2e1065" />
        <path d="M57 48 C57 60 62 70 63 76 C60 68 56 55 57 48 Z" fill="#2e1065" />
        <path d="M103 48 C103 60 98 70 97 76 C100 68 104 55 103 48 Z" fill="#2e1065" />

        {/* ตาขยิบข้างนึง + ตากลมโตอีกข้าง */}
        <path d="M69 48 Q72 44 75 48" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="86" cy="47" r="2.5" fill="#1f2937" />
        <circle cx="87" cy="46" r="1" fill="#ffffff" />

        {/* แก้มชมพูระเรื่อ */}
        <ellipse cx="67" cy="54" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />
        <ellipse cx="93" cy="54" rx="4" ry="2" fill="#f43f5e" opacity="0.45" />

        {/* รอยยิ้ม */}
        <path d="M77 56 Q80 61 83 56" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="#fff" />

        {/* มือชู 2 นิ้ว V-Sign ✌️ */}
        <g transform="translate(108, 48)">
          <path d="M8 32 C8 25 15 20 22 24 L22 10 C22 8 25 8 25 10 L25 22 L29 12 C29 10 32 10 32 12 L32 25 L35 18 C35 16 38 16 38 18 C38 28 32 36 24 40 Z" fill="#fed7aa" />
          <path d="M12 28 C12 20 18 10 20 6 C21 4 23 4 24 6 L24 20" stroke="#fbcfe8" strokeWidth="1" />
        </g>
        
        {/* ดาววิ้งๆ ✨ */}
        <path d="M26 30 Q28 20 30 30 Q40 32 30 34 Q28 44 26 34 Q16 32 26 30 Z" fill="#f472b6" />
      </svg>
    );
  }

  if (index === 2) {
    // Pose 2: นิ้วมินิฮาร์ท 🫰 + เอียงคอ
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full object-cover" aria-hidden="true">
        <defs>
          <linearGradient id="pose2Bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="100%" stopColor="#ede9fe" />
          </linearGradient>
        </defs>
        <rect width="160" height="110" fill="url(#pose2Bg)" />
        <circle cx="80" cy="55" r="48" fill="#ddd6fe" opacity="0.45" />

        {/* เสื้อสเวตเตอร์ม่วงพาสเทล */}
        <path d="M40 110 C46 86 62 80 80 80 C98 80 114 86 120 110 Z" fill="#8b5cf6" />
        <path d="M72 80 C72 87 88 87 88 80 Z" fill="#ede9fe" />

        {/* คอ */}
        <rect x="75" y="67" width="11" height="15" rx="4" fill="#fed7aa" />

        {/* ใบหน้าเอียงนิดๆ */}
        <g transform="rotate(5, 80, 52)">
          <ellipse cx="80" cy="50" rx="19" ry="23" fill="#fed7aa" />
          <path d="M60 46 C59 28 72 23 80 23 C88 23 101 28 100 46 C95 34 89 31 80 31 C71 31 65 34 60 46 Z" fill="#1e1b4b" />
          <path d="M58 46 C58 64 62 72 63 78 C59 70 56 56 58 46 Z" fill="#1e1b4b" />
          <path d="M102 46 C102 64 98 72 97 78 C101 70 104 56 102 46 Z" fill="#1e1b4b" />

          {/* ตายิ้มสระอิ (⌒ ⌒) */}
          <path d="M68 47 Q72 43 76 47" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M84 47 Q88 43 92 47" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* แก้มแดง */}
          <ellipse cx="67" cy="53" rx="4" ry="2" fill="#fb7185" opacity="0.5" />
          <ellipse cx="93" cy="53" rx="4" ry="2" fill="#fb7185" opacity="0.5" />

          {/* ยิ้มหวาน */}
          <path d="M76 55 Q80 60 84 55" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="#fff" />
        </g>

        {/* นิ้วทำท่ามินิฮาร์ท 🫰 */}
        <g transform="translate(102, 38)">
          <path d="M10 32 C10 24 16 20 22 22 L24 12 C24 9 27 9 28 12 L27 20 L31 16 C32 14 35 15 34 18 L30 24" fill="#fed7aa" />
          {/* หัวใจสีชมพูลอยด้านบน */}
          <path d="M26 6 C26 3 23 1 21 3 C19 1 16 3 16 6 C16 10 21 13 21 13 C21 13 26 10 26 6 Z" fill="#ec4899" />
        </g>
      </svg>
    );
  }

  if (index === 3) {
    // Pose 3: เพื่อนสนิทถ่ายคู่กัน (Duo Pose) 👯
    return (
      <svg viewBox="0 0 160 110" className="h-full w-full object-cover" aria-hidden="true">
        <defs>
          <linearGradient id="pose3Bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="100%" stopColor="#ffedd5" />
          </linearGradient>
        </defs>
        <rect width="160" height="110" fill="url(#pose3Bg)" />
        <circle cx="80" cy="55" r="48" fill="#fed7aa" opacity="0.45" />

        {/* คนฝั่งซ้าย (เสื้อฟ้า หมวกแก๊ป) */}
        <g transform="translate(-10, 4)">
          <path d="M40 106 C44 86 58 82 72 82 C86 82 100 86 104 106 Z" fill="#0284c7" />
          <ellipse cx="72" cy="54" rx="17" ry="20" fill="#fed7aa" />
          <path d="M55 50 C54 36 64 32 72 32 C80 32 90 36 89 50 C86 40 80 38 72 38 C64 38 58 40 55 50 Z" fill="#0369a1" />
          <circle cx="66" cy="52" r="2.2" fill="#1f2937" />
          <circle cx="78" cy="52" r="2.2" fill="#1f2937" />
          <ellipse cx="64" cy="57" rx="3" ry="1.5" fill="#f43f5e" opacity="0.45" />
          <ellipse cx="80" cy="57" rx="3" ry="1.5" fill="#f43f5e" opacity="0.45" />
          <path d="M69 59 Q72 63 75 59" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="#fff" />
        </g>

        {/* คนฝั่งขวา (เสื้อส้ม ผมยาว) */}
        <g transform="translate(18, 2)">
          <path d="M40 108 C44 86 60 82 74 82 C88 82 102 86 106 108 Z" fill="#f59e0b" />
          <ellipse cx="74" cy="52" rx="16" ry="20" fill="#fed7aa" />
          <path d="M57 48 C56 34 66 30 74 30 C82 30 92 34 91 48 C88 38 82 36 74 36 C66 36 60 38 57 48 Z" fill="#451a03" />
          <path d="M55 48 C55 64 58 72 60 78" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M93 48 C93 64 90 72 88 78" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M67 50 Q70 47 73 50" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="81" cy="50" r="2.2" fill="#1f2937" />
          <ellipse cx="66" cy="55" rx="3" ry="1.5" fill="#f43f5e" opacity="0.45" />
          <ellipse cx="82" cy="55" rx="3" ry="1.5" fill="#f43f5e" opacity="0.45" />
          <path d="M71 57 Q74 61 77 57" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="#fff" />
        </g>
      </svg>
    );
  }

  // Pose 4: ท่าแมวน่ารัก / แว่นตากลม 👓🐾
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full object-cover" aria-hidden="true">
      <defs>
        <linearGradient id="pose4Bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
      </defs>
      <rect width="160" height="110" fill="url(#pose4Bg)" />
      <circle cx="80" cy="55" r="48" fill="#bbf7d0" opacity="0.45" />

      {/* เสื้อฮู้ดเขียวมิ้นต์ */}
      <path d="M40 110 C46 86 62 80 80 80 C98 80 114 86 120 110 Z" fill="#10b981" />
      <path d="M72 80 C72 87 88 87 88 80 Z" fill="#dcfce7" />

      {/* หัว */}
      <ellipse cx="80" cy="50" rx="19" ry="23" fill="#fed7aa" />

      {/* ที่คาดผมหูแมว */}
      <path d="M60 46 C59 28 72 23 80 23 C88 23 101 28 100 46 C95 34 89 31 80 31 C71 31 65 34 60 46 Z" fill="#1c1917" />
      <path d="M64 26 L60 12 L72 20 Z" fill="#1c1917" />
      <path d="M64 24 L62 16 L69 21 Z" fill="#f472b6" />
      <path d="M96 26 L100 12 L88 20 Z" fill="#1c1917" />
      <path d="M96 24 L98 16 L91 21 Z" fill="#f472b6" />

      {/* แว่นตากลม */}
      <circle cx="71" cy="48" r="7" stroke="#1f2937" strokeWidth="1.8" fill="none" opacity="0.8" />
      <circle cx="89" cy="48" r="7" stroke="#1f2937" strokeWidth="1.8" fill="none" opacity="0.8" />
      <path d="M78 48 L82 48" stroke="#1f2937" strokeWidth="1.8" />

      {/* ตาผ่านแว่น */}
      <circle cx="71" cy="48" r="2.2" fill="#1f2937" />
      <path d="M86 48 Q89 45 92 48" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* แก้มและรอยยิ้ม */}
      <ellipse cx="65" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.5" />
      <ellipse cx="95" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.5" />
      <path d="M77 56 Q80 61 83 56" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="#fff" />

      {/* อุ้งเท้าแมว 2 ข้าง 🐾 */}
      <g transform="translate(42, 68)">
        <ellipse cx="14" cy="14" rx="10" ry="8" fill="#fed7aa" />
        <circle cx="10" cy="8" r="2.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="14" cy="6" r="2.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="18" cy="8" r="2.5" fill="#f43f5e" opacity="0.6" />
        <ellipse cx="14" cy="14" rx="4" ry="3" fill="#f43f5e" opacity="0.6" />
      </g>
      <g transform="translate(90, 68)">
        <ellipse cx="14" cy="14" rx="10" ry="8" fill="#fed7aa" />
        <circle cx="10" cy="8" r="2.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="14" cy="6" r="2.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="18" cy="8" r="2.5" fill="#f43f5e" opacity="0.6" />
        <ellipse cx="14" cy="14" rx="4" ry="3" fill="#f43f5e" opacity="0.6" />
      </g>
    </svg>
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
      <div className="flex max-h-full w-full max-w-5xl flex-col items-center justify-center gap-7 portrait:gap-9">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-full border-2 border-pink-200 bg-pink-50 px-6 py-1.5 font-mono text-sm font-black tracking-widest text-pink-600 uppercase shadow-sm">
            Step 1 of 2
          </span>
          <h2 className="text-3xl font-black text-zinc-900 sm:text-5xl">
            เลือกแนวกรอบที่ต้องการ
          </h2>
          <p className="text-base font-bold text-zinc-600 sm:text-xl">
            แตะเลือก แนวตั้ง หรือ แนวนอน แล้วกด Next เพื่อเลือกรูปแบบจำนวนรูป
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          {ORIENTATION_OPTIONS.map((opt) => {
            const isVertical = opt.value === "vertical";
            const isSelected = orientation === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOrientation(opt.value)}
                className={`group relative flex min-h-64 flex-col items-center justify-center gap-6 rounded-3xl border-3 bg-white p-8 text-center shadow-2xl transition active:scale-95 portrait:min-h-72 touch-manipulation cursor-pointer ${
                  isSelected
                    ? "border-pink-500 shadow-pink-500/25 ring-4 ring-pink-500/20"
                    : "border-zinc-200/90 shadow-pink-500/5 hover:border-pink-300"
                }`}
              >
                {isSelected ? (
                  <span className="absolute -top-3.5 -right-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-lg font-black text-white shadow-lg">
                    ✓
                  </span>
                ) : null}

                {/* ไอคอนพรีวิวแนวตั้ง vs แนวนอน พร้อมรูปคนตัวอย่าง */}
                <div className="flex h-38 items-center justify-center">
                  <OrientationSampleIcon isVertical={isVertical} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span
                    className={`text-3xl font-black transition sm:text-4xl ${
                      isSelected
                        ? "text-pink-600"
                        : "text-zinc-900 group-hover:text-pink-600"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="font-mono text-sm font-black tracking-wider text-pink-500 uppercase">
                    {opt.sub}
                  </span>
                  <span className="mt-1 text-base text-zinc-600 font-semibold">
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ขั้นตอนแรกหลังจ่ายเงิน: ไม่มีปุ่ม Back เพื่อกันกดย้อนกลับไปหน้าแรก/จ่ายเงินซ้ำ */}
        <div className="flex w-full items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => setStep("shots")}
            className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-14 sm:px-18 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/35 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full border-2 border-pink-200 bg-pink-50 px-6 py-1.5 font-mono text-sm font-black tracking-widest text-pink-600 uppercase shadow-sm">
          Step 2 of 2 • {orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"}
        </span>
        <h2 className="text-3xl font-black text-zinc-900 sm:text-5xl">
          เลือกจำนวนรูป ({orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"})
        </h2>
      </div>

      {/* ตัวเลือกจำนวนรูป 1-4 เด้งปรับตามแนวตั้ง/แนวนอนอัตโนมัติ + พรีวิว */}
      <div className="grid w-full grid-cols-1 gap-6 landscape:grid-cols-12 landscape:gap-6 portrait:gap-6">
        <div className="flex flex-col justify-center gap-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-pink-500/5 sm:p-8 landscape:col-span-7">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SHOT_OPTIONS.map((opt) => {
              const active = shots === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setShots(opt.count)}
                  className={`relative flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl border-3 p-5 transition active:scale-95 portrait:min-h-52 touch-manipulation cursor-pointer ${
                    active
                      ? "border-pink-500 bg-pink-50/80 text-pink-600 shadow-xl shadow-pink-500/20 ring-4 ring-pink-500/15"
                      : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-pink-300 hover:bg-white"
                  }`}
                >
                  {active ? (
                    <span className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-sm font-black text-white shadow-lg">
                      ✓
                    </span>
                  ) : null}

                  <MiniLayoutIcon
                    count={opt.count}
                    orientation={orientation}
                    active={active}
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black sm:text-2xl">
                      {opt.label}
                    </span>
                    <span className="text-xs sm:text-sm text-zinc-600 font-semibold">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ฝั่งตัวอย่างโครงกรอบ (ขยายใหญ่ขึ้น + มีรูปคนตัวอย่างทุกช่อง) */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-pink-500/5 sm:p-8 landscape:col-span-5">
          <div className="text-center">
            <p className="font-mono text-xs sm:text-sm font-black tracking-widest text-zinc-500 uppercase">
              Layout Preview
            </p>
            <p className="mt-1 text-xl font-black text-zinc-900 sm:text-3xl">
              {shots} รูป • {orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"}
            </p>
          </div>

          <div className="flex min-h-[300px] w-full items-center justify-center py-2 portrait:min-h-56">
            <div
              className={`flex gap-3 rounded-3xl border-2 border-zinc-200 bg-zinc-100/90 p-3.5 sm:p-4.5 shadow-2xl transition-all ${
                orientation === "vertical"
                  ? "w-48 sm:w-56 md:w-60 flex-col"
                  : "w-full max-w-[440px] sm:max-w-[500px] flex-row"
              }`}
            >
              {Array.from({ length: shots }).map((_, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-xl border border-zinc-300/80 bg-white shadow-md transition hover:scale-[1.02] ${
                    orientation === "vertical"
                      ? shots === 1
                        ? "h-52 sm:h-60 w-full"
                        : shots === 2
                        ? "h-32 sm:h-38 w-full"
                        : shots === 3
                        ? "h-24 sm:h-28 w-full"
                        : "h-20 sm:h-24 md:h-26 w-full"
                      : "h-28 sm:h-34 flex-1"
                  }`}
                >
                  <SamplePosePhoto poseIndex={idx} />
                  <span className="absolute bottom-1 right-1.5 rounded-full bg-black/65 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-sm">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-zinc-500 font-bold">
            ตัวอย่างการจัดวางภาพ {shots} ช็อตในกรอบจริง
          </p>
        </div>
      </div>

      {/* ปุ่ม Back / Next ด้านล่างเหมือนภาพตัวอย่าง */}
      <div className="flex w-full items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => setStep("orientation")}
          className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-10 sm:px-12 text-lg sm:text-xl font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
        >
          ← Back
        </button>

        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-14 sm:px-18 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/35 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
