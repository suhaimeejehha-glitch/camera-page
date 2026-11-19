import type { PhotoShot } from "@/types/photobooth";

export interface MotionVideoOptions {
  durationSeconds?: number;
  orientation?: "vertical" | "horizontal";
  filterCss?: string;
}

export interface MotionVideoResult {
  blob: Blob;
  mimeType: string;
  filename: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Load image failed for video builder"));
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;
  let drawW = width;
  let drawH = height;
  let dx = 0;
  let dy = 0;

  if (imgRatio > boxRatio) {
    drawH = height;
    drawW = height * imgRatio;
    dx = (width - drawW) / 2;
  } else {
    drawW = width;
    drawH = width / imgRatio;
    dy = (height - drawH) / 2;
  }

  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/**
 * ค้นหา MIME Type สำหรับ MediaRecorder โดยให้ความสำคัญกับ MP4 ก่อน
 * เพื่อให้สามารถส่งต่อใน LINE / Messenger แล้วยังเป็นวิดีโอ 8 วินาทีแท้ ไม่กลายเป็นรูปภาพนิ่ง
 */
export function getSupportedVideoMimeType(): { mimeType: string; filename: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "video/mp4", filename: "photo-motion.mp4" };
  }

  const mp4Types = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=h264",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];

  for (const type of mp4Types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return { mimeType: type, filename: "photo-motion.mp4" };
    }
  }

  const webmTypes = [
    "video/webm;codecs=h264",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  for (const type of webmTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      // แม้เบราว์เซอร์จะเข้ารหัสแบบ WebM แต่ตั้งชื่อ .mp4 หรือ .webm ให้เหมาะสม
      return { mimeType: type, filename: "photo-motion.mp4" };
    }
  }

  return { mimeType: "video/mp4", filename: "photo-motion.mp4" };
}

/**
 * สร้างไฟล์วิดีโอความยาวประมาณ 8 วินาทีจาก Motion Frames หรือ Photo Shots
 * - วน Loop ภาพเคลื่อนไหวอย่างสมูท
 * - มีแถบแท็ก STUDIO BOOTH สวยหรูสไตล์เกาหลี
 * - ส่งออกเป็นไฟล์วิดีโอที่เมื่อเซฟลงเครื่องแล้วจะอยู่ในหมวด Videos และส่งต่อเพื่อนใน LINE ไม่กลายเป็นรูปนิ่ง
 */
export async function createMotionVideoBlob(
  motionFrames: string[],
  photos: PhotoShot[],
  options: MotionVideoOptions = {}
): Promise<MotionVideoResult | null> {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }

  try {
    const rawSources =
      motionFrames && motionFrames.length >= 2
        ? motionFrames
        : photos.map((p) => p.dataUrl);

    if (rawSources.length === 0) {
      return null;
    }

    const durationSeconds = options.durationSeconds ?? 8;
    const isVertical = options.orientation !== "horizontal";
    // ขนาดความละเอียดคมชัด เหมาะกับจอมือถือและการแชร์โซเชียล
    const width = isVertical ? 720 : 960;
    const height = isVertical ? 960 : 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return null;

    // โหลดรูปทั้งหมดล่วงหน้า
    const images = await Promise.all(rawSources.map(loadImage));
    if (images.length === 0) return null;

    const { mimeType, filename } = getSupportedVideoMimeType();

    // เริ่ม Stream จาก Canvas ที่ 30 FPS
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps คมชัดระดับ HD
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    return await new Promise<MotionVideoResult | null>((resolve) => {
      let isResolved = false;

      const finish = () => {
        if (isResolved) return;
        isResolved = true;
        try {
          const finalBlob = new Blob(chunks, { type: mimeType.split(";")[0] || "video/mp4" });
          resolve({
            blob: finalBlob,
            mimeType: mimeType.split(";")[0] || "video/mp4",
            filename,
          });
        } catch {
          resolve(null);
        }
      };

      recorder.onstop = finish;
      recorder.onerror = () => {
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      };

      recorder.start();

      const startTime = performance.now();
      const totalMs = durationSeconds * 1000;
      // ความเร็วการสลับภาพโมชัน 160ms ต่อเฟรม เพื่อความลื่นไหลเป็นธรรมชาติ
      const frameDelayMs = 160;

      // วาดเฟรมแรกทันทีก่อนเริ่ม Loop
      const drawFrameAt = (elapsed: number) => {
        const frameIndex = Math.floor(elapsed / frameDelayMs) % images.length;
        const currentImg = images[frameIndex];

        // พื้นหลังสีดำเข้ม
        ctx.fillStyle = "#0c0a10";
        ctx.fillRect(0, 0, width, height);

        // วาดภาพพร้อมฟิลเตอร์สี (ถ้ามี)
        ctx.save();
        if (options.filterCss && options.filterCss !== "none") {
          ctx.filter = options.filterCss;
        }
        drawCover(ctx, currentImg, width, height);
        ctx.restore();

        // ตกแต่งป้ายลายน้ำ STUDIO BOOTH • 8s MOTION สไตล์โมเดิร์น
        ctx.save();
        const badgeText = "STUDIO BOOTH // MOTION";
        ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const textWidth = ctx.measureText(badgeText).width;
        const badgeW = textWidth + 36;
        const badgeH = 34;
        const badgeX = width - badgeW - 20;
        const badgeY = height - badgeH - 20;

        // พื้นหลังแท็กกลมมนสีดำโปร่งแสง
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
        ctx.fill();

        // จุดสีชมพู Live
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(badgeX + 16, badgeY + badgeH / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // ข้อความสีขาว
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, badgeX + 28, badgeY + badgeH / 2 + 1);

        ctx.restore();
      };

      drawFrameAt(0);

      // Loop ทุก 33ms (~30 FPS) ตลอด 8 วินาที
      const intervalId = setInterval(() => {
        const now = performance.now();
        const elapsed = now - startTime;

        if (elapsed >= totalMs) {
          clearInterval(intervalId);
          if (recorder.state === "recording") {
            recorder.stop();
          } else {
            finish();
          }
          return;
        }

        drawFrameAt(elapsed);
      }, 33);
    });
  } catch (error) {
    console.error("Failed to build motion video:", error);
    return null;
  }
}
