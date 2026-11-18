// ไฟล์: app/components/payment/StampCardView.tsx
"use client";

import { useEffect, useState } from "react";
import { formatPhoneNumber } from "./TouchNumpad";
import type { MemberPointsData } from "@/lib/pointsStore";

interface StampCardViewProps {
  memberData: MemberPointsData;
  newlyAdded?: boolean;
  onProceed: () => void;
  onSetTestPoints?: (points: number) => void;
}

export function StampCardView({
  memberData,
  newlyAdded = true,
  onProceed,
  onSetTestPoints,
}: StampCardViewProps) {
  const [countdown, setCountdown] = useState(6);
  const currentPoints = memberData.points;
  const isRedeemable = currentPoints >= 10;
  const remainingNeeded = Math.max(0, 10 - currentPoints);

  // นับถอยหลัง 6 วินาทีแล้วพาไปหน้าเลือกกรอบอัตโนมัติ
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onProceed]);

  return (
    <div className="flex w-full max-w-xl sm:max-w-2xl md:max-w-3xl flex-col items-center gap-5 sm:gap-6 rounded-3xl sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-6 sm:p-10 md:p-12 shadow-2xl my-auto">
      {/* ส่วนหัวข้อบอกความคืบหน้า */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="rounded-full border-2 border-pink-300 bg-pink-50 px-6 py-1.5 font-mono text-sm sm:text-base font-black text-pink-600 uppercase shadow-xs">
          {formatPhoneNumber(memberData.phone)}
        </span>

        {isRedeemable ? (
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-600">
              🎉 ครบ 10 แต้มแล้ว!
            </h2>
            <p className="text-base sm:text-xl font-bold text-zinc-700">
              คุณได้รับสิทธิ์ถ่ายฟรี 1 ครั้ง (แลกใช้ได้ในรอบถัดไป)
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900">
              {newlyAdded ? "สะสมแต้มสำเร็จ +1 แต้ม! 🎉" : "บัตรสะสมแต้มของคุณ"}
            </h2>
            <p className="text-sm sm:text-lg font-bold text-zinc-600">
              ตอนนี้มี <span className="text-pink-600 font-black text-xl">{currentPoints}</span> / 10 แต้ม
              (ขาดอีก <span className="text-pink-600 font-black text-xl">{remainingNeeded}</span> ครั้ง แลกถ่ายฟรี)
            </p>
          </div>
        )}
      </div>

      {/* แผ่นการ์ดสแตมป์ 10 ช่อง (Digital Stamp Card) */}
      <div className="w-full rounded-2xl sm:rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-pink-50/70 via-white to-pink-50/70 p-5 sm:p-7 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b-2 border-pink-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-pink-500 text-white font-mono font-black text-sm shadow">
              ◉
            </span>
            <span className="font-mono text-xs sm:text-sm md:text-base font-black tracking-wider text-zinc-800 uppercase">
              STUDIO BOOTH REWARDS
            </span>
          </div>
          <span className="rounded-full bg-pink-500/15 px-3 py-1 font-mono text-xs sm:text-sm font-black text-pink-600">
            10 ช็อต ฟรี 1 ใบ
          </span>
        </div>

        {/* ตารางสแตมป์ 10 ดวง (2 แถว x 5 ช่อง) */}
        <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 10 }).map((_, index) => {
            const slotNumber = index + 1;
            const isStamped = slotNumber <= currentPoints;
            const isLatest = slotNumber === currentPoints && newlyAdded;
            const isFreeSlot = slotNumber === 10;

            return (
              <div
                key={slotNumber}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                  isStamped
                    ? isFreeSlot
                      ? "border-amber-400 bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 shadow-md ring-2 ring-amber-400/40"
                      : "border-pink-500 bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 text-white shadow-md"
                    : isFreeSlot
                    ? "border-dashed border-amber-400 bg-amber-50/60 text-amber-600"
                    : "border-dashed border-zinc-200 bg-zinc-50/70 text-zinc-400"
                } ${isLatest ? "scale-105 animate-bounce ring-2 ring-pink-400/50" : ""}`}
              >
                {/* ไอคอนในช่องสแตมป์ */}
                {isStamped ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl drop-shadow">
                      {isFreeSlot ? "👑" : "📸"}
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] font-black tracking-tighter">
                      {isFreeSlot ? "FREE" : `#${slotNumber}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm opacity-40">
                      {isFreeSlot ? "🎁" : "○"}
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400">
                      {isFreeSlot ? "FREE" : slotNumber}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ปุ่มกดไปต่อหน้าเลือกกรอบ */}
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onProceed}
          className="inline-flex h-16 sm:h-18 md:h-20 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          ไปเลือกกรอบรูปต่อ ({countdown}s) →
        </button>

        {/* ปุ่มทดสอบ */}
        {onSetTestPoints ? (
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onSetTestPoints(10)}
              className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200 transition"
            >
              ⚡ ทดสอบ: ตั้ง 10 แต้ม
            </button>
            <button
              type="button"
              onClick={() => onSetTestPoints(1)}
              className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200 transition"
            >
              รีเซ็ต 1 แต้ม
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
