// ไฟล์: app/components/payment/TouchNumpad.tsx
"use client";

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
}: TouchNumpadProps) {
  const cleanDigits = value.replace(/\D/g, "");
  const isComplete = cleanDigits.length === 10;

  const handleDigit = (digit: string) => {
    if (cleanDigits.length >= 10) return;
    onChange(cleanDigits + digit);
  };

  const handleBackspace = () => {
    if (cleanDigits.length === 0) return;
    onChange(cleanDigits.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const submitButtonClass =
    submitColor === "pink"
      ? "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 shadow-pink-500/30 hover:from-pink-400 hover:to-rose-400"
      : "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400";

  return (
    <div className="flex w-full max-w-md sm:max-w-lg md:max-w-xl flex-col items-center gap-4 sm:gap-5 rounded-3xl sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-6 sm:p-8 md:p-10 shadow-2xl">
      {/* ส่วนหัวข้อ */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm sm:text-base md:text-lg font-semibold text-zinc-600">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* ช่องแสดงเบอร์โทรขนาดใหญ่ชัดเจน */}
      <div className="flex w-full h-16 sm:h-18 md:h-20 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-pink-200 bg-pink-50/70 px-5 text-center shadow-inner">
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

      {/* แป้นพิมพ์ตัวเลขทัชสกรีน พอดีนิ้ว */}
      <div className="grid w-full grid-cols-3 gap-2.5 sm:gap-3.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="flex h-14 sm:h-16 md:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50 text-2xl sm:text-3xl md:text-4xl font-black text-zinc-800 shadow-sm transition active:scale-90 active:bg-pink-100 hover:border-pink-300 hover:bg-white touch-manipulation cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* ปุ่มล้าง */}
        <button
          type="button"
          onClick={handleClear}
          disabled={cleanDigits.length === 0}
          className="flex h-14 sm:h-16 md:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-100 text-base sm:text-lg md:text-xl font-black text-zinc-600 shadow-sm transition active:scale-90 disabled:opacity-30 touch-manipulation cursor-pointer"
        >
          ล้าง
        </button>

        {/* เลข 0 */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="flex h-14 sm:h-16 md:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50 text-2xl sm:text-3xl md:text-4xl font-black text-zinc-800 shadow-sm transition active:scale-90 active:bg-pink-100 hover:border-pink-300 hover:bg-white touch-manipulation cursor-pointer"
        >
          0
        </button>

        {/* ปุ่ม Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={cleanDigits.length === 0}
          className="flex h-14 sm:h-16 md:h-18 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-rose-50 text-2xl sm:text-3xl font-black text-rose-600 shadow-sm transition active:scale-90 disabled:opacity-30 touch-manipulation cursor-pointer"
        >
          ⌫
        </button>
      </div>

      {/* ปุ่มยืนยัน และ ปุ่มข้าม */}
      <div className="flex w-full flex-col gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isComplete || isLoading}
          className={`inline-flex h-16 sm:h-18 md:h-20 w-full items-center justify-center rounded-full text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 border-2 border-white/20 touch-manipulation cursor-pointer ${submitButtonClass}`}
        >
          {isLoading ? "กำลังตรวจสอบ..." : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-base sm:text-lg font-bold text-zinc-500 hover:text-zinc-800 transition py-1 text-center touch-manipulation cursor-pointer"
          >
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
