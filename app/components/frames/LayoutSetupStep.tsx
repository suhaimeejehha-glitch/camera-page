"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearMotionFrames, clearSessionPhotos } from "@/lib/mediaStore";
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
        className="h-32 w-28 sm:h-40 sm:w-34 lg:h-44 lg:w-38 drop-shadow-md"
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
      className="h-28 w-40 sm:h-34 sm:w-48 lg:h-38 lg:w-54 drop-shadow-md"
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
      className={`flex gap-1 rounded-lg border-2 p-1 shadow-sm transition-all ${
        active
          ? "border-pink-500 bg-pink-100/60 shadow-pink-500/20"
          : "border-zinc-200 bg-zinc-100"
      } ${
        isVertical
          ? "h-16 sm:h-18 lg:h-20 w-10 sm:w-11 lg:w-12 flex-col"
          : "h-9 sm:h-10 lg:h-11 w-18 sm:w-20 lg:w-22 flex-row"
      }`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`flex-1 min-h-0 min-w-0 rounded-xs transition-colors ${
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
    void clearSessionPhotos();
  }, []);

  const handleSelectOrientation = (nextOrientation: LayoutOrientation) => {
    setOrientation(nextOrientation);
  };

  if (step === "orientation") {
    return (
      <div className="flex h-full max-h-full w-full max-w-5xl lg:max-w-6xl flex-col items-center justify-between gap-3 sm:gap-5 py-2 select-none">
        {/* หัวข้อ */}
        <div className="flex flex-col items-center gap-1.5 text-center shrink-0">
          <span className="rounded-full border border-pink-200 bg-pink-50 px-6 py-1.5 font-mono text-xs sm:text-sm lg:text-base font-black tracking-widest text-pink-600 uppercase shadow-xs">
            Step 1 of 2 • CHOOSE ORIENTATION
          </span>
          <h2 className="text-3xl font-black text-zinc-900 sm:text-4xl lg:text-5xl tracking-tight">
            เลือกแนวกรอบที่ต้องการ
          </h2>
          <p className="text-base font-bold text-zinc-500 sm:text-lg lg:text-xl">
            แตะเลือก <span className="text-pink-600 font-black">แนวตั้ง</span> หรือ <span className="text-pink-600 font-black">แนวนอน</span> แล้วกดปุ่มถัดไป
          </p>
        </div>

        {/* ตัวเลือก 2 การ์ดใหญ่เต็มจอสัมผัส */}
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 max-w-4xl lg:max-w-5xl my-auto">
          {ORIENTATION_OPTIONS.map((opt) => {
            const isVertical = opt.value === "vertical";
            const isSelected = orientation === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOrientation(opt.value)}
                className={`group relative flex min-h-64 sm:min-h-76 lg:min-h-84 flex-col items-center justify-center gap-4 rounded-[32px] sm:rounded-[36px] border-3 bg-white p-6 sm:p-8 text-center shadow-xl transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${
                  isSelected
                    ? "border-pink-500 shadow-pink-500/25 ring-4 ring-pink-500/20 bg-gradient-to-b from-pink-50/40 to-white"
                    : "border-zinc-200 hover:border-pink-300"
                }`}
              >
                {isSelected ? (
                  <span className="absolute -top-3.5 -right-3.5 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-pink-500 text-lg sm:text-xl font-black text-white shadow-lg ring-4 ring-white">
                    ✓
                  </span>
                ) : null}

                <div className="flex h-32 sm:h-38 lg:h-44 items-center justify-center">
                  <OrientationSampleIcon isVertical={isVertical} />
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`text-3xl sm:text-4xl lg:text-5xl font-black transition ${
                      isSelected
                        ? "text-pink-600"
                        : "text-zinc-900 group-hover:text-pink-600"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-black tracking-wider text-pink-500 uppercase">
                    {opt.sub}
                  </span>
                  <span className="mt-1 text-sm sm:text-base lg:text-lg text-zinc-500 font-semibold max-w-xs">
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ปุ่ม Back และ Next ด้านล่าง */}
        <div className="flex w-full items-center justify-between gap-4 max-w-4xl lg:max-w-5xl shrink-0 pt-2">
          <Link
            href="/payment"
            className="inline-flex h-16 sm:h-18 lg:h-20 w-40 sm:w-48 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-300 bg-white px-6 text-lg sm:text-xl font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
          >
            ← BACK
          </Link>

          <button
            type="button"
            onClick={() => setStep("shots")}
            className="inline-flex h-16 sm:h-18 lg:h-20 flex-1 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 text-xl sm:text-2xl lg:text-3xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            ไปเลือกจำนวนรูป • NEXT →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-full w-full max-w-6xl lg:max-w-7xl flex-col items-center justify-between gap-2 sm:gap-3 py-1 select-none overflow-hidden">
      {/* หัวข้อ Step 2 */}
      <div className="flex flex-col items-center gap-1 text-center shrink-0">
        <span className="rounded-full border border-pink-200 bg-pink-50 px-5 py-1 font-mono text-xs sm:text-sm font-black tracking-widest text-pink-600 uppercase shadow-xs">
          Step 2 of 2 • {orientation === "vertical" ? "แนวตั้ง (Vertical)" : "แนวนอน (Horizontal)"}
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight">
          เลือกจำนวนรูป ({orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"})
        </h2>
        <p className="text-sm sm:text-base font-bold text-zinc-500">
          แตะเลือกจำนวนช็อตที่ต้องการถ่าย 1-4 รูป แล้วกดปุ่มถัดไป
        </p>
      </div>

      {/* ตัวเลือกจำนวนรูป 1-4 + พรีวิว ล็อกความสูงพอดีจอทัชสกรีน ไม่ขยับ ไม่ล้น */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-5 my-auto items-stretch">
        {/* ฝั่งซ้าย: ปุ่มเลือก 1, 2, 3, 4 รูป */}
        <div className="flex flex-col justify-between gap-3 rounded-[32px] sm:rounded-[36px] border-2 border-zinc-200 bg-white p-4 sm:p-5 shadow-xl sm:col-span-7">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs sm:text-sm font-black tracking-wider text-pink-600 uppercase">
              SHOT COUNT • เลือกจำนวนรูป
            </p>
            <span className="text-xs font-bold text-zinc-400">
              เลือกได้ 1 รูปแบบ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 my-auto">
            {SHOT_OPTIONS.map((opt) => {
              const active = shots === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setShots(opt.count)}
                  className={`relative flex h-36 sm:h-42 lg:h-46 flex-col items-center justify-center gap-2 rounded-2xl border-3 p-2.5 sm:p-3 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                    active
                      ? "border-pink-500 bg-pink-50/90 text-pink-600 shadow-lg shadow-pink-500/20 ring-4 ring-pink-500/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-pink-300 shadow-sm"
                  }`}
                >
                  {active ? (
                    <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-pink-500 text-xs sm:text-sm font-black text-white shadow-md ring-2 ring-white">
                      ✓
                    </span>
                  ) : null}

                  <div className="flex items-center justify-center h-16 sm:h-20 shrink-0">
                    <MiniLayoutIcon
                      count={opt.count}
                      orientation={orientation}
                      active={active}
                    />
                  </div>

                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black">
                      {opt.label}
                    </span>
                    <span className="text-[11px] sm:text-xs text-zinc-500 font-bold line-clamp-1">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs font-semibold text-zinc-400">
            แตะที่การ์ดเพื่อดูการจัดวางใน Layout Preview
          </p>
        </div>

        {/* ฝั่งขวา: ตัวอย่างโครงกรอบ (Preview) - ความสูงตายตัว 100% ไม่ว่าเลือกกี่รูปจะไม่ขยับ */}
        <div className="flex flex-col items-center justify-between gap-2 rounded-[32px] sm:rounded-[36px] border-2 border-zinc-200 bg-white p-4 sm:p-5 shadow-xl sm:col-span-5">
          <div className="text-center">
            <p className="font-mono text-xs sm:text-sm font-black tracking-widest text-pink-600 uppercase">
              LAYOUT PREVIEW
            </p>
            <p className="font-black text-zinc-900 text-lg sm:text-xl lg:text-2xl mt-0.5">
              {shots} รูป • {orientation === "vertical" ? "แนวตั้ง" : "แนวนอน"}
            </p>
          </div>

          {/* กรอบพรีวิวที่ล็อกความสูงคงที่ ไม่ขยายเมื่อเลือก 4 รูป */}
          <div className="flex h-[210px] sm:h-[240px] lg:h-[260px] w-full items-center justify-center">
            <div
              className={`flex gap-2 rounded-2xl border-2 border-zinc-300 bg-zinc-100 p-2.5 shadow-md transition-all ${
                orientation === "vertical"
                  ? "h-full w-36 sm:w-40 lg:w-44 flex-col"
                  : "h-36 sm:h-40 w-full max-w-[360px] sm:max-w-[420px] flex-row"
              }`}
            >
              {Array.from({ length: shots }).map((_, idx) => (
                <div
                  key={idx}
                  className="group relative flex-1 min-h-0 min-w-0 overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-xs"
                >
                  <SamplePosePhoto poseIndex={idx} />
                  <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 font-mono text-[9px] sm:text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 font-bold text-center">
            ตัวอย่างการจัดวางภาพ {shots} ช็อตในกรอบ
          </p>
        </div>
      </div>

      {/* ปุ่ม Back และ Next ด้านล่าง - ล็อกตำแหน่งไม่ตกจอ */}
      <div className="flex w-full items-center justify-between gap-4 max-w-6xl lg:max-w-7xl shrink-0 pt-1">
        <button
          type="button"
          onClick={() => setStep("orientation")}
          className="inline-flex h-16 sm:h-18 lg:h-20 w-40 sm:w-48 lg:w-52 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-300 bg-white px-6 text-lg sm:text-xl lg:text-2xl font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
        >
          ← BACK
        </button>

        <Link
          href={`/frames?shots=${shots}&orientation=${orientation}`}
          className="inline-flex h-16 sm:h-18 lg:h-20 flex-1 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 text-xl sm:text-2xl lg:text-3xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          ไปเลือกธีมกรอบรูป • NEXT →
        </Link>
      </div>
    </div>
  );
}
