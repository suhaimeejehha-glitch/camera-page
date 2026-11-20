// ไฟล์: app/payment/page.tsx
import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { PaymentClient } from "@/app/components/payment/PaymentClient";

export default function PaymentPage() {
  return (
    <main className="relative flex min-h-dvh md:h-dvh md:max-h-dvh w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto md:overflow-hidden bg-gradient-to-br from-white via-sky-50/50 to-slate-50 px-3 py-3 sm:px-6 sm:py-5 text-zinc-900 select-none">
      {/* เอฟเฟกต์แสงไฟเกาหลีพรีเมียม Haru Film / Photoism */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-blue-200/35 blur-3xl" />

      {/* แถบหัวบน: ขั้นตอน Step 1 (ชำระเงิน) */}
      <div className="relative z-10 flex w-full justify-center shrink-0">
        <BoothHeader
          title="PROMPTPAY PAYMENT"
          theme="light"
          currentStep={1}
        />
      </div>

      {/* ส่วนกลาง: การ์ดชำระเงินจัดกึ่งกลางหน้าจอ เลื่อนขึ้นลงได้บนมือถือ */}
      <div className="relative z-10 flex w-full flex-1 items-center justify-center p-1 sm:p-3 my-auto">
        <PaymentClient />
      </div>
    </main>
  );
}
