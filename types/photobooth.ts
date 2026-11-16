export type SlotShape = "rect" | "heart";

export type FrameCategory = "cute" | "street" | "minimal" | "event";

export type LayoutOrientation = "vertical" | "horizontal";

export type ShotCount = 1 | 2 | 3 | 4;

export interface PhotoShot {
  id: string;
  dataUrl: string;
}

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: SlotShape;
}

export interface FrameConfig {
  id: string;
  name: string;
  category: FrameCategory;
  badge?: "HOT" | "NEW";
  shotCount: number;
  orientation: LayoutOrientation;
  /** Width & height of the exported strip in pixels */
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  accentColor: string;
  labelText: string;
  /** Optional PNG/SVG overlay path under /public/frames/ (transparent cutouts) */
  overlayImage?: string;
  slots: SlotRect[];
}

export interface StickerItem {
  id: string;
  name: string;
  /** Path under /public/stickers/ */
  src: string;
}

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
