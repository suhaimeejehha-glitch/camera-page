import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KioskGuard } from "@/app/components/ui/KioskGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STUDIO BOOTH",
  description: "Dark Studio Touchscreen Photobooth",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col select-none overflow-x-hidden">
        <KioskGuard>{children}</KioskGuard>
      </body>
    </html>
  );
}
