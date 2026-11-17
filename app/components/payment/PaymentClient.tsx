"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SESSION_PRICE = 190;
const PAYMENT_TIMEOUT_SECONDS = 300; // 5 นาที
/** เปลี่ยนเป็นพาธไฟล์รูป QR PromptPay จริงใน /public ได้ที่นี่ */
const PROMPTPAY_QR_SRC = "/images/promptpay-qr.jpg";

type PaymentStep = "summary" | "qr" | "success";

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * หน้าชำระเงินด้วย PromptPay:
 * 1) แสดงราคา 190 และยอดรวมทั้งหมด + ปุ่ม "ชำระเงิน"
 * 2) กดชำระเงินแล้วแสดง QR Code + เวลานับถอยหลัง + เช็กยอดชำระ
 * 3) ชำระสำเร็จแล้วเด้งไปหน้าเลือกแนวตั้ง/แนวนอน (/setup) อัตโนมัติ
 */
export function PaymentClient() {
  const router = useRouter();
  const [step, setStep] = useState<PaymentStep>("summary");
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step !== "qr") return;

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [step]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  const handleOpenQr = () => {
    setSecondsLeft(PAYMENT_TIMEOUT_SECONDS);
    setStatusMessage(null);
    setIsChecking(false);
    setStep("qr");
  };

  const handleCheckPayment = () => {
    if (isChecking || secondsLeft === 0) return;
    setIsChecking(true);
    setStatusMessage("กำลังตรวจสอบยอดเงิน PromptPay...");

    // TODO: เชื่อม API ตรวจสอบสถานะการชำระเงินจริง (Webhook / Slip API) ที่นี่
    checkTimerRef.current = setTimeout(() => {
      setIsChecking(false);
      setStep("success");
      redirectTimerRef.current = setTimeout(() => {
        router.replace("/setup");
      }, 1200);
    }, 900);
  };

  if (step === "success") {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-2xl shadow-pink-500/10">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 text-5xl font-black text-emerald-500">
          ✓
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-wide text-zinc-900 uppercase">
            ชำระเงินสำเร็จ!
          </h2>
          <p className="font-mono text-base font-bold text-emerald-600">
            ยอดชำระ ฿{SESSION_PRICE}
          </p>
        </div>
        <p className="text-base text-zinc-500">
          กำลังพาไปหน้าเลือกแนวตั้ง / แนวนอน...
        </p>
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div className="flex w-full max-w-5xl flex-col items-center gap-6">
        <div className="flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl shadow-pink-500/10 sm:p-10">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
            <div>
              <p className="font-mono text-sm font-black tracking-widest text-pink-500 uppercase">
                Studio Booth Package
              </p>
              <h2 className="mt-1 text-3xl font-black text-zinc-900 sm:text-4xl">
                สรุปรายการชำระเงิน
              </h2>
            </div>
            <span className="rounded-full border-2 border-pink-200 bg-pink-50 px-5 py-2 font-mono text-sm font-black text-pink-600 uppercase">
              PromptPay
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-50/90 p-6 sm:p-8">
            <div className="flex items-center justify-between text-lg sm:text-xl font-bold text-zinc-800">
              <span>ถ่ายภาพ Photobooth + ปริ้นต์ + QR โหลดภาพ &amp; GIF</span>
              <span className="font-mono font-black text-zinc-900 text-xl sm:text-2xl">
                ฿{SESSION_PRICE}
              </span>
            </div>
            <div className="flex items-center justify-between text-base sm:text-lg font-semibold text-zinc-600">
              <span>เลือกได้ 1–4 รูป (แนวตั้ง / แนวนอน) + สติกเกอร์</span>
              <span className="font-mono font-bold">1 รอบ</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t-2 border-zinc-200 pt-5">
              <span className="text-xl sm:text-2xl font-black text-zinc-900">
                รวมยอดทั้งหมด
              </span>
              <span className="font-mono text-5xl sm:text-6xl font-black text-pink-500">
                ฿{SESSION_PRICE}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-2xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-10 sm:px-12 text-lg sm:text-xl font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
          >
            ← Back
          </Link>

          <button
            type="button"
            onClick={handleOpenQr}
            className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-12 sm:px-16 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-2xl shadow-pink-500/35 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            ชำระเงิน ฿{SESSION_PRICE} →
          </button>
        </div>
      </div>
    );
  }

  const isExpired = secondsLeft === 0;

  return (
    <div className="flex max-h-full w-full max-w-5xl flex-col items-center justify-center gap-7 rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-pink-500/10 sm:p-10 landscape:flex-row landscape:gap-10">
      {/* ฝั่ง QR Code พร้อมเพย์ */}
      <div className="flex shrink-0 flex-col items-center gap-3.5 rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-6 text-zinc-900 shadow-sm">
        <div className="flex w-full items-center justify-between border-b border-zinc-200 pb-3">
          <span className="text-sm font-black tracking-wider text-pink-600 uppercase">
            Thai QR PromptPay
          </span>
          <span className="font-mono text-lg font-black text-zinc-900">
            ฿{SESSION_PRICE}.00
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROMPTPAY_QR_SRC}
          alt="PromptPay QR Code"
          className="max-h-[46dvh] w-auto max-w-[300px] rounded-2xl object-contain portrait:max-h-[34dvh] shadow-inner"
        />

        <p className="font-mono text-sm font-bold text-zinc-600">
          สแกนจ่ายผ่านแอปธนาคารใดก็ได้
        </p>
      </div>

      {/* ฝั่งสถานะ เวลาที่เหลือ และปุ่มตรวจสอบยอดชำระ */}
      <div className="flex w-full flex-1 flex-col items-center gap-6 text-center landscape:items-start landscape:text-left">
        <div className="w-full rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-7">
          <p className="font-mono text-sm font-black tracking-wider text-zinc-500 uppercase">
            รวมยอดชำระทั้งหมด
          </p>
          <p className="mt-2 font-mono text-6xl font-black text-pink-500">
            ฿{SESSION_PRICE}.00
          </p>

          <div className="mt-5 flex items-center justify-center gap-3 landscape:justify-start">
            <span
              className={`h-4 w-4 rounded-full ${
                isExpired
                  ? "bg-rose-500"
                  : isChecking
                  ? "animate-ping bg-amber-400"
                  : "animate-pulse bg-pink-500"
              }`}
            />
            <span className="font-mono text-base font-bold text-zinc-700">
              {isExpired
                ? "QR Code หมดอายุ กรุณาสร้างใหม่"
                : statusMessage ?? "รอสแกนชำระเงิน • เหลือเวลา "}
              {!isExpired && !statusMessage ? (
                <span className="text-pink-600 font-black">{formatTime(secondsLeft)}</span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep("summary")}
              disabled={isChecking}
              className="inline-flex min-h-16 sm:min-h-18 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-9 text-lg sm:text-xl font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 disabled:opacity-50 touch-manipulation cursor-pointer"
            >
              ← Back
            </button>

            {isExpired ? (
              <button
                type="button"
                onClick={handleOpenQr}
                className="inline-flex min-h-16 sm:min-h-18 flex-1 items-center justify-center rounded-full bg-pink-500 px-9 text-lg sm:text-xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 touch-manipulation cursor-pointer"
              >
                สร้าง QR Code ใหม่
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckPayment}
                disabled={isChecking}
                className="inline-flex min-h-16 sm:min-h-18 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-9 text-lg sm:text-xl font-black tracking-wider text-white uppercase shadow-2xl shadow-emerald-500/35 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60 border-2 border-white/20 touch-manipulation cursor-pointer"
              >
                {isChecking ? "กำลังตรวจสอบยอดเงิน..." : "สแกนจ่ายแล้ว • Next →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
