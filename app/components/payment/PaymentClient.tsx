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
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border-2 border-emerald-300 bg-white p-6 sm:p-8 text-center shadow-xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-50 text-4xl font-black text-emerald-500 shadow-md">
          👑
        </div>
        <div className="flex flex-col gap-2">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-black text-emerald-700">
            เบอร์: {memberData.phone}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-600">
            สิทธิ์ของคุณพร้อมใช้งาน! 🎉
          </h2>
          <p className="text-sm sm:text-base font-bold text-zinc-700">
            ตรวจพบ 10 แต้มสะสม • รับสิทธิ์ถ่ายฟรีรอบนี้ 1 ครั้ง โดยไม่ต้องชำระเงิน
          </p>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs font-bold text-emerald-800">
            🛡️ ระบบจะตัด 10 แต้มเมื่อขั้นตอนสั่งพิมพ์รูปสำเร็จเท่านั้น หากมีเหตุขัดข้องแต้มจะไม่หาย
          </div>
          <p className="font-mono text-xs font-bold text-zinc-500">
            แต้มสะสมปัจจุบัน: {memberData.points}/10 แต้ม
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/setup")}
          className="inline-flex h-13 sm:h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-lg font-black text-white uppercase shadow-xl shadow-emerald-500/30 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 border-2 border-white/20 touch-manipulation cursor-pointer"
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
      <div className="flex w-full flex-col items-center gap-3">
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
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-5 py-2 text-center text-sm font-black text-rose-600 shadow-sm">
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
      <div className="flex w-full flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-400 bg-emerald-50 px-5 py-1.5 text-xs sm:text-sm font-black text-emerald-700 shadow-sm">
          <span>✓</span>
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
      <div className="flex w-full max-w-xl flex-col items-center gap-4 sm:gap-5">
        <div className="flex w-full flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <p className="font-mono text-xs font-black tracking-widest text-pink-500 uppercase">
                Studio Booth Package
              </p>
              <h2 className="mt-0.5 text-2xl font-black text-zinc-900 sm:text-3xl">
                สรุปรายการชำระเงิน
              </h2>
            </div>
            <span className="rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1 font-mono text-xs font-black text-pink-600 uppercase">
              PromptPay
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <div className="flex items-center justify-between text-base sm:text-lg font-bold text-zinc-800">
              <span>ถ่ายภาพ Photobooth + ปริ้นต์ + QR โหลดภาพ &amp; GIF</span>
              <span className="font-mono font-black text-zinc-900 text-lg sm:text-xl">
                ฿{SESSION_PRICE}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-600">
              <span>เลือกได้ 1–4 รูป (แนวตั้ง / แนวนอน) + สติกเกอร์</span>
              <span className="font-mono font-bold">1 รอบ</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-zinc-200 pt-3">
              <span className="text-lg sm:text-xl font-black text-zinc-900">
                รวมยอดทั้งหมด
              </span>
              <span className="font-mono text-4xl sm:text-5xl font-black text-pink-500">
                ฿{SESSION_PRICE}
              </span>
            </div>
          </div>

          {/* แถบกดใช้สิทธิ์ถ่ายฟรีสำหรับลูกค้าสมาชิกที่สะสมครบ 10 แต้ม */}
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-pink-300 bg-pink-50/60 p-3 sm:p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-base font-black text-white shadow">
                🎁
              </span>
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-black text-zinc-900">
                  สะสมครบ 10 แต้มแล้ว?
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-600 font-semibold">
                  แตะเพื่อแลกสิทธิ์ถ่ายฟรีรอบนี้ทันที
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
              className="inline-flex h-10 items-center justify-center rounded-full bg-pink-500 px-4 text-xs sm:text-sm font-black text-white shadow-sm transition active:scale-95 hover:bg-pink-400 touch-manipulation cursor-pointer"
            >
              ใช้สิทธิ์แลกฟรี ✨
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-13 sm:h-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-7 sm:px-9 text-base sm:text-lg font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 touch-manipulation cursor-pointer"
          >
            ← Back
          </Link>

          <button
            type="button"
            onClick={handleOpenQr}
            className="inline-flex h-13 sm:h-14 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 text-lg sm:text-xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/20 touch-manipulation cursor-pointer"
          >
            ชำระเงิน ฿{SESSION_PRICE} →
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
    <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-5 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xl sm:flex-row sm:gap-8">
      {/* ฝั่ง QR Code พร้อมเพย์ */}
      <div className="flex shrink-0 flex-col items-center gap-2.5 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 text-zinc-900 shadow-sm">
        <div className="flex w-full items-center justify-between border-b border-zinc-200 pb-2">
          <span className="text-xs sm:text-sm font-black tracking-wider text-pink-600 uppercase">
            Thai QR PromptPay
          </span>
          <span className="font-mono text-base font-black text-zinc-900">
            ฿{SESSION_PRICE}.00
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROMPTPAY_QR_SRC}
          alt="PromptPay QR Code"
          className="h-44 w-44 sm:h-52 sm:w-52 rounded-xl object-contain shadow-inner bg-white p-1"
        />

        <p className="font-mono text-xs font-bold text-zinc-600">
          สแกนจ่ายผ่านแอปธนาคารใดก็ได้
        </p>
      </div>

      {/* ฝั่งสถานะ เวลาที่เหลือ และปุ่มตรวจสอบยอดชำระ */}
      <div className="flex w-full flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
        <div className="w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-5">
          <p className="font-mono text-xs font-black tracking-wider text-zinc-500 uppercase">
            รวมยอดชำระทั้งหมด
          </p>
          <p className="mt-1 font-mono text-4xl sm:text-5xl font-black text-pink-500">
            ฿{SESSION_PRICE}.00
          </p>

          <div className="mt-3 flex items-center justify-center gap-2.5 sm:justify-start">
            <span
              className={`h-3.5 w-3.5 rounded-full ${
                isExpired
                  ? "bg-rose-500"
                  : isChecking
                  ? "animate-ping bg-amber-400"
                  : "animate-pulse bg-pink-500"
              }`}
            />
            <span className="font-mono text-sm font-bold text-zinc-700">
              {isExpired
                ? "QR Code หมดอายุ กรุณาสร้างใหม่"
                : statusMessage ?? "รอสแกนชำระเงิน • เหลือเวลา "}
              {!isExpired && !statusMessage ? (
                <span className="text-pink-600 font-black">{formatTime(secondsLeft)}</span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setStep("summary")}
            disabled={isChecking}
            className="inline-flex h-13 sm:h-14 items-center justify-center rounded-full border-2 border-zinc-300 bg-white px-6 sm:px-8 text-base font-black tracking-wider text-zinc-700 uppercase shadow-md transition active:scale-95 hover:border-pink-400 hover:text-pink-600 disabled:opacity-50 touch-manipulation cursor-pointer"
          >
            ← Back
          </button>

          {isExpired ? (
            <button
              type="button"
              onClick={handleOpenQr}
              className="inline-flex h-13 sm:h-14 flex-1 items-center justify-center rounded-full bg-pink-500 px-6 text-base sm:text-lg font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 touch-manipulation cursor-pointer"
            >
              สร้าง QR Code ใหม่
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckPayment}
              disabled={isChecking}
              className="inline-flex h-13 sm:h-14 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 sm:px-8 text-base sm:text-lg font-black tracking-wider text-white uppercase shadow-xl shadow-emerald-500/30 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60 border-2 border-white/20 touch-manipulation cursor-pointer"
            >
              {isChecking ? "กำลังตรวจสอบยอดเงิน..." : "สแกนจ่ายแล้ว • Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
