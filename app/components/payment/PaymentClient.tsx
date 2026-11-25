// ไฟล์: app/components/payment/PaymentClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TouchNumpad, formatPhoneNumber } from "./TouchNumpad";
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
  const [pointsAlert, setPointsAlert] = useState<{
    title: string;
    message: string;
    digitsCount: number;
  } | null>(null);
  const [redeemAlert, setRedeemAlert] = useState<{
    title: string;
    message: string;
    points?: number | null;
  } | null>(null);
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
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length < 10) {
      setPointsAlert({
        title: "กรอกเบอร์ยังไม่ครบ 10 ตัว",
        message:
          clean.length === 0
            ? "คุณยังไม่ได้กดเบอร์โทรศัพท์ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 ตัวเพื่อสะสมแต้มครับ"
            : `คุณกรอกเบอร์โทรศัพท์ไปเพียง ${clean.length}/10 ตัว กรุณากรอกให้ครบ 10 ตัวก่อนกดยืนยันครับ`,
        digitsCount: clean.length,
      });
      return;
    }
    if (isSubmittingPoints) return;
    setIsSubmittingPoints(true);
    setPointsAlert(null);
    try {
      const result = await addMemberPoint(clean);
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
    const clean = redeemPhoneInput.replace(/\D/g, "");
    if (clean.length < 10) {
      setRedeemAlert({
        title: "กรอกเบอร์ยังไม่ครบ 10 หลัก",
        message: `คุณกรอกเบอร์โทรศัพท์ไปเพียง ${clean.length}/10 หลัก กรุณากรอกให้ครบ 10 หลักก่อนกดแลกสิทธิ์ครับ`,
        points: null,
      });
      return;
    }
    if (isSubmittingPoints) return;
    setIsSubmittingPoints(true);
    setRedeemAlert(null);
    try {
      const member = await getMemberPoints(clean);
      if (member.points >= 10) {
        // บันทึกเบอร์ที่ขอใช้สิทธิ์ไว้ใน sessionStorage (จะหักแต้มจริงเมื่อถึงขั้นตอนสั่งพิมพ์)
        try {
          sessionStorage.setItem("photobooth_pending_redeem", clean);
        } catch {}
        setMemberData(member);
        setStep("redeem_success");
      } else {
        setRedeemAlert({
          title: "แต้มสะสมยังไม่ครบ 10 แต้ม",
          message: `เบอร์ ${formatPhoneNumber(clean)} มีแต้มสะสมปัจจุบัน ${member.points}/10 แต้ม (ต้องสะสมครบ 10 แต้มเพื่อแลกสิทธิ์ถ่ายฟรี 1 ครั้ง)`,
          points: member.points,
        });
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
      <div className="relative flex w-full flex-col items-center justify-center my-auto">
        <TouchNumpad
          value={redeemPhoneInput}
          onChange={(val) => {
            setRedeemPhoneInput(val);
            if (redeemAlert) setRedeemAlert(null);
          }}
          onSubmit={handleRedeemCheck}
          onCancel={() => {
            setRedeemAlert(null);
            setStep("summary");
          }}
          title="🎁 แลกสิทธิ์ถ่ายฟรี 1 ครั้ง"
          subtitle="กรอกเบอร์โทรศัพท์ที่สะสมแต้มครบ 10 ครั้ง เพื่อแลกถ่ายฟรีรอบนี้"
          submitLabel="แลกสิทธิ์ถ่ายฟรีทันที ✨"
          cancelLabel="← กลับไปหน้าชำระเงินปกติ"
          submitColor="emerald"
          isLoading={isSubmittingPoints}
          onIncomplete={() => {
            const clean = redeemPhoneInput.replace(/\D/g, "");
            setRedeemAlert({
              title: "กรอกเบอร์ยังไม่ครบ 10 หลัก",
              message: `คุณกรอกเบอร์โทรศัพท์ไปเพียง ${clean.length}/10 หลัก กรุณากรอกให้ครบ 10 หลักก่อนกดแลกสิทธิ์ครับ`,
              points: null,
            });
          }}
        />

        {/* Modal Popup แจ้งเตือนเมื่อกรอกเบอร์ไม่ครบ หรือ แต้มสะสมยังไม่ครบ 10 แต้ม */}
        {redeemAlert ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none">
            <div className="flex w-full max-w-md sm:max-w-lg flex-col items-center gap-5 rounded-[32px] border-2 border-rose-200 bg-white p-7 sm:p-9 text-center shadow-2xl">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-rose-200 bg-rose-50 text-4xl shadow-sm">
                ⚠️
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                  {redeemAlert.title}
                </h3>
                <p className="text-base sm:text-lg font-bold text-zinc-600 leading-relaxed">
                  {redeemAlert.message}
                </p>
                {redeemAlert.points !== null && redeemAlert.points !== undefined ? (
                  <div className="mt-2 inline-flex items-center justify-center gap-2 self-center rounded-full bg-rose-50 px-5 py-2 font-mono text-base font-black text-rose-600 border border-rose-200">
                    แต้มสะสม: {redeemAlert.points}/10 แต้ม
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setRedeemAlert(null)}
                className="inline-flex h-15 sm:h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-8 text-xl font-black text-white shadow-lg shadow-red-700/30 transition active:scale-95 hover:from-red-600 hover:to-amber-500 cursor-pointer touch-manipulation border border-amber-300/40"
              >
                ตกลง / ลองเบอร์อื่น
              </button>
            </div>
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
      <div className="relative flex w-full flex-col items-center gap-3.5 my-auto">
        <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-emerald-400 bg-emerald-50 px-6 py-2 text-sm sm:text-base font-black text-emerald-700 shadow-sm">
          <span className="text-lg">✓</span>
          <span>ชำระเงินสำเร็จ ฿{SESSION_PRICE}.00 เรียบร้อยแล้ว</span>
        </div>

        <TouchNumpad
          value={phoneInput}
          onChange={(val) => {
            setPhoneInput(val);
            if (pointsAlert) setPointsAlert(null);
          }}
          onSubmit={handleEarnPoints}
          onCancel={handleSkipPoints}
          title="🎁 สะสมแต้มรับสิทธิ์ถ่ายฟรี"
          subtitle="กดเบอร์โทรศัพท์เพื่อรับ 1 แต้ม (สะสมครบ 10 ครั้ง แลกถ่ายฟรี 1 ครั้ง!)"
          submitLabel="สะสมแต้มรับ 1 ดวง ✨"
          cancelLabel="ข้ามไปหน้าเลือกกรอบรูปเลย (ไม่สะสมแต้ม) →"
          submitColor="pink"
          isLoading={isSubmittingPoints}
          onIncomplete={() => {
            const clean = phoneInput.replace(/\D/g, "");
            setPointsAlert({
              title: "กรอกเบอร์ยังไม่ครบ 10 ตัว",
              message:
                clean.length === 0
                  ? "คุณยังไม่ได้กดเบอร์โทรศัพท์ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 ตัวเพื่อสะสมแต้มครับ"
                  : `คุณกรอกเบอร์โทรศัพท์ไปเพียง ${clean.length}/10 ตัว กรุณากรอกให้ครบ 10 ตัวก่อนกดยืนยันครับ`,
              digitsCount: clean.length,
            });
          }}
        />

        {/* Modal Popup แจ้งเตือนเมื่อกรอกเบอร์ไม่ครบ 10 ตัวในขั้นตอนสะสมแต้ม */}
        {pointsAlert ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm select-none animate-in fade-in duration-200">
            <div className="flex w-full max-w-md sm:max-w-lg flex-col items-center gap-5 rounded-[32px] border-2 border-amber-300 bg-white p-7 sm:p-9 text-center shadow-2xl animate-shake">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-amber-200 bg-amber-50 text-4xl shadow-sm">
                ⚠️
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {pointsAlert.title}
                </h3>
                <p className="text-base sm:text-lg font-bold text-stone-600 leading-relaxed">
                  {pointsAlert.message}
                </p>
                <div className="mt-2 inline-flex items-center justify-center gap-2 self-center rounded-full bg-amber-50 px-5 py-2 font-mono text-base font-black text-amber-900 border border-amber-200">
                  เบอร์ปัจจุบัน: {phoneInput ? formatPhoneNumber(phoneInput) : "ยังไม่ได้กรอก"} ({pointsAlert.digitsCount}/10 ตัว)
                </div>
              </div>
              <div className="flex flex-col w-full gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPointsAlert(null)}
                  className="inline-flex h-15 sm:h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-8 text-xl font-black text-white shadow-lg shadow-red-700/30 transition active:scale-95 hover:from-red-600 hover:to-amber-500 cursor-pointer touch-manipulation border border-amber-300/40"
                >
                  ตกลง (กรอกเบอร์ต่อให้ครบ 10 ตัว)
                </button>
                <button
                  type="button"
                  onClick={handleSkipPoints}
                  className="text-sm sm:text-base font-bold text-stone-500 hover:text-stone-800 transition py-2 text-center touch-manipulation cursor-pointer"
                >
                  ไม่สะสมแต้ม ข้ามไปเลือกกรอบรูปเลย →
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // ==========================================
  // STEP: สรุปรายการชำระเงิน (Summary)
  // ดีไซน์การ์ดเดี่ยวขนาดใหญ่พิเศษสำหรับจอทัชสกรีน 15.6"
  // ตัวอักษรใหญ่ ปุ่มใหญ่พิเศษ สัมผัสง่าย ไม่ต้องเลื่อนจอ
  // ==========================================
  if (step === "summary") {
    return (
      <div className="flex w-full max-w-2xl lg:max-w-3xl flex-col gap-4 sm:gap-6 rounded-[28px] sm:rounded-[36px] border-2 border-red-200/80 bg-[#fffdfa] p-5 sm:p-9 lg:p-10 shadow-[0_20px_70px_-15px_rgba(185,28,28,0.14)] my-auto select-none">
        {/* ส่วนหัวการ์ด */}
        <div className="flex items-center justify-between border-b-2 border-amber-900/10 pb-4 sm:pb-5">
          <div>
            <p className="font-mono text-xs sm:text-sm lg:text-base font-black tracking-widest text-red-700 uppercase">
              Vintage Photo Booth // Checkout
            </p>
            <h2 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
              สรุปรายการชำระเงิน
            </h2>
          </div>
          <span className="rounded-full border-2 border-amber-400 bg-amber-50 px-5 py-2 font-mono text-xs sm:text-sm lg:text-base font-black text-amber-900 uppercase shadow-xs">
            PromptPay
          </span>
        </div>

        {/* รายละเอียดแพ็กเกจ (ตัวอักษรใหญ่ ชัดเจน อ่านง่ายมาก) */}
        <div className="flex flex-col gap-3.5 sm:gap-4 rounded-3xl bg-[#faf6f0] p-5 sm:p-6 lg:p-7 border-2 border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900">
              📸 ถ่ายภาพ Vintage Photobooth
            </span>
            <span className="font-mono text-2xl sm:text-3xl lg:text-4xl font-black text-red-700">
              ฿{SESSION_PRICE}
            </span>
          </div>

          {/* รายการจุดเด่นแบบ Bullet ตัวใหญ่ ชัดเจน */}
          <div className="flex flex-col gap-2 text-sm sm:text-base lg:text-lg font-bold text-stone-700 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="text-red-700 font-black text-base sm:text-lg lg:text-xl">✓</span>
              <span>เลือกถ่ายได้ 1–4 แอ็กชัน (แนวตั้ง หรือ แนวนอน)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-red-700 font-black text-base sm:text-lg lg:text-xl">✓</span>
              <span>พิมพ์ภาพคู่ 2 แถบ (Dual Strip ขนาด 4x6 นิ้ว)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-red-700 font-black text-base sm:text-lg lg:text-xl">✓</span>
              <span>สแกน QR รับไฟล์ภาพต้นฉบับและวิดีโอ 8 วิ (MP4) ได้ทันที</span>
            </div>
          </div>

          {/* ยอดชำระรวม ตัวเลขใหญ่สะดุดตา */}
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-amber-900/15 pt-3 sm:pt-4">
            <span className="text-lg sm:text-xl lg:text-2xl font-black text-stone-800">
              รวมยอดชำระทั้งหมด
            </span>
            <span className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-red-700 drop-shadow-xs">
              ฿{SESSION_PRICE}.00
            </span>
          </div>
        </div>

        {/* แถบกดใช้สิทธิ์ถ่ายฟรีสำหรับลูกค้าสมาชิกที่สะสมครบ 10 แต้ม */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-amber-400 bg-amber-50/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3.5 text-left">
            <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-red-700 border border-amber-400/50 text-2xl sm:text-3xl font-black text-amber-300 shadow-md shadow-red-700/25">
              🎁
            </span>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-black text-stone-900">
                สะสมครบ 10 แต้มแล้ว?
              </span>
              <span className="text-xs sm:text-sm text-stone-600 font-semibold">
                กดเพื่อตรวจและใช้สิทธิ์ถ่ายฟรีรอบนี้
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRedeemPhoneInput("");
              setRedeemAlert(null);
              setStep("redeem_numpad");
            }}
            className="inline-flex h-11 sm:h-13 shrink-0 items-center justify-center rounded-full bg-red-700 px-5 sm:px-7 text-xs sm:text-sm lg:text-base font-black text-amber-100 shadow-md shadow-red-700/30 transition active:scale-95 hover:bg-red-800 border border-amber-300/40 touch-manipulation cursor-pointer"
          >
            ใช้สิทธิ์แลกฟรี ✨
          </button>
        </div>

        {/* ปุ่ม Back และ ปุ่มชำระเงิน ขนาดใหญ่พิเศษสำหรับนิ้วสัมผัสทัชสกรีน */}
        <div className="flex w-full items-center gap-4 sm:gap-5 pt-1 sm:pt-2">
          <Link
            href="/"
            className="inline-flex h-16 sm:h-18 lg:h-20 w-36 sm:w-44 lg:w-48 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-stone-300 bg-white text-lg sm:text-xl lg:text-2xl font-black tracking-wider text-stone-700 uppercase shadow-xs transition active:scale-95 hover:border-red-600 hover:text-red-700 hover:bg-white touch-manipulation cursor-pointer"
          >
            ← Back
          </Link>

          <button
            type="button"
            onClick={handleOpenQr}
            className="inline-flex h-16 sm:h-18 lg:h-20 flex-1 items-center justify-center gap-3 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 px-8 text-xl sm:text-2xl lg:text-3xl font-black tracking-wider text-white uppercase shadow-xl shadow-red-700/35 transition active:scale-95 hover:from-red-600 hover:to-amber-500 border-2 border-amber-300/50 touch-manipulation cursor-pointer"
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
  // ดีไซน์แนวตั้ง (Vertical Card) สไตล์เดียวกับหน้าสรุปรายการ
  // ตัวอักษรใหญ่ รูป QR ใหญ่ คมชัด ปุ่มใหญ่พอดีจอทัชสกรีน 15.6"
  // ==========================================
  const isExpired = secondsLeft === 0;

  return (
    <div className="flex w-full max-w-xl sm:max-w-2xl flex-col items-center gap-3.5 sm:gap-5 rounded-[28px] sm:rounded-[36px] border-2 border-red-200/80 bg-[#fffdfa] p-5 sm:p-7 lg:p-8 shadow-[0_20px_70px_-15px_rgba(185,28,28,0.14)] my-auto select-none">
      {/* ส่วนหัวการ์ด (แนวตั้ง) */}
      <div className="flex w-full items-center justify-between border-b-2 border-amber-900/10 pb-3 sm:pb-4">
        <div>
          <p className="font-mono text-xs sm:text-sm font-black tracking-widest text-red-700 uppercase">
            Thai QR PromptPay
          </p>
          <h2 className="mt-0.5 text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
            สแกน QR เพื่อชำระเงิน
          </h2>
        </div>
        <span className="rounded-full border-2 border-amber-400 bg-amber-50 px-4 py-1.5 font-mono text-xs sm:text-sm lg:text-base font-black text-amber-900 uppercase shadow-xs">
          ฿{SESSION_PRICE}.00
        </span>
      </div>

      {/* รูปภาพ QR Code ขนาดยักษ์ คมชัดตรงกลาง สแกนง่ายจากระยะยืน */}
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl sm:rounded-3xl border-2 border-stone-200 bg-[#faf6f0] p-3.5 sm:p-4 text-center shadow-inner w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PROMPTPAY_QR_SRC}
          alt="PromptPay QR Code"
          className="h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72 rounded-2xl object-contain shadow-xs bg-white p-2 border-2 border-stone-200"
        />

        <p className="font-mono text-xs sm:text-sm font-bold text-stone-600 pt-0.5">
          สแกนจ่ายผ่านแอปธนาคารใดก็ได้
        </p>
      </div>

      {/* แถบสรุปยอดชำระ และเวลานับถอยหลัง */}
      <div className="flex w-full items-center justify-between rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-3.5 sm:p-4">
        <div className="flex flex-col text-left">
          <span className="text-xs sm:text-sm font-bold text-stone-500 uppercase">
            รวมยอดชำระทั้งหมด
          </span>
          <span className="font-mono text-3xl sm:text-4xl font-black text-red-700">
            ฿{SESSION_PRICE}.00
          </span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-stone-200 shadow-xs">
          <span
            className={`h-3 w-3 rounded-full ${
              isExpired
                ? "bg-rose-500"
                : isChecking
                ? "animate-ping bg-amber-400"
                : "animate-pulse bg-red-600"
            }`}
          />
          <span className="font-mono text-xs sm:text-sm font-bold text-stone-700">
            {isExpired
              ? "QR Code หมดอายุ"
              : statusMessage ?? "เหลือเวลา "}
            {!isExpired && !statusMessage ? (
              <span className="text-red-700 font-black">{formatTime(secondsLeft)}</span>
            ) : null}
          </span>
        </div>
      </div>

      {/* ปุ่ม Back และ ปุ่มยืนยันขนาดใหญ่พิเศษสำหรับจอทัชสกรีน */}
      <div className="flex w-full items-center gap-3 sm:gap-4 pt-1">
        <button
          type="button"
          onClick={() => setStep("summary")}
          disabled={isChecking}
          className="inline-flex h-15 sm:h-17 w-32 sm:w-40 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-stone-300 bg-white text-base sm:text-lg font-black tracking-wider text-stone-700 uppercase shadow-xs transition active:scale-95 hover:border-red-600 hover:text-red-700 hover:bg-white disabled:opacity-50 touch-manipulation cursor-pointer"
        >
          ← Back
        </button>

        {isExpired ? (
          <button
            type="button"
            onClick={handleOpenQr}
            className="inline-flex h-15 sm:h-17 flex-1 items-center justify-center rounded-2xl sm:rounded-3xl bg-red-700 px-6 text-lg sm:text-xl font-black tracking-wider text-white uppercase shadow-xl shadow-red-700/30 transition active:scale-95 hover:bg-red-800 touch-manipulation cursor-pointer border border-amber-300/40"
          >
            สร้าง QR Code ใหม่
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheckPayment}
            disabled={isChecking}
            className="inline-flex h-15 sm:h-17 flex-1 items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 px-6 text-lg sm:text-xl lg:text-2xl font-black tracking-wider text-white uppercase shadow-xl shadow-emerald-600/35 transition active:scale-95 hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60 border border-white/20 touch-manipulation cursor-pointer whitespace-nowrap"
          >
            <span>{isChecking ? "กำลังตรวจสอบ..." : "สแกนจ่ายแล้ว • Next"}</span>
            <span className="text-xl sm:text-2xl">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
