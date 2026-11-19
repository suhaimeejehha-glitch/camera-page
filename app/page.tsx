import { WelcomeScreen } from "@/app/components/welcome/WelcomeScreen";

export default function Home() {
  return (
    <main className="flex min-h-dvh md:h-dvh w-full flex-col items-center justify-center overflow-x-hidden overflow-y-auto md:overflow-hidden">
      <WelcomeScreen />
    </main>
  );
}
