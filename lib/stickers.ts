import type { PlacedSticker, StickerItem } from "@/types/photobooth";

/**
 * รายการสติกเกอร์พื้นฐานสำหรับตกแต่งบนกรอบรูป
 */
export const STICKERS: StickerItem[] = [
  { id: "heart", name: "Heart", src: "/stickers/heart.svg" },
  { id: "star", name: "Star", src: "/stickers/star.svg" },
  { id: "flower", name: "Flower", src: "/stickers/flower.svg" },
  { id: "ribbon", name: "Ribbon", src: "/stickers/ribbon.svg" },
  { id: "bolt", name: "Bolt", src: "/stickers/bolt.svg" },
  { id: "shades", name: "Shades", src: "/stickers/shades.svg" },
  { id: "y2k-star", name: "Y2K Star", src: "/stickers/y2k-star.svg" },
  { id: "crown", name: "Crown", src: "/stickers/crown.svg" },
];

export interface StickerPresetItem {
  stickerId: string;
  src: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number; // scale multiplier
  rotation: number; // degrees
}

export interface StickerTheme {
  id: string;
  name: string;
  thaiName: string;
  icon: string;
  badge?: string;
  description: string;
  previewIcons: string[];
  stickers: {
    vertical: StickerPresetItem[];
    horizontal: StickerPresetItem[];
  };
}

/**
 * ชุดธีมสติกเกอร์สำเร็จรูป (1-Tap Preset Decorative Themes)
 * ออกแบบตำแหน่งลงตัวตามมุม ขอบ และช่องว่าง ไม่บังหน้าลูกค้าบนรูป
 */
export const STICKER_THEMES: StickerTheme[] = [
  {
    id: "none",
    name: "Clean Minimal",
    thaiName: "คลีน (ไม่ใส่สติกเกอร์)",
    icon: "🚫",
    description: "กรอบรูปเรียบหรู คมชัด สไตล์มินิมอล",
    previewIcons: [],
    stickers: {
      vertical: [],
      horizontal: [],
    },
  },
  {
    id: "sweet-heart",
    name: "Sweet Heart",
    thaiName: "หัวใจ & ริบบิ้นหวาน",
    icon: "💖",
    badge: "ยอดนิยม",
    description: "ประดับหัวใจสีชมพูและโบว์น่ารักรอบกรอบ",
    previewIcons: ["/stickers/heart.svg", "/stickers/ribbon.svg"],
    stickers: {
      vertical: [
        { stickerId: "heart", src: "/stickers/heart.svg", x: 12, y: 3.5, scale: 0.85, rotation: -12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 88, y: 3.5, scale: 0.8, rotation: 15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 7, y: 33, scale: 0.75, rotation: -8 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 93, y: 65, scale: 0.75, rotation: 10 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 12, y: 94.5, scale: 0.85, rotation: -15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 88, y: 94, scale: 0.9, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "heart", src: "/stickers/heart.svg", x: 4, y: 14, scale: 0.85, rotation: -12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 5, y: 86, scale: 0.85, rotation: 15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 34, y: 9, scale: 0.75, rotation: -8 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 66, y: 9, scale: 0.75, rotation: 8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 96, y: 14, scale: 0.85, rotation: 15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 95, y: 86, scale: 0.9, rotation: -12 },
      ],
    },
  },
  {
    id: "y2k-sparkle",
    name: "Y2K Sparkle",
    thaiName: "ดวงดาว Y2K วิ้งวับ",
    icon: "✨",
    badge: "ฮิต",
    description: "ดาวประกายวิบวับสไตล์เรโทร Y2K",
    previewIcons: ["/stickers/y2k-star.svg", "/stickers/star.svg"],
    stickers: {
      vertical: [
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 11, y: 3.5, scale: 0.9, rotation: -10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 88, y: 4, scale: 0.8, rotation: 18 },
        { stickerId: "star", src: "/stickers/star.svg", x: 7, y: 34, scale: 0.7, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 93, y: 62, scale: 0.85, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 12, y: 94.5, scale: 0.85, rotation: -15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 88, y: 94, scale: 0.95, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 4, y: 14, scale: 0.9, rotation: -10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 34, y: 9, scale: 0.75, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 66, y: 9, scale: 0.8, rotation: 10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 96, y: 14, scale: 0.85, rotation: 15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 95, y: 86, scale: 0.95, rotation: -10 },
      ],
    },
  },
  {
    id: "royal-party",
    name: "Royal Party",
    thaiName: "มงกุฎ & ปาร์ตี้ฉลอง",
    icon: "👑",
    description: "มงกุฎเจ้าหญิง แว่นตา และโบว์ฉลอง",
    previewIcons: ["/stickers/crown.svg", "/stickers/shades.svg"],
    stickers: {
      vertical: [
        { stickerId: "crown", src: "/stickers/crown.svg", x: 14, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 7, y: 33, scale: 0.7, rotation: -15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 93, y: 64, scale: 0.85, rotation: 8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 87, y: 94, scale: 0.9, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "crown", src: "/stickers/crown.svg", x: 5, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 34, y: 9, scale: 0.8, rotation: -6 },
        { stickerId: "star", src: "/stickers/star.svg", x: 66, y: 9, scale: 0.75, rotation: 12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 95, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 95, y: 86, scale: 0.9, rotation: 8 },
      ],
    },
  },
  {
    id: "vintage-bloom",
    name: "Vintage Bloom",
    thaiName: "ดอกไม้ & วินเทจบลูม",
    icon: "🌸",
    description: "ดอกไม้และโบว์สไตล์วินเทจน่ารัก",
    previewIcons: ["/stickers/flower.svg", "/stickers/ribbon.svg"],
    stickers: {
      vertical: [
        { stickerId: "flower", src: "/stickers/flower.svg", x: 12, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 7, y: 35, scale: 0.75, rotation: 12 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 93, y: 65, scale: 0.75, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "flower", src: "/stickers/flower.svg", x: 4, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 34, y: 9, scale: 0.75, rotation: 8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 66, y: 9, scale: 0.75, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 96, y: 14, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 95, y: 86, scale: 0.9, rotation: -10 },
      ],
    },
  },
  {
    id: "cyber-cool",
    name: "Cyber Cool",
    thaiName: "สายฟ้า & สตรีทคูล",
    icon: "⚡️",
    description: "สายฟ้า แว่นกันแดด และดาวสตรีทสุดเท่",
    previewIcons: ["/stickers/bolt.svg", "/stickers/shades.svg"],
    stickers: {
      vertical: [
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 12, y: 3.5, scale: 0.85, rotation: -15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 7, y: 35, scale: 0.8, rotation: 8 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 93, y: 65, scale: 0.8, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 12, y: 94.5, scale: 0.85, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 88, y: 94, scale: 0.9, rotation: 15 },
      ],
      horizontal: [
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 4, y: 14, scale: 0.85, rotation: -15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 5, y: 86, scale: 0.8, rotation: 10 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 34, y: 9, scale: 0.8, rotation: 6 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 66, y: 9, scale: 0.8, rotation: -10 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 96, y: 14, scale: 0.85, rotation: 12 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 95, y: 86, scale: 0.9, rotation: -15 },
      ],
    },
  },
];

/**
 * สร้างรายการ PlacedSticker ตามธีมสำเร็จรูปและทิศทางของแถบรูป
 */
export function getPlacedStickersForTheme(
  themeId: string,
  orientation: "vertical" | "horizontal" = "vertical"
): PlacedSticker[] {
  const theme = STICKER_THEMES.find((t) => t.id === themeId);
  if (!theme || theme.id === "none") return [];

  const items = orientation === "horizontal" ? theme.stickers.horizontal : theme.stickers.vertical;

  return items.map((item, index) => ({
    instanceId: `${item.stickerId}-${index}-${themeId}`,
    stickerId: item.stickerId,
    src: item.src,
    x: item.x,
    y: item.y,
    scale: item.scale,
    rotation: item.rotation,
  }));
}
