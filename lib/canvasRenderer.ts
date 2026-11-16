import type { FrameConfig, PhotoShot, PlacedSticker } from "@/types/photobooth";

export interface RenderStripOptions {
  frame: FrameConfig;
  photos: PhotoShot[];
  stickers: PlacedSticker[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`โหลดรูปไม่สำเร็จ: ${src}`));
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * รวมรูปถ่าย + กรอบ (ทั้งแบบ overlayImage และแบบกรอบสีอัตโนมัติ 1–4 รูป แนวตั้ง/แนวนอน) + สติกเกอร์ ลงบน Canvas
 */
export async function renderPhotoboothStrip(
  options: RenderStripOptions
): Promise<string> {
  const { frame, photos, stickers } = options;
  const canvas = document.createElement("canvas");
  canvas.width = frame.canvasWidth;
  canvas.height = frame.canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context");
  }

  // Layer 1: พื้นหลังกรอบ (สีพื้นของกรอบ หรือสีขาวสำหรับกรอบที่มี overlayImage)
  ctx.fillStyle = frame.overlayImage ? "#ffffff" : frame.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Layer 2: วาดช่องสีขาว + รูปถ่ายแต่ละช่อง
  for (let i = 0; i < frame.slots.length; i++) {
    const slot = frame.slots[i];
    const photo = photos[i];

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(slot.x, slot.y, slot.width, slot.height);

    if (!photo) continue;
    const photoImg = await loadImage(photo.dataUrl);
    drawImageCover(ctx, photoImg, slot.x, slot.y, slot.width, slot.height);
  }

  // Layer 3: วาดภาพกรอบซ้อนทับ หรือวาดขอบ+ข้อความสำหรับกรอบสี 1-3 รูป / แนวนอน
  if (frame.overlayImage) {
    const frameImg = await loadImage(frame.overlayImage);
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.strokeStyle = frame.accentColor;
    ctx.lineWidth = 4;
    for (const slot of frame.slots) {
      ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
    }

    ctx.fillStyle = frame.accentColor;
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(frame.name.toUpperCase(), 45, canvas.height - 34);

    ctx.textAlign = "right";
    ctx.font = "bold 24px monospace";
    ctx.fillText(frame.labelText, canvas.width - 45, canvas.height - 34);
  }

  // Layer 4: วาดสติกเกอร์ทั้งหมดตามตำแหน่ง ขนาด และมุมหมุน
  for (const sticker of stickers) {
    const stickerImg = await loadImage(sticker.src);
    const px = (sticker.x / 100) * canvas.width;
    const py = (sticker.y / 100) * canvas.height;
    const size = Math.min(canvas.width, canvas.height) * 0.22 * sticker.scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((sticker.rotation * Math.PI) / 180);
    ctx.drawImage(stickerImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}
