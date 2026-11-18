// ไฟล์: app/components/payment/PaymentClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TouchNumpad } from "./TouchNumpad";
import { StampCardView } from "./StampCardView";
import {
  addMemberPoint,
  getMemberPoints,
  redeemMemberPoints,
  setTestMemberPoints,
  type MemberPointsData,
} from "@/lib/pointsStore";

const SESSION_PRICE = 190;
const PAYMENT_TIMEOUT_SECONDS = 300; // 5 นาที
/** รูป QR PromptPay */
const PROMPTPAY_QR_SRC = "/images/promptpay-qr.jpg";

type PaymentStep =
  | "summary"
  | "qr"
  | "points_prompt"
  | "stamp_card"
  | "redeem_numpad"
  | "redeem_success";

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PaymentClient() {
  const router = useRouter();
  const [step, setStep] = useState<PaymentStep>("summary");
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ข้อมูลสมาชิกที่กำลังสะสมหรือแลกแต้ม
  const [phoneInput, setPhoneInput] = useState("");
  const [redeemPhoneInput, setRedeemPhoneInput] = useState("");
  const [memberData, setMemberData] = useState<MemberPointsData | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false);

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
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  const handleOpenQr = () => {
    setSecondsLeft(PAYMENT_TIMEOUT_SECONDS);
    setStatusMessage(null);
    setIsChecking(false);
    setStep("qr");
  };

  // จำลองการตรวจสอบยอดเงิน PromptPay
  const handleCheckPayment = () => {
    if (isChecking || secondsLeft === 0) return;
    setIsChecking(true);
    setStatusMessage("กำลังตรวจสอบยอดเงิน PromptPay...");

    checkTimerRef.current = setTimeout(() => {
      setIsChecking(false);
      // เมื่อชำระสำเร็จ -> เด้งไปหน้ากดเบอร์สะสมแต้มทันที!
      setPhoneInput("");
      setStep("points_prompt");
    }, 800);
  };

  // กดยืนยันเบอร์เพื่อสะสมแต้ม
  const handleEarnPoints = async () => {
    if (phoneInput.length !== 10 || isSubmittingPoints) return;
    setIsSubmittingPoints(true);
    try {
      const result = await addMemberPoint(phoneInput);
      setMemberData(result.data);
      setStep("stamp_card");
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  // แตะข้ามการสะสมแต้ม -> ไปหน้าเลือกกรอบทันที
  const handleSkipPoints = () => {
    router.replace("/setup");
  };

  // ทดสอบปรับแต้มเป็น 10 หรือ 1 ในโหมดทดสอบ
  const handleSetTestPoints = async (points: number) => {
    if (!memberData) return;
    const updated = await setTestMemberPoints(memberData.phone, points);
    setMemberData({ ...updated });
  };

  // ตรวจสอบและใช้สิทธิ์ถ่ายฟรี (Hold สิทธิ์ไว้ก่อน ยังไม่ตัดแต้มจริงจนกว่าจะสั่งพิมพ์สำเร็จ)
  const handleRedeemCheck = async () => {
    if (redeemPhoneInput.length !== 10 || isSubmittingPoints) return;
    setIsSubmittingPoints(true);
    setRedeemError(null);
    try {
      const member = await getMemberPoints(redeemPhoneInput);
      if (member.points >= 10) {
        // บันทึกเบอร์ที่ขอใช้สิทธิ์ไว้ใน sessionStorage (จะหักแต้มจริงเมื่อถึงขั้นตอนสั่งพิมพ์)
        try {
          sessionStorage.setItem("photobooth_pending_redeem", redeemPhoneInput);
        } catch {}
        setMemberData(member);
        setStep("redeem_success");
      } else {
        setRedeemError(`เบอร์นี้มี ${member.points}/10 แต้ม (ยังไม่ครบ 10 แต้มสำหรับการแลกถ่ายฟรี)`);
      }
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  // ==========================================
  // STEP: แลกสิทธิ์ถ่ายฟรีสำเร็จ (ไม่ต้องจ่ายเงิน)
  // ==========================================
  if (step === "redeem_success" && memberData) {
    return (
      <div className="flex w-full max-w-xl sm:max-w-2xl flex-col items-center gap-6 sm:gap-8 rounded-3xl sm:rounded-[32px] border-2 border-emerald-300 bg-white p-8 sm:p-12 text-center shadow-2xl my-auto">
        <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-4 border-emerald-400 bg-emerald-50 text-5xl sm:text-6xl font-black text-emerald-500 shadow-md">
          👑
        </div>
        <div className="flex flex-col gap-3">
          <span className="self-center rounded-full bg-emerald-100 px-5 py-1.5 text-sm sm:text-base font-black text-emerald-800">
            เบอร์: {memberData.phone}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-600">
            สิทธิ์ของคุณพร้อมใช้งาน! 🎉
          </h2>
          <p className="text-base sm:text-xl font-bold text-zinc-700">
            ตรวจพบ 10 แต้มสะสม • รับสิทธิ์ถ่ายฟรีรอบนี้ 1 ครั้ง โดยไม่ต้องชำระเงิน
          </p>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 sm:p-4 text-xs sm:text-sm md:text-base font-bold text-emerald-800">
            🛡️ ระบบจะตัด 10 แต้มเมื่อขั้นตอนสั่งพิมพ์รูปสำเร็จเท่านั้น หากมีเหตุขัดข้องแต้มจะไม่หาย
          </div>
          <p className="font-mono text-sm sm:text-base font-bold text-zinc-500">
            แต้มสะสมปัจจุบัน: {memberData.points}/10 แต้ม
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/setup")}
          className="inline-flex h-16 sm:h-20 w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 text-xl sm:text-2xl font-black text-white uppercase shadow-xl shadow-emerald-500/30 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 border-2 border-white/20 touch-manipulation cursor-pointer"
        >
          ไปเลือกกรอบรูปเลย (ฟรี) →
        </button>
      </div>
    );
  }

  // ==========================================
  // STEP: แป้นกดเบอร์เพื่อแลกสิทธิ์ถ่ายฟรี
  // ==========================================
  if (step === "redeem_numpad") {
    return (
      <div className="flex w-full flex-col items-center gap-3 my-auto">
        <TouchNumpad
          value={redeemPhoneInput}
          onChange={setRedeemPhoneInput}
          onSubmit={handleRedeemCheck}
          onCancel={() => {
            setRedeemError(null);
            setStep("summary");
          }}
          title="🎁 แลกสิทธิ์ถ่ายฟรี 1 ครั้ง"
          subtitle="กรอกเบอร์โทรศัพท์ที่สะสมแต้มครบ 10 ครั้ง เพื่อแลกถ่ายฟรีรอบนี้"
          submitLabel="แลกสิทธิ์ถ่ายฟรีทันที ✨"
          cancelLabel="← กลับไปหน้าชำระเงินปกติ"
          submitColor="emerald"
          isLoading={isSubmittingPoints}
        />

        {redeemError ? (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-6 py-2.5 text-center text-sm sm:text-base font-black text-rose-600 shadow-sm">
            ⚠️ {redeemError}
          </div>
        ) : null}
      </div>
    );
  }

  // ==========================================
  // STEP: แสดงการ์ดสแตมป์ 10 ดวงหลังสะสมแต้ม
  // ==========================================
  if (step === "stamp_card" && memberData) {
    return (
      <StampCardView
        memberData={memberData}
        newlyAdded={true}
        onProceed={() => router.replace("/setup")}
        onSetTestPoints={handleSetTestPoints}
      />
    );
  }

  // ==========================================
  // STEP: แป้นกดเบอร์สะสมแต้ม (หลังสแกนจ่ายเงินสำเร็จ)
  // ==========================================
  if (step === "points_prompt") {
    return (
      <div className="flex w-full flex-col items-center gap-3.5 my-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-emerald-400 bg-emerald-50 px-6 py-2 text-sm sm:text-base font-black text-emerald-700 shadow-sm">
          <span className="text-lg">✓</span>
          <span>ชำระเงินสำเร็จ ฿{SESSION_PRICE}.00 เรียบร้อยแล้ว</span>
        </div>

        <TouchNumpad
          value={phoneInput}
          onChange={setPhoneInput}
          onSubmit={handleEarnPoints}
          onCancel={handleSkipPoints}
          title="🎁 สะสมแต้มรับสิทธิ์ถ่ายฟรี"
          subtitle="กดเบอร์โทรศัพท์เพื่อรับ 1 แต้ม (สะสมครบ 10 ครั้ง แลกถ่ายฟรี 1 ครั้ง!)"
          submitLabel="สะสมแต้มรับ 1 ดวง ✨"
          cancelLabel="ข้ามไปหน้าเลือกกรอบรูปเลย (ไม่สะสมแต้ม) →"
          submitColor="pink"
          isLoading={isSubmittingPoints}
        />
      </div>
    );
  }

  // ==========================================
  // STEP: สรุปรายการชำระเงิน (Summary)
  // ==========================================
  if (step === "summary") {
    return (
      <div className="flex w-full max-w-2xl sm:max-w-3xl md:max-w-4xl flex-col items-center gap-5 sm:gap-7 my-auto">
        <div className="flex w-full flex-col gap-5 sm:gap-7 rounded-3xl sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-6 sm:p-10 md:p-12 shadow-2xl">
          {/* ส่วนหัวการ์ด */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 sm:pb-5">
            <div>
              <p className="font-mono text-xs sm:text-sm md:text-base font-black tracking-widest text-pink-500 uppercase">
                Studio Booth Package
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 tracking-tight">
                สรุปรายการชำระเงิน
              </h2>
            </div>
            <span className="rounded-full border-2 border-pink-300 bg-pink-50 px-4 py-1.5 sm:px-6 sm:py-2 font-mono text-xs sm:text-base font-black text-pink-600 uppercase shadow-xs">
              PromptPay
            </span>
          </div>

          {/* กล่องรายการแพ็กเกจและราคารวม */}
          <div className="flex flex-col gap-4 rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50/90 p-5 sm:p-7 md:p-8">
            <div className="flex items-start justify-between gap-4 text-lg sm:text-2xl md:text-3xl font-black text-zinc-800">
              <span className="leading-snug">ถ่ายภาพ Photobooth + ปริ้นต์ภาพคู่ + QR โหลดไฟล์</span>
              <span className="font-mono font-black text-zinc-900 text-xl sm:text-2xl md:text-3xl shrink-0">
                ฿{SESSION_PRICE}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm sm:text-lg font-semibold text-zinc-500">
              <span>เลือกได้ 1–4 รูป (แนวตั้ง / แนวนอน) • แต่งสติกเกอร์ได้</span>
              <span className="font-mono font-bold text-zinc-700">1 รอบ</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-zinc-200 pt-4 sm:pt-6">
              <span className="text-xl sm:text-3xl md:text-4xl font-black text-zinc-900">
                รวมยอดทั้งหมด
              </span>
              <span className="font-mono text-5xl sm:text-6xl md:text-7xl font-black text-pink-500 drop-shadow-xs">
                ฿{SESSION_PRICE}
              </span>
            </div>
          </div>

          {/* แถบกดใช้สิทธิ์ถ่ายฟรีสำหรับลูกค้าสมาชิกที่สะสมครบ 10 แต้ม */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border-2 border-dashed border-pink-400 bg-pink-50/70 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3 sm:gap-4 text-left w-full sm:w-auto">
              <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-2xl sm:text-3xl font-black text-white shadow-md shadow-pink-500/30">
                🎁
              </span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg md:text-xl font-black text-zinc-900">
                  สะสมครบ 10 แต้มแล้ว?
                </span>
                <span className="text-xs sm:text-sm md:text-base text-zinc-600 font-semibold">
                  แตะที่นี่เพื่อตรวจสอบและใช้สิทธิ์ถ่ายฟรีรอบนี้ทันที
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRedeemPhoneInput("");
                setRedeemError(null);
                setStep("redeem_numpad");
              }}
              className="inline-flex h-12 sm:h-14 w-full sm:w-auto shrink-0 items-center justify-center rounded-full bg-pink-500 px-6 sm:px-8 text-sm sm:text-base md:text-lg font-black text-white shadow-md shadow-pink-500/30 transition active:scale-95 hover:bg-pink-600 border border-white/20 touch-manipulation cursor-pointer"
            >
              ใช้สิทธิ์แลกฟรี ✨
            </button>
          </div>
        </div>

        {/* ปุ่ม Back และ ปุ่มชำระเงินขนาดใหญ่พิเศษสำหรับทัชสกรีน */}
        <div className="flex w-full items-center justify-between gap-4 sm:gap-6 pt-1">
          <Link
            href="/"
            className="inline-flex h-16 sm:h-18 md:h-20 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-8 sm:px-12 text-lg sm:text-xl md:text-2xl font-black tracking-wider text-zinc-700 uppercase shadow-lg transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
          >
            ← Back
          </Link>

          <button
            type="button"
            onClick={handleOpenQr}
            className="inline-flex h-16 sm:h-18 md:h-20 flex-1 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 sm:px-14 text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/40 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/30 touch-manipulation cursor-pointer"
          >
            <span>ชำระเงิน ฿{SESSION_PRICE}</span>
            <span className="text-2xl sm:text-3xl">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP: หน้าสแกน QR Code PromptPay (QR Step)
  // ==========================================
  const isExpired = secondsLeft === 0;

  return (
    <div className="flex w-full max-w-2xl sm:max-w-4xl md:max-w-5xl flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 rounded-3xl sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-6 sm:p-10 md:p-12 shadow-2xl sm:flex-row my-auto">
      {/* ฝั่ง QR Code พร้อมเพย์ */}
      <div className="flex shrink-0 flex-col items-center gap-3.5 rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-5 sm:p-7 text-zinc-900 shadow-md">
        <div className="flex w-full items-center justify-between border-b-2 border-zinc-200 pb-2.5">
          <span className="text-xs sm:text-base font-black tracking-wider text-pink-600 uppercase">
            Thai QR PromptPay
          </span>
          <span className="font-mono text-base sm:text-xl font-black text-zinc-900">
            ฿{SESSION_PRICE}.00
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROMPTPAY_QR_SRC}
          alt="PromptPay QR Code"
          className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72 rounded-2xl object-contain shadow-inner bg-white p-2"
        />

        <p className="font-mono text-xs sm:text-sm font-bold text-zinc-600">
          สแกนจ่ายผ่านแอปธนาคารใดก็ได้
        </p>
      </div>

      {/* ฝั่งสถานะ เวลาที่เหลือ และปุ่มตรวจสอบยอดชำระ */}
      <div className="flex w-full flex-1 flex-col items-center gap-5 sm:gap-6 text-center sm:items-start sm:text-left">
        <div className="w-full rounded-2xl sm:rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-6 sm:p-8">
          <p className="font-mono text-xs sm:text-sm md:text-base font-black tracking-wider text-zinc-500 uppercase">
            รวมยอดชำระทั้งหมด
          </p>
          <p className="mt-1 font-mono text-5xl sm:text-6xl md:text-7xl font-black text-pink-500">
            ฿{SESSION_PRICE}.00
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 sm:justify-start">
            <span
              className={`h-4 w-4 rounded-full ${
                isExpired
                  ? "bg-rose-500"
                  : isChecking
                  ? "animate-ping bg-amber-400"
                  : "animate-pulse bg-pink-500"
              }`}
            />
            <span className="font-mono text-sm sm:text-base md:text-lg font-bold text-zinc-700">
              {isExpired
                ? "QR Code หมดอายุ กรุณาสร้างใหม่"
                : statusMessage ?? "รอสแกนชำระเงิน • เหลือเวลา "}
              {!isExpired && !statusMessage ? (
                <span className="text-pink-600 font-black">{formatTime(secondsLeft)}</span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setStep("summary")}
            disabled={isChecking}
            className="inline-flex h-16 sm:h-18 md:h-20 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-8 sm:px-10 text-base sm:text-xl font-black tracking-wider text-zinc-700 uppercase shadow-lg transition active:scale-95 hover:border-pink-400 hover:text-pink-600 disabled:opacity-50 touch-manipulation cursor-pointer"
          >
            ← Back
          </button>

          {isExpired ? (
            <button
              type="button"
              onClick={handleOpenQr}
              className="inline-flex h-16 sm:h-18 md:h-20 flex-1 items-center justify-center rounded-full bg-pink-500 px-8 text-lg sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 touch-manipulation cursor-pointer"
            >
              สร้าง QR Code ใหม่
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckPayment}
              disabled={isChecking}
              className="inline-flex h-16 sm:h-18 md:h-20 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 sm:px-10 text-lg sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-emerald-500/40 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60 border-2 border-white/20 touch-manipulation cursor-pointer"
            >
              {isChecking ? "กำลังตรวจสอบยอดเงิน..." : "สแกนจ่ายแล้ว • Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
