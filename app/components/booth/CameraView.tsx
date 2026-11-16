"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isMirrored?: boolean;
  isFlashing?: boolean;
  fullScreen?: boolean;
  onCameraStateChange?: (ready: boolean) => void;
  children?: ReactNode;
}

/**
 * Component เปิดกล้องโน้ตบุ๊ก / Webcam ผ่าน navigator.mediaDevices.getUserMedia
 */
export function CameraView({
  videoRef,
  isMirrored = false,
  isFlashing = false,
  fullScreen = false,
  onCameraStateChange,
  children,
}: CameraViewProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    async function startCamera() {
      setIsLoading(true);
      setErrorMessage(null);
      onCameraStateChange?.(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง");
        setIsLoading(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        onCameraStateChange?.(true);
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof DOMException && err.name === "NotAllowedError"
              ? "กรุณากดอนุญาต (Allow) ให้เว็บเข้าถึงกล้องของเครื่อง"
              : "ไม่พบกล้องหรือกล้องกำลังถูกใช้งานโดยโปรแกรมอื่น";
          setErrorMessage(message);
          onCameraStateChange?.(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      onCameraStateChange?.(false);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [retryCount, videoRef, onCameraStateChange]);

  return (
    <div
      className={
        fullScreen
          ? "relative h-full w-full overflow-hidden bg-black text-white"
          : "relative mx-auto aspect-[4/3] overflow-hidden rounded-2xl border-2 border-zinc-700 bg-black text-white shadow-2xl landscape:h-[min(50dvh,440px)] landscape:w-auto portrait:h-[min(34dvh,480px)] portrait:w-auto portrait:max-w-[90vw]"
      }
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover transition-transform ${
          isMirrored ? "-scale-x-100" : ""
        }`}
      />

      {isLoading && !errorMessage ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-6 text-center">
          <span className="text-3xl">📷</span>
          <p className="text-sm font-medium text-white/90">
            กำลังเปิดกล้องโน้ตบุ๊ก...
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
          <p className="max-w-sm text-sm font-medium text-rose-200">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="min-h-12 rounded-2xl border-2 border-white bg-white/15 px-6 text-sm font-bold text-white transition active:scale-95"
          >
            ลองเปิดกล้องอีกครั้ง
          </button>
        </div>
      ) : null}

      {isFlashing ? (
        <div className="pointer-events-none absolute inset-0 bg-white/85" />
      ) : null}

      {children}
    </div>
  );
}
