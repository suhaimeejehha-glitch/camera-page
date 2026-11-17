import { createAdaptedFrameOverlay } from "@/lib/frameOverlays";
import type {
  FrameCategory,
  FrameConfig,
  LayoutOrientation,
  ShotCount,
  SlotRect,
  SlotShape,
} from "@/types/photobooth";

const STANDARD_RECT_SLOTS: SlotRect[] = [
  { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
  { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
  { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
  { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
];

export const FRAME_CATEGORIES: { id: "all" | FrameCategory; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "cute", label: "น่ารัก / การ์ตูน" },
  { id: "street", label: "เท่ / ฟิล์ม / สตรีท" },
  { id: "minimal", label: "มินิมอล" },
  { id: "event", label: "เทศกาล / วันเกิด" },
];

export function parseShotCount(value?: string | null): ShotCount {
  const num = Number(value);
  if (num === 1 || num === 2 || num === 3 || num === 4) return num;
  return 4;
}

export function parseOrientation(value?: string | null): LayoutOrientation {
  return value === "horizontal" ? "horizontal" : "vertical";
}

interface LayoutSpec {
  canvasWidth: number;
  canvasHeight: number;
  slots: SlotRect[];
}

function getLayoutSpec(
  shots: ShotCount,
  orientation: LayoutOrientation,
  slotShapes: SlotShape[] = []
): LayoutSpec {
  const shapeAt = (idx: number): SlotShape => slotShapes[idx] ?? "rect";

  if (orientation === "horizontal") {
    switch (shots) {
      case 1:
        return {
          canvasWidth: 900,
          canvasHeight: 680,
          slots: [{ x: 50, y: 50, width: 800, height: 520, shape: shapeAt(0) }],
        };
      case 2:
        return {
          canvasWidth: 1200,
          canvasHeight: 620,
          slots: [
            { x: 45, y: 50, width: 535, height: 450, shape: shapeAt(0) },
            { x: 620, y: 50, width: 535, height: 450, shape: shapeAt(1) },
          ],
        };
      case 3:
        return {
          canvasWidth: 1500,
          canvasHeight: 580,
          slots: [
            { x: 45, y: 48, width: 445, height: 410, shape: shapeAt(0) },
            { x: 527, y: 48, width: 445, height: 410, shape: shapeAt(1) },
            { x: 1010, y: 48, width: 445, height: 410, shape: shapeAt(2) },
          ],
        };
      case 4:
      default:
        return {
          canvasWidth: 1600,
          canvasHeight: 560,
          slots: [
            { x: 40, y: 48, width: 356, height: 390, shape: shapeAt(0) },
            { x: 428, y: 48, width: 356, height: 390, shape: shapeAt(1) },
            { x: 816, y: 48, width: 356, height: 390, shape: shapeAt(2) },
            { x: 1204, y: 48, width: 356, height: 390, shape: shapeAt(3) },
          ],
        };
    }
  }

  // แนวตั้ง (Vertical)
  switch (shots) {
    case 1:
      return {
        canvasWidth: 600,
        canvasHeight: 820,
        slots: [{ x: 45, y: 55, width: 510, height: 630, shape: shapeAt(0) }],
      };
    case 2:
      return {
        canvasWidth: 600,
        canvasHeight: 1050,
        slots: [
          { x: 45, y: 55, width: 510, height: 420, shape: shapeAt(0) },
          { x: 45, y: 505, width: 510, height: 420, shape: shapeAt(1) },
        ],
      };
    case 3:
      return {
        canvasWidth: 600,
        canvasHeight: 1340,
        slots: [
          { x: 45, y: 55, width: 510, height: 365, shape: shapeAt(0) },
          { x: 45, y: 445, width: 510, height: 365, shape: shapeAt(1) },
          { x: 45, y: 835, width: 510, height: 365, shape: shapeAt(2) },
        ],
      };
    case 4:
    default:
      return {
        canvasWidth: 600,
        canvasHeight: 1600,
        slots: [
          { x: 40, y: 60, width: 520, height: 330, shape: shapeAt(0) },
          { x: 40, y: 410, width: 520, height: 330, shape: shapeAt(1) },
          { x: 40, y: 760, width: 520, height: 330, shape: shapeAt(2) },
          { x: 40, y: 1110, width: 520, height: 330, shape: shapeAt(3) },
        ],
      };
  }
}

/**
 * รายการกรอบ Photobooth ทั้งหมด (ค่าเริ่มต้นเป็น 4 ช่องแนวตั้งพร้อมลาย SVG พิเศษ)
 */
export const FRAMES: FrameConfig[] = [
  // หมวด น่ารัก / การ์ตูน
  {
    id: "sweet-pink-4cut",
    name: "Sweet",
    category: "cute",
    badge: "HOT",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#ecc3ba",
    accentColor: "#c86d6d",
    labelText: "s w e e t",
    overlayImage: "/frames/sweet-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "cute-ribbon-4cut",
    name: "Cute",
    category: "cute",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#f8d4dc",
    accentColor: "#d45d87",
    labelText: "CUTE ♡",
    overlayImage: "/frames/cute-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "love-mix-4cut",
    name: "Love Mix",
    category: "cute",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#f9d5dd",
    accentColor: "#b84b68",
    labelText: "i love you",
    overlayImage: "/frames/love-mix-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "heart" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "heart-4cut",
    name: "4 Hearts",
    category: "cute",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#f7ccd4",
    accentColor: "#9c4157",
    labelText: "i love you ♥",
    overlayImage: "/frames/heart-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "heart" },
      { x: 40, y: 410, width: 520, height: 330, shape: "heart" },
      { x: 40, y: 760, width: 520, height: 330, shape: "heart" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "heart" },
    ],
  },
  {
    id: "pastel-cloud-4cut",
    name: "Pastel Cloud",
    category: "cute",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#ede9fe",
    accentColor: "#7c3aed",
    labelText: "DREAMY DAY",
    overlayImage: "/frames/pastel-cloud-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },

  // หมวด เท่ / ฟิล์ม / สตรีท
  {
    id: "noir-film-4cut",
    name: "Noir 400",
    category: "street",
    badge: "HOT",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#121316",
    accentColor: "#f59e0b",
    labelText: "35MM FILM",
    overlayImage: "/frames/noir-film-frame.svg",
    slots: [
      { x: 52, y: 60, width: 496, height: 330, shape: "rect" },
      { x: 52, y: 410, width: 496, height: 330, shape: "rect" },
      { x: 52, y: 760, width: 496, height: 330, shape: "rect" },
      { x: 52, y: 1110, width: 496, height: 330, shape: "rect" },
    ],
  },
  {
    id: "street-navy-4cut",
    name: "Street Navy",
    category: "street",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#132033",
    accentColor: "#38bdf8",
    labelText: "STREET SNAP",
    overlayImage: "/frames/street-navy-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "cyber-hud-4cut",
    name: "Cyber HUD",
    category: "street",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#181b22",
    accentColor: "#22d3ee",
    labelText: "CAM-01",
    overlayImage: "/frames/cyber-hud-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "clapperboard-4cut",
    name: "Cinema Slate",
    category: "street",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#0d0e11",
    accentColor: "#f8fafc",
    labelText: "SCENE • TAKE",
    overlayImage: "/frames/clapperboard-frame.svg",
    slots: [
      { x: 64, y: 340, width: 472, height: 280, shape: "rect" },
      { x: 64, y: 644, width: 472, height: 280, shape: "rect" },
      { x: 64, y: 948, width: 472, height: 280, shape: "rect" },
      { x: 64, y: 1252, width: 472, height: 280, shape: "rect" },
    ],
  },

  // หมวด มินิมอล
  {
    id: "retro-vhs-4cut",
    name: "Retro VHS",
    category: "street",
    badge: "HOT",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#18181b",
    accentColor: "#f97316",
    labelText: "VHS 90S",
    overlayImage: "/frames/retro-vhs-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "urban-mono-4cut",
    name: "Urban Mono",
    category: "minimal",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#e4e4e7",
    accentColor: "#18181b",
    labelText: "ARCHIVE 04",
    overlayImage: "/frames/urban-mono-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "slate-minimal-4cut",
    name: "Slate Pure",
    category: "minimal",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#27303f",
    accentColor: "#f8fafc",
    labelText: "MINIMAL",
    overlayImage: "/frames/slate-minimal-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "cream-linen-4cut",
    name: "Cream Linen",
    category: "minimal",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#faf6ef",
    accentColor: "#57534e",
    labelText: "PURE STUDIO",
    overlayImage: "/frames/cream-linen-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "sage-leaf-4cut",
    name: "Sage Soft",
    category: "minimal",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#e8f0eb",
    accentColor: "#3f6212",
    labelText: "NATURAL",
    overlayImage: "/frames/sage-leaf-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "pearl-blush-4cut",
    name: "Pearl Blush",
    category: "minimal",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#fdf2f8",
    accentColor: "#be185d",
    labelText: "CLASSIC",
    overlayImage: "/frames/pearl-blush-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },

  // หมวด เทศกาล / วันเกิด
  {
    id: "birthday-party-4cut",
    name: "Happy B-Day",
    category: "event",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#1e1b4b",
    accentColor: "#fde047",
    labelText: "HAPPY B-DAY!",
    overlayImage: "/frames/birthday-frame.svg",
    slots: [
      { x: 40, y: 60, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 410, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 760, width: 520, height: 330, shape: "rect" },
      { x: 40, y: 1110, width: 520, height: 330, shape: "rect" },
    ],
  },
  {
    id: "christmas-jolly-4cut",
    name: "Merry Xmas",
    category: "event",
    badge: "HOT",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#143326",
    accentColor: "#fca5a5",
    labelText: "MERRY XMAS",
    overlayImage: "/frames/christmas-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "newyear-gold-4cut",
    name: "Happy 2026",
    category: "event",
    badge: "NEW",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#0f172a",
    accentColor: "#facc15",
    labelText: "NEW YEAR",
    overlayImage: "/frames/newyear-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "halloween-boo-4cut",
    name: "Spooky Boo",
    category: "event",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#241435",
    accentColor: "#fb923c",
    labelText: "BOO NIGHT",
    overlayImage: "/frames/halloween-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
  {
    id: "valentine-rose-4cut",
    name: "Sweet Love",
    category: "event",
    shotCount: 4,
    orientation: "vertical",
    canvasWidth: 600,
    canvasHeight: 1600,
    backgroundColor: "#881337",
    accentColor: "#fbcfe8",
    labelText: "VALENTINE",
    overlayImage: "/frames/valentine-frame.svg",
    slots: STANDARD_RECT_SLOTS,
  },
];

function getClapperboardLayoutSpec(
  shots: ShotCount,
  orientation: LayoutOrientation
): LayoutSpec {
  if (orientation === "horizontal") {
    switch (shots) {
      case 1:
        return {
          canvasWidth: 960,
          canvasHeight: 580,
          slots: [{ x: 316, y: 74, width: 616, height: 432, shape: "rect" }],
        };
      case 2:
        return {
          canvasWidth: 1280,
          canvasHeight: 580,
          slots: [
            { x: 316, y: 74, width: 452, height: 432, shape: "rect" },
            { x: 794, y: 74, width: 452, height: 432, shape: "rect" },
          ],
        };
      case 3:
        return {
          canvasWidth: 1560,
          canvasHeight: 580,
          slots: [
            { x: 316, y: 74, width: 388, height: 432, shape: "rect" },
            { x: 728, y: 74, width: 388, height: 432, shape: "rect" },
            { x: 1140, y: 74, width: 388, height: 432, shape: "rect" },
          ],
        };
      case 4:
      default:
        return {
          canvasWidth: 1760,
          canvasHeight: 580,
          slots: [
            { x: 316, y: 74, width: 336, height: 432, shape: "rect" },
            { x: 674, y: 74, width: 336, height: 432, shape: "rect" },
            { x: 1032, y: 74, width: 336, height: 432, shape: "rect" },
            { x: 1390, y: 74, width: 336, height: 432, shape: "rect" },
          ],
        };
    }
  }

  switch (shots) {
    case 1:
      return {
        canvasWidth: 600,
        canvasHeight: 900,
        slots: [{ x: 64, y: 344, width: 472, height: 476, shape: "rect" }],
      };
    case 2:
      return {
        canvasWidth: 600,
        canvasHeight: 1140,
        slots: [
          { x: 64, y: 344, width: 472, height: 340, shape: "rect" },
          { x: 64, y: 712, width: 472, height: 340, shape: "rect" },
        ],
      };
    case 3:
      return {
        canvasWidth: 600,
        canvasHeight: 1380,
        slots: [
          { x: 64, y: 340, width: 472, height: 310, shape: "rect" },
          { x: 64, y: 676, width: 472, height: 310, shape: "rect" },
          { x: 64, y: 1012, width: 472, height: 310, shape: "rect" },
        ],
      };
    case 4:
    default:
      return {
        canvasWidth: 600,
        canvasHeight: 1600,
        slots: [
          { x: 64, y: 340, width: 472, height: 280, shape: "rect" },
          { x: 64, y: 644, width: 472, height: 280, shape: "rect" },
          { x: 64, y: 948, width: 472, height: 280, shape: "rect" },
          { x: 64, y: 1252, width: 472, height: 280, shape: "rect" },
        ],
      };
  }
}

function adaptFrameToLayout(
  base: FrameConfig,
  shots: ShotCount,
  orientation: LayoutOrientation
): FrameConfig {
  if (shots === 4 && orientation === "vertical") {
    return base;
  }

  const shapes = base.slots.map((s) => s.shape ?? "rect");
  const layout =
    base.id === "clapperboard-4cut"
      ? getClapperboardLayoutSpec(shots, orientation)
      : getLayoutSpec(shots, orientation, shapes);

  const adapted: FrameConfig = {
    ...base,
    shotCount: shots,
    orientation,
    canvasWidth: layout.canvasWidth,
    canvasHeight: layout.canvasHeight,
    slots: layout.slots,
  };

  return {
    ...adapted,
    overlayImage: createAdaptedFrameOverlay(adapted, shots, orientation),
  };
}

export function getFramesForLayout(
  shots: ShotCount = 4,
  orientation: LayoutOrientation = "vertical"
): FrameConfig[] {
  return FRAMES.map((frame) => adaptFrameToLayout(frame, shots, orientation));
}

export function getFrameById(
  frameId?: string | null,
  shots: ShotCount = 4,
  orientation: LayoutOrientation = "vertical"
): FrameConfig {
  const base = FRAMES.find((frame) => frame.id === frameId) ?? FRAMES[0];
  return adaptFrameToLayout(base, shots, orientation);
}
