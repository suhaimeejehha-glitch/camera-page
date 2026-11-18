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
  // ดีไซน์ 2 คอลัมน์สำหรับจอสัมผัส Kiosk 16:9
  // ตัวอักษรใหญ่ ปุ่มใหญ่มาก ไม่ต้องเลื่อนจอ (No Scroll)
  // ==========================================
  if (step === "summary") {
    return (
      <div className="grid w-full max-w-4xl lg:max-w-5xl grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 my-auto items-stretch select-none">
        {/* ฝั่งซ้าย: ข้อมูลแพ็กเกจ & สิ่งที่จะได้รับ */}
        <div className="flex flex-col justify-between gap-4 rounded-[28px] sm:rounded-[32px] border-2 border-zinc-200/90 bg-white p-5 sm:p-6 lg:p-7 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <p className="font-mono text-xs sm:text-sm font-black tracking-widest text-pink-500 uppercase">
                  Studio Booth // Package
                </p>
                <h2 className="mt-0.5 text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  ถ่ายภาพ Photobooth
                </h2>
              </div>
              <span className="rounded-full bg-pink-50 px-3.5 py-1 text-xs sm:text-sm font-black text-pink-600 border border-pink-200">
                1 รอบ
              </span>
            </div>

            {/* รายการสิ่งที่ได้รับ: ตัวอักษรใหญ่ ชัดเจน อ่านง่ายมาก */}
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3 sm:p-3.5 border border-zinc-200/70">
                <span className="text-2xl shrink-0">📸</span>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black text-zinc-900">
                    เลือกถ่ายได้ 1–4 แอ็กชัน
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-500">
                    เลือกสไตล์เฟรมแนวตั้ง หรือ แนวนอนได้ตามใจชอบ
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3 sm:p-3.5 border border-zinc-200/70">
                <span className="text-2xl shrink-0">🖨️</span>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black text-zinc-900">
                    พิมพ์ภาพคู่ 2 แถบ (Dual Strip)
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-500">
                    ขนาด 4x6 นิ้ว พร้อมแบ่งกับเพื่อนได้ทันที
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-3 sm:p-3.5 border border-zinc-200/70">
                <span className="text-2xl shrink-0">📱</span>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black text-zinc-900">
                    สแกน QR รับไฟล์รูป & วิดีโอ GIF
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-500">
                    ดาวน์โหลดเข้าสมาร์ตโฟนได้ทันที
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* แถบแลกแต้มถ่ายฟรี */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/70 p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-zinc-900">
                  สะสมครบ 10 แต้มแล้ว?
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-500 font-semibold">
                  ตรวจและใช้สิทธิ์ถ่ายฟรี
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
              className="inline-flex h-9 sm:h-10 shrink-0 items-center justify-center rounded-full bg-pink-500 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-pink-500/25 transition active:scale-95 hover:bg-pink-600 cursor-pointer touch-manipulation"
            >
              แลกสิทธิ์ ✨
            </button>
          </div>
        </div>

        {/* ฝั่งขวา: ยอดชำระ & ปุ่มแตะชำระเงินขนาดยักษ์สำหรับทัชสกรีน */}
        <div className="flex flex-col justify-between gap-4 rounded-[28px] sm:rounded-[32px] border-2 border-pink-200 bg-white p-5 sm:p-6 lg:p-7 shadow-xl shadow-pink-500/10">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-zinc-500 uppercase">
                Payment Summary
              </span>
              <span className="rounded-full border-2 border-pink-200 bg-pink-50 px-3.5 py-1 font-mono text-xs sm:text-sm font-black text-pink-600 uppercase">
                PromptPay
              </span>
            </div>

            {/* กล่องแสดงราคายักษ์ โดดเด่น ชัดเจน มองเห็นง่ายมาก */}
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-pink-100 bg-gradient-to-b from-pink-50/60 to-white p-5 sm:p-6 text-center">
              <span className="text-sm sm:text-base font-bold text-zinc-600">
                รวมยอดชำระทั้งหมด
              </span>
              <span className="mt-1 font-mono text-5xl sm:text-6xl lg:text-7xl font-black text-pink-500 tracking-tight">
                ฿{SESSION_PRICE}
              </span>
              <span className="mt-2 text-xs sm:text-sm font-bold text-zinc-500">
                สแกนจ่ายผ่าน QR Code ทุกธนาคาร
              </span>
            </div>
          </div>

          {/* ปุ่ม Action ขนาดใหญ่พิเศษสำหรับนิ้วทัชสกรีน */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenQr}
              className="inline-flex h-16 sm:h-18 lg:h-20 w-full items-center justify-center gap-3 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 px-8 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/35 transition active:scale-95 hover:from-pink-400 hover:to-rose-400 border-2 border-white/30 cursor-pointer touch-manipulation"
            >
              <span>ชำระเงิน ฿{SESSION_PRICE}</span>
              <span className="text-2xl sm:text-3xl">→</span>
            </button>

            <Link
              href="/"
              className="inline-flex h-12 sm:h-13 w-full items-center justify-center rounded-2xl border-2 border-zinc-200 bg-zinc-50 text-base sm:text-lg font-black tracking-wider text-zinc-600 uppercase transition active:scale-95 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer touch-manipulation"
            >
              ← ย้อนกลับไปหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP: หน้าสแกน QR Code PromptPay (QR Step)
  // ดีไซน์ 2 คอลัมน์สำหรับจอสัมผัส Kiosk 16:9
  // ==========================================
  const isExpired = secondsLeft === 0;

  return (
    <div className="grid w-full max-w-4xl lg:max-w-5xl grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 my-auto items-stretch select-none">
      {/* ฝั่งซ้าย: รูป QR พร้อมเพย์ขนาดใหญ่ */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] sm:rounded-[32px] border-2 border-zinc-200 bg-white p-5 sm:p-6 lg:p-7 shadow-xl">
        <div className="flex w-full items-center justify-between border-b border-zinc-100 pb-2">
          <span className="text-xs sm:text-sm font-black tracking-wider text-pink-600 uppercase">
            Thai QR PromptPay
          </span>
          <span className="font-mono text-base sm:text-lg font-black text-zinc-900">
            ฿{SESSION_PRICE}.00
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROMPTPAY_QR_SRC}
          alt="PromptPay QR Code"
          className="h-52 w-52 sm:h-56 sm:w-56 lg:h-60 lg:w-60 rounded-2xl object-contain border-2 border-zinc-100 bg-white p-2 shadow-inner"
        />

        <p className="font-mono text-xs sm:text-sm font-bold text-zinc-500">
          เปิดแอปธนาคารใดก็ได้ แล้วสแกนเพื่อจ่ายเงิน
        </p>
      </div>

      {/* ฝั่งขวา: สถานะ นับถอยหลัง และปุ่มทัชสกรีนขนาดใหญ่ */}
      <div className="flex flex-col justify-between gap-4 rounded-[28px] sm:rounded-[32px] border-2 border-pink-200 bg-white p-5 sm:p-6 lg:p-7 shadow-xl shadow-pink-500/10">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-zinc-500 uppercase">
              Payment Status
            </span>
            <span className="rounded-full bg-pink-50 px-3.5 py-1 font-mono text-xs sm:text-sm font-black text-pink-600">
              รอการชำระ
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-pink-100 bg-gradient-to-b from-pink-50/60 to-white p-5 sm:p-6 text-center">
            <span className="text-sm sm:text-base font-bold text-zinc-600">
              ยอดที่ต้องชำระ
            </span>
            <span className="mt-1 font-mono text-5xl sm:text-6xl font-black text-pink-500">
              ฿{SESSION_PRICE}.00
            </span>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 border border-zinc-200 shadow-xs">
              <span
                className={`h-3 w-3 rounded-full ${
                  isExpired
                    ? "bg-rose-500"
                    : isChecking
                    ? "animate-ping bg-amber-400"
                    : "animate-pulse bg-pink-500"
                }`}
              />
              <span className="font-mono text-xs sm:text-sm font-bold text-zinc-700">
                {isExpired
                  ? "QR หมดอายุ กรุณาสร้างใหม่"
                  : statusMessage ?? "เวลาที่เหลือ "}
                {!isExpired && !statusMessage ? (
                  <span className="text-pink-600 font-black">{formatTime(secondsLeft)}</span>
                ) : null}
              </span>
            </div>
          </div>
        </div>

        {/* ปุ่มทัชสกรีนขนาดใหญ่ */}
        <div className="flex flex-col gap-3 pt-2">
          {isExpired ? (
            <button
              type="button"
              onClick={handleOpenQr}
              className="inline-flex h-16 sm:h-18 lg:h-20 w-full items-center justify-center rounded-2xl sm:rounded-3xl bg-pink-500 px-8 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-pink-500/30 transition active:scale-95 hover:bg-pink-400 cursor-pointer touch-manipulation"
            >
              สร้าง QR Code ใหม่
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCheckPayment}
              disabled={isChecking}
              className="inline-flex h-16 sm:h-18 lg:h-20 w-full items-center justify-center gap-2 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-xl sm:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-emerald-500/35 transition active:scale-95 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 cursor-pointer touch-manipulation border-2 border-white/20"
            >
              {isChecking ? "กำลังตรวจสอบยอดเงิน..." : "สแกนจ่ายแล้ว • ไปต่อ →"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setStep("summary")}
            disabled={isChecking}
            className="inline-flex h-12 sm:h-13 w-full items-center justify-center rounded-2xl border-2 border-zinc-200 bg-zinc-50 text-base sm:text-lg font-black tracking-wider text-zinc-600 uppercase transition active:scale-95 hover:bg-zinc-100 cursor-pointer touch-manipulation"
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
