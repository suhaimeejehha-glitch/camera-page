import { BoothHeader } from "@/app/components/ui/BoothHeader";
import { PaymentClient } from "@/app/components/payment/PaymentClient";

export default function PaymentPage() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-x-hidden bg-gradient-to-br from-white via-[#fff5fa] to-white px-4 py-3 text-zinc-900 sm:px-6 sm:py-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pink-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-pink-200/35 blur-3xl" />

      <div className="relative z-10 flex w-full justify-center">
        <BoothHeader
          title="PROMPTPAY PAYMENT"
          theme="light"
          currentStep={1}
        />
      </div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center py-3">
        <PaymentClient />
      </div>
    </main>
  );
}
