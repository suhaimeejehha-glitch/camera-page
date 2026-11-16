import { encodeAnimatedGif, type GifFrameInput } from "@/lib/gifEncoder";
import type { PhotoShot } from "@/types/photobooth";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Load image failed"));
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

  ctx.fillStyle = "#0d0f12";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/**
 * สร้างไฟล์ภาพเคลื่อนไหว GIF Animation (.gif) จากเฟรมวิดีโอที่อัดระหว่างถ่าย หรือรูปที่ถ่าย
 */
export async function createAnimatedGifBlob(
  motionFrames: string[],
  photos: PhotoShot[]
): Promise<Blob | null> {
  const sources =
    motionFrames.length >= 2
      ? motionFrames
      : photos.map((photo) => photo.dataUrl);

  if (sources.length === 0 || typeof document === "undefined") {
    return null;
  }

  const width = 400;
  const height = 300;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const images = await Promise.all(sources.map(loadImage));
  const gifFrames: GifFrameInput[] = images.map((img) => {
    drawCover(ctx, img, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return {
      width,
      height,
      rgba: imageData.data,
    };
  });

  // ถ้ารูปเป็นชุดภาพนิ่ง (1-4 ภาพ) ให้หน่วงต่อเฟรมนานขึ้น (550ms) ถ้าเป็นคลิปอัดสดให้เร็วลื่น (180ms)
  const delayCs = motionFrames.length >= 2 ? 18 : 55;
  const gifBytes = encodeAnimatedGif(gifFrames, delayCs);
  const buffer = new ArrayBuffer(gifBytes.byteLength);
  new Uint8Array(buffer).set(gifBytes);
  return new Blob([buffer], { type: "image/gif" });
}
