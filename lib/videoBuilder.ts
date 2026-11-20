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
    // อย่าใส่ crossOrigin บน data: หรือ blob: เด็ดขาด เพราะทำให้ WebKit/Safari เกิด CORS Error
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.warn("Load image failed for video frame:", err);
      reject(new Error("Load image failed"));
    };
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const iW = img.naturalWidth || img.width;
  const iH = img.naturalHeight || img.height;
  const imgRatio = iW / iH;
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
    return { mimeType: "", filename: "photo-motion.mp4" };
  }

  const mp4Types = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=h264",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];

  for (const type of mp4Types) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type, filename: "photo-motion.mp4" };
      }
    } catch {}
  }

  const webmTypes = [
    "video/webm;codecs=h264",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  for (const type of webmTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type, filename: "photo-motion.mp4" };
      }
    } catch {}
  }

  return { mimeType: "", filename: "photo-motion.mp4" };
}

/**
 * สร้างไฟล์วิดีโอความยาวประมาณ 8 วินาทีจาก Motion Frames หรือ Photo Shots
 * - วน Loop ภาพเคลื่อนไหวอย่างสมูท
 * - ปลอดภัย ไม่บล็อกหรือแครชบนเบราว์เซอร์ต่างๆ
 * - ส่งออกเป็นไฟล์วิดีโอที่เมื่อเซฟลงเครื่องแล้วจะอยู่ในหมวด Videos
 */
export async function createMotionVideoBlob(
  motionFrames: string[],
  photos: PhotoShot[],
  options: MotionVideoOptions = {}
): Promise<MotionVideoResult | null> {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    console.warn("MediaRecorder is not supported in this environment");
    return null;
  }

  try {
    const rawSources =
      motionFrames && motionFrames.length >= 2
        ? motionFrames
        : photos.map((p) => p.dataUrl);

    if (rawSources.length === 0) {
      console.warn("No sources for motion video");
      return null;
    }

    const durationSeconds = options.durationSeconds ?? 8;

    // โหลดรูปทั้งหมดล่วงหน้าแบบปลอดภัย (ข้ามรูปที่โหลดไม่ได้ ไม่ทำให้ทั้งคลิปพัง)
    const loadedImages = (
      await Promise.all(
        rawSources.map((src) => loadImage(src).catch(() => null))
      )
    ).filter((img): img is HTMLImageElement => img !== null);

    if (loadedImages.length === 0) {
      console.warn("No images could be loaded for motion video");
      return null;
    }

    // คำนวณสัดส่วนแนวนอน (Landscape) ให้เต็มตาเสมอ ไม่มีขอบดำข้างๆ
    const sampleImg = loadedImages[0];
    const iW = sampleImg.naturalWidth || sampleImg.width || 800;
    const iH = sampleImg.naturalHeight || sampleImg.height || 600;
    const photoRatio = iW / iH;

    // บังคับสัดส่วนแนวนอน (Landscape): หากภาพกว้างกว่าสูงใช้ตามสัดส่วนภาพจริง ถ้าเป็นแนวตั้งให้จัดเป็น 16:9 แนวนอน
    const targetAspect = photoRatio > 1 ? photoRatio : 16 / 9;

    let width = 800;
    let height = Math.round(width / targetAspect);
    // Codec H.264 / VP8 / VP9 ต้องการขนาดความกว้างและความสูงเป็นเลขคู่ (Even numbers)
    if (width % 2 !== 0) width += 1;
    if (height % 2 !== 0) height += 1;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return null;

    const { mimeType, filename } = getSupportedVideoMimeType();

    // เริ่ม Stream จาก Canvas ที่ 24 FPS
    const stream = canvas.captureStream(24);
    
    // ตั้งค่า MediaRecorder แบบมี Fallback ป้องกัน NotSupportedError
    let recorder: MediaRecorder;
    try {
      if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1500000, // 1.5 Mbps คมชัดและขนาดไฟล์กระทัดรัด
        });
      } else {
        recorder = new MediaRecorder(stream, { videoBitsPerSecond: 1500000 });
      }
    } catch (e) {
      console.warn("MediaRecorder init with options failed, fallback to plain recorder:", e);
      recorder = new MediaRecorder(stream);
    }

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
          const finalMime = recorder.mimeType || mimeType.split(";")[0] || "video/mp4";
          const finalBlob = new Blob(chunks, { type: finalMime });
          console.log(`Motion video created successfully: ${finalBlob.size} bytes (${finalMime})`);
          resolve({
            blob: finalBlob,
            mimeType: finalMime,
            filename,
          });
        } catch (err) {
          console.error("Failed to assemble video blob:", err);
          resolve(null);
        }
      };

      recorder.onstop = finish;
      recorder.onerror = (err) => {
        console.error("MediaRecorder error event:", err);
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      };

      recorder.start();

      const startTime = performance.now();
      const totalMs = durationSeconds * 1000;
      // ความเร็วการสลับภาพ 160ms ต่อเฟรม เพื่อความลื่นไหลเป็นธรรมชาติ
      const frameDelayMs = 160;

      const drawFrameAt = (elapsed: number) => {
        const frameIndex = Math.floor(elapsed / frameDelayMs) % loadedImages.length;
        const currentImg = loadedImages[frameIndex];

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
      };

      drawFrameAt(0);

      // รันแอนิเมชันทุก 40ms (~25 FPS) จนครบ 8 วินาที
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
      }, 40);
    });
  } catch (error) {
    console.error("Failed to build motion video:", error);
    return null;
  }
}
