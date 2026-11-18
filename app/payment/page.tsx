// ไฟล์: app/payment/page.tsx
import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { PaymentClient } from "@/app/components/payment/PaymentClient";

export default function PaymentPage() {
  return (
    <main className="relative flex h-dvh max-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-white via-[#fff5fa] to-white px-4 py-3 sm:px-6 sm:py-5 text-zinc-900 select-none">
      {/* เอฟเฟกต์แสงไฟสตูดิโอแบบนุ่มนวล */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-pink-200/35 blur-3xl" />

      {/* แถบหัวบน: ขั้นตอน Step 1 (ชำระเงิน) */}
      <div className="relative z-10 flex w-full justify-center shrink-0">
        <BoothHeader
          title="PROMPTPAY PAYMENT"
          theme="light"
          currentStep={1}
        />
      </div>

      {/* ส่วนกลาง: การ์ดชำระเงินจัดกึ่งกลางหน้าจอ ไม่ติดขอบบนหรือล่าง */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center p-2 sm:p-3">
        <PaymentClient />
      </div>
    </main>
  );
}
