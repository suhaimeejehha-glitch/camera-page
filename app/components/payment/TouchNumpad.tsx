// ไฟล์: app/components/payment/TouchNumpad.tsx
"use client";

import { useState } from "react";

interface TouchNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  submitColor?: "pink" | "emerald";
  isLoading?: boolean;
  errorMessage?: string | null;
  onIncomplete?: () => void;
}

export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} - ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} - ${digits.slice(3, 6)} - ${digits.slice(6)}`;
}

export function TouchNumpad({
  value,
  onChange,
  onSubmit,
  onCancel,
  title,
  subtitle,
  submitLabel = "ยืนยัน",
  cancelLabel = "ข้ามไปก่อน",
  submitColor = "pink",
  isLoading = false,
  errorMessage,
  onIncomplete,
}: TouchNumpadProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const cleanDigits = value.replace(/\D/g, "");
  const isComplete = cleanDigits.length === 10;

  const handleDigit = (digit: string) => {
    setLocalError(null);
    if (cleanDigits.length >= 10) return;
    onChange(cleanDigits + digit);
  };

  const handleBackspace = () => {
    setLocalError(null);
    if (cleanDigits.length === 0) return;
    onChange(cleanDigits.slice(0, -1));
  };

  const handleClear = () => {
    setLocalError(null);
    onChange("");
  };

  const handleClickSubmit = () => {
    if (isLoading) return;
    if (!isComplete) {
      if (onIncomplete) {
        onIncomplete();
      } else {
        setLocalError(
          `กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (ปัจจุบันกรอกแล้ว ${cleanDigits.length}/10 หลัก)`
        );
      }
      return;
    }
    onSubmit();
  };

  const activeError = errorMessage || localError;

  const submitButtonClass =
    submitColor === "pink"
      ? "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-pink-500/30 hover:from-pink-400 hover:to-rose-400"
      : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400";

  return (
    <div className="flex w-full max-w-md sm:max-w-lg md:max-w-xl flex-col items-center gap-3 sm:gap-4 rounded-[28px] sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-4 sm:p-7 md:p-8 shadow-2xl select-none my-auto">
      {/* ส่วนหัวข้อ */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs sm:text-sm md:text-base font-semibold text-zinc-600">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* ช่องแสดงเบอร์โทรขนาดใหญ่ชัดเจน พร้อมตัวนับหลัก */}
      <div className="flex flex-col w-full gap-1">
        <div className="flex w-full h-15 sm:h-17 md:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-pink-200 bg-pink-50/70 px-5 text-center shadow-inner">
          {cleanDigits.length > 0 ? (
            <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black tracking-wider text-zinc-900">
              {formatPhoneNumber(cleanDigits)}
            </span>
          ) : (
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-400">
              แตะเบอร์โทรศัพท์ 10 หลัก
            </span>
          )}
        </div>
        <div className="flex justify-end pr-2 text-xs font-mono font-bold text-zinc-400">
          {cleanDigits.length}/10 หลัก
        </div>
      </div>

      {/* กล่องแจ้งเตือนข้อผิดพลาดภายในตัวแป้นพิมพ์ */}
      {activeError ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-2.5 text-center text-xs sm:text-sm md:text-base font-black text-rose-600 shadow-sm">
          <span>⚠️</span>
          <span>{activeError}</span>
        </div>
      ) : null}

      {/* แป้นพิมพ์ตัวเลขทัชสกรีน พอดีนิ้ว */}
      <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="flex h-13 sm:h-15 md:h-16 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50 text-2xl sm:text-3xl md:text-4xl font-black text-zinc-800 shadow-xs transition active:scale-90 active:bg-pink-100 hover:border-pink-300 hover:bg-white touch-manipulation cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* ปุ่มล้าง */}
        <button
          type="button"
          onClick={handleClear}
          disabled={cleanDigits.length === 0}
          className="flex h-13 sm:h-15 md:h-16 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-100 text-sm sm:text-base md:text-lg font-black text-zinc-600 shadow-xs transition active:scale-90 disabled:opacity-30 touch-manipulation cursor-pointer"
        >
          ล้าง
        </button>

        {/* เลข 0 */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="flex h-13 sm:h-15 md:h-16 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50 text-2xl sm:text-3xl md:text-4xl font-black text-zinc-800 shadow-xs transition active:scale-90 active:bg-pink-100 hover:border-pink-300 hover:bg-white touch-manipulation cursor-pointer"
        >
          0
        </button>

        {/* ปุ่ม Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={cleanDigits.length === 0}
          className="flex h-13 sm:h-15 md:h-16 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-rose-50 text-2xl sm:text-3xl font-black text-rose-600 shadow-xs transition active:scale-90 disabled:opacity-30 touch-manipulation cursor-pointer"
        >
          ⌫
        </button>
      </div>

      {/* ปุ่มยืนยัน และ ปุ่มข้าม */}
      <div className="flex w-full flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={handleClickSubmit}
          disabled={isLoading}
          className={`inline-flex h-14 sm:h-16 md:h-18 w-full items-center justify-center rounded-full text-lg sm:text-xl md:text-2xl font-black tracking-wider text-white uppercase shadow-xl transition active:scale-95 disabled:opacity-50 border-2 border-white/20 touch-manipulation cursor-pointer ${submitButtonClass}`}
        >
          {isLoading ? "กำลังตรวจสอบ..." : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm sm:text-base font-bold text-zinc-500 hover:text-zinc-800 transition py-1 text-center touch-manipulation cursor-pointer"
          >
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
