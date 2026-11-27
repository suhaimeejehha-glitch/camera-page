import type { PlacedSticker, StickerItem } from "@/types/photobooth";

/**
 * รายการสติกเกอร์ทั้งหมดสำหรับตกแต่งบนกรอบรูป (28 แบบ)
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
  { id: "cherry", name: "Cherry", src: "/stickers/cherry.svg" },
  { id: "butterfly", name: "Butterfly", src: "/stickers/butterfly.svg" },
  { id: "sparkle", name: "Sparkle", src: "/stickers/sparkle.svg" },
  { id: "cat", name: "Cat", src: "/stickers/cat.svg" },
  { id: "flame", name: "Flame", src: "/stickers/flame.svg" },
  { id: "smile", name: "Smile", src: "/stickers/smile.svg" },
  { id: "clover", name: "Clover", src: "/stickers/clover.svg" },
  { id: "lip", name: "Lip", src: "/stickers/lip.svg" },
  { id: "camera", name: "Camera", src: "/stickers/camera.svg" },
  { id: "music", name: "Music", src: "/stickers/music.svg" },
  { id: "dino", name: "Dino", src: "/stickers/dino.svg" },
  { id: "bear", name: "Bear", src: "/stickers/bear.svg" },
  { id: "rabbit", name: "Rabbit", src: "/stickers/rabbit.svg" },
  { id: "coffee", name: "Coffee", src: "/stickers/coffee.svg" },
  { id: "cake", name: "Cake", src: "/stickers/cake.svg" },
  { id: "balloon", name: "Balloon", src: "/stickers/balloon.svg" },
  { id: "rainbow", name: "Rainbow", src: "/stickers/rainbow.svg" },
  { id: "ghost", name: "Ghost", src: "/stickers/ghost.svg" },
  { id: "mushroom", name: "Mushroom", src: "/stickers/mushroom.svg" },
  { id: "gameboy", name: "Gameboy", src: "/stickers/gameboy.svg" },
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
 * 20 ธีมสติกเกอร์สำเร็จรูปยอดนิยม + 1 ธีมคลีน (1-Tap Preset Decorative Themes)
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
    id: "cherry-pop",
    name: "Cherry Pop",
    thaiName: "เชอร์รี่คิ้วท์เกาหลี",
    icon: "🍒",
    badge: "มาแรง",
    description: "เชอร์รี่สดใสสไตล์คาเฟ่เกาหลี",
    previewIcons: ["/stickers/cherry.svg", "/stickers/sparkle.svg"],
    stickers: {
      vertical: [
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 12, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 88, y: 3.8, scale: 0.75, rotation: 15 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 93, y: 34, scale: 0.75, rotation: 8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 7, y: 64, scale: 0.7, rotation: -12 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 12, y: 94.5, scale: 0.8, rotation: -8 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 88, y: 94, scale: 0.9, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 4, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 34, y: 9, scale: 0.75, rotation: 8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 66, y: 9, scale: 0.7, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 96, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 95, y: 86, scale: 0.9, rotation: -10 },
      ],
    },
  },
  {
    id: "kawaii-kitty",
    name: "Kawaii Kitty",
    thaiName: "เหมียวเหมียวคาวาอี้",
    icon: "🐱",
    badge: "คิ้วท์สุด",
    description: "น้องแมวเหมียวสุดน่ารักขวัญใจทาสแมว",
    previewIcons: ["/stickers/cat.svg", "/stickers/heart.svg"],
    stickers: {
      vertical: [
        { stickerId: "cat", src: "/stickers/cat.svg", x: 13, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 7, y: 35, scale: 0.7, rotation: 12 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 93, y: 64, scale: 0.75, rotation: -10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 12, y: 94.5, scale: 0.8, rotation: -15 },
        { stickerId: "cat", src: "/stickers/cat.svg", x: 87, y: 94, scale: 0.95, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "cat", src: "/stickers/cat.svg", x: 5, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 34, y: 9, scale: 0.75, rotation: -8 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 66, y: 9, scale: 0.75, rotation: 10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 96, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "cat", src: "/stickers/cat.svg", x: 95, y: 86, scale: 0.95, rotation: 8 },
      ],
    },
  },
  {
    id: "teddy-bear",
    name: "Teddy Bear",
    thaiName: "น้องหมีเท็ดดี้อบอุ่น",
    icon: "🧸",
    badge: "อบอุ่น",
    description: "น้องหมีสีน้ำตาล หัวใจ และกาแฟอุ่นๆ",
    previewIcons: ["/stickers/bear.svg", "/stickers/coffee.svg"],
    stickers: {
      vertical: [
        { stickerId: "bear", src: "/stickers/bear.svg", x: 13, y: 3.5, scale: 0.9, rotation: -6 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 88, y: 4, scale: 0.8, rotation: 12 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 7, y: 34, scale: 0.75, rotation: 10 },
        { stickerId: "bear", src: "/stickers/bear.svg", x: 93, y: 64, scale: 0.85, rotation: -8 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 12, y: 94.5, scale: 0.8, rotation: -10 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 88, y: 94, scale: 0.85, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "bear", src: "/stickers/bear.svg", x: 5, y: 14, scale: 0.9, rotation: -6 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 5, y: 86, scale: 0.8, rotation: 12 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 34, y: 9, scale: 0.75, rotation: 10 },
        { stickerId: "bear", src: "/stickers/bear.svg", x: 66, y: 9, scale: 0.85, rotation: -8 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 96, y: 14, scale: 0.8, rotation: -10 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 95, y: 86, scale: 0.85, rotation: 12 },
      ],
    },
  },
  {
    id: "bunny-lover",
    name: "Bunny Lover",
    thaiName: "กระต่ายน้อยพาสเทล",
    icon: "🐰",
    description: "กระต่ายหูยาวสีขาว ดอกไม้ และโบว์น่ารัก",
    previewIcons: ["/stickers/rabbit.svg", "/stickers/ribbon.svg"],
    stickers: {
      vertical: [
        { stickerId: "rabbit", src: "/stickers/rabbit.svg", x: 13, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 7, y: 34, scale: 0.75, rotation: 12 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 93, y: 64, scale: 0.75, rotation: -10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 12, y: 94.5, scale: 0.8, rotation: -12 },
        { stickerId: "rabbit", src: "/stickers/rabbit.svg", x: 87, y: 94, scale: 0.95, rotation: 8 },
      ],
      horizontal: [
        { stickerId: "rabbit", src: "/stickers/rabbit.svg", x: 5, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 34, y: 9, scale: 0.75, rotation: 12 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 66, y: 9, scale: 0.75, rotation: -10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 96, y: 14, scale: 0.8, rotation: -12 },
        { stickerId: "rabbit", src: "/stickers/rabbit.svg", x: 95, y: 86, scale: 0.95, rotation: 8 },
      ],
    },
  },
  {
    id: "y2k-butterfly",
    name: "Y2K Butterfly",
    thaiName: "ผีเสื้อ Y2K พาสเทล",
    icon: "🦋",
    badge: "ฮิต",
    description: "ผีเสื้อสีม่วงพาสเทลและดาววิบวับ",
    previewIcons: ["/stickers/butterfly.svg", "/stickers/y2k-star.svg"],
    stickers: {
      vertical: [
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 13, y: 3.5, scale: 0.9, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 88, y: 4, scale: 0.8, rotation: 18 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 7, y: 34, scale: 0.7, rotation: -10 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 93, y: 64, scale: 0.85, rotation: 12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 12, y: 94.5, scale: 0.85, rotation: -15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 87, y: 94, scale: 0.9, rotation: -8 },
      ],
      horizontal: [
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 5, y: 14, scale: 0.9, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 34, y: 9, scale: 0.75, rotation: -8 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 66, y: 9, scale: 0.85, rotation: 10 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 96, y: 14, scale: 0.85, rotation: 15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 95, y: 86, scale: 0.9, rotation: -10 },
      ],
    },
  },
  {
    id: "y2k-sparkle",
    name: "Y2K Sparkle",
    thaiName: "ดวงดาว Y2K วิ้งวับ",
    icon: "✨",
    description: "ดาวประกายวิบวับสไตล์เรโทร Y2K",
    previewIcons: ["/stickers/y2k-star.svg", "/stickers/star.svg"],
    stickers: {
      vertical: [
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 11, y: 3.5, scale: 0.9, rotation: -10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 88, y: 4, scale: 0.8, rotation: 18 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 7, y: 34, scale: 0.7, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 93, y: 62, scale: 0.85, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 12, y: 94.5, scale: 0.85, rotation: -15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 88, y: 94, scale: 0.95, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 4, y: 14, scale: 0.9, rotation: -10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 34, y: 9, scale: 0.75, rotation: -12 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 66, y: 9, scale: 0.8, rotation: 10 },
        { stickerId: "star", src: "/stickers/star.svg", x: 96, y: 14, scale: 0.85, rotation: 15 },
        { stickerId: "y2k-star", src: "/stickers/y2k-star.svg", x: 95, y: 86, scale: 0.95, rotation: -10 },
      ],
    },
  },
  {
    id: "retro-smiley",
    name: "Retro Smiley",
    thaiName: "ยิ้มแฉ่งเรโทรสดใส",
    icon: "😊",
    badge: "สดใส",
    description: "หน้ายิ้มมีความสุข ดอกไม้ และแว่นกันแดด",
    previewIcons: ["/stickers/smile.svg", "/stickers/flower.svg"],
    stickers: {
      vertical: [
        { stickerId: "smile", src: "/stickers/smile.svg", x: 12, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 7, y: 34, scale: 0.8, rotation: 10 },
        { stickerId: "smile", src: "/stickers/smile.svg", x: 93, y: 64, scale: 0.85, rotation: -8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 12, y: 94.5, scale: 0.85, rotation: -15 },
        { stickerId: "smile", src: "/stickers/smile.svg", x: 88, y: 94, scale: 0.9, rotation: 8 },
      ],
      horizontal: [
        { stickerId: "smile", src: "/stickers/smile.svg", x: 4, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 34, y: 9, scale: 0.8, rotation: 6 },
        { stickerId: "smile", src: "/stickers/smile.svg", x: 66, y: 9, scale: 0.85, rotation: -6 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 96, y: 14, scale: 0.85, rotation: 12 },
        { stickerId: "smile", src: "/stickers/smile.svg", x: 95, y: 86, scale: 0.9, rotation: 8 },
      ],
    },
  },
  {
    id: "royal-princess",
    name: "Royal Princess",
    thaiName: "มงกุฎเจ้าหญิง & ปาร์ตี้",
    icon: "👑",
    description: "มงกุฎทองหรูหรา ริบบิ้น และกล้องถ่ายรูป",
    previewIcons: ["/stickers/crown.svg", "/stickers/camera.svg"],
    stickers: {
      vertical: [
        { stickerId: "crown", src: "/stickers/crown.svg", x: 14, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "camera", src: "/stickers/camera.svg", x: 7, y: 34, scale: 0.8, rotation: -10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 93, y: 64, scale: 0.75, rotation: 12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 87, y: 94, scale: 0.9, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "crown", src: "/stickers/crown.svg", x: 5, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "camera", src: "/stickers/camera.svg", x: 34, y: 9, scale: 0.8, rotation: -6 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 66, y: 9, scale: 0.75, rotation: 12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 95, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 95, y: 86, scale: 0.9, rotation: 8 },
      ],
    },
  },
  {
    id: "birthday-party",
    name: "Birthday Party",
    thaiName: "แฮปปี้เบิร์ธเดย์ปาร์ตี้",
    icon: "🎂",
    badge: "ปาร์ตี้",
    description: "เค้กวันเกิด ลูกโป่ง และมงกุฎฉลอง",
    previewIcons: ["/stickers/cake.svg", "/stickers/balloon.svg"],
    stickers: {
      vertical: [
        { stickerId: "balloon", src: "/stickers/balloon.svg", x: 12, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 7, y: 34, scale: 0.8, rotation: 8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 93, y: 64, scale: 0.75, rotation: -12 },
        { stickerId: "balloon", src: "/stickers/balloon.svg", x: 12, y: 94.5, scale: 0.85, rotation: -8 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "balloon", src: "/stickers/balloon.svg", x: 4, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "crown", src: "/stickers/crown.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 34, y: 9, scale: 0.8, rotation: 8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 66, y: 9, scale: 0.75, rotation: -12 },
        { stickerId: "balloon", src: "/stickers/balloon.svg", x: 96, y: 14, scale: 0.85, rotation: 12 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 95, y: 86, scale: 0.9, rotation: -8 },
      ],
    },
  },
  {
    id: "dreamy-rainbow",
    name: "Dreamy Rainbow",
    thaiName: "สายรุ้งในฝันดรีมมี่",
    icon: "🌈",
    badge: "สดใส",
    description: "สายรุ้งพาสเทล ดาวประกาย และผีเสื้อ",
    previewIcons: ["/stickers/rainbow.svg", "/stickers/butterfly.svg"],
    stickers: {
      vertical: [
        { stickerId: "rainbow", src: "/stickers/rainbow.svg", x: 13, y: 3.5, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 7, y: 34, scale: 0.8, rotation: 12 },
        { stickerId: "rainbow", src: "/stickers/rainbow.svg", x: 93, y: 64, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 12, y: 94.5, scale: 0.8, rotation: -15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "rainbow", src: "/stickers/rainbow.svg", x: 5, y: 14, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 34, y: 9, scale: 0.8, rotation: 12 },
        { stickerId: "rainbow", src: "/stickers/rainbow.svg", x: 66, y: 9, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 96, y: 14, scale: 0.8, rotation: -15 },
        { stickerId: "butterfly", src: "/stickers/butterfly.svg", x: 95, y: 86, scale: 0.9, rotation: 10 },
      ],
    },
  },
  {
    id: "lucky-clover",
    name: "Lucky Clover",
    thaiName: "โคลเวอร์นำโชค 4 แฉก",
    icon: "🍀",
    badge: "นำโชค",
    description: "ใบโคลเวอร์นำโชคสีเขียวพาสเทล",
    previewIcons: ["/stickers/clover.svg", "/stickers/sparkle.svg"],
    stickers: {
      vertical: [
        { stickerId: "clover", src: "/stickers/clover.svg", x: 12, y: 3.5, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 7, y: 34, scale: 0.75, rotation: 12 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 93, y: 64, scale: 0.8, rotation: -10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 12, y: 94.5, scale: 0.8, rotation: -12 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "clover", src: "/stickers/clover.svg", x: 4, y: 14, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 34, y: 9, scale: 0.75, rotation: 8 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 66, y: 9, scale: 0.8, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 96, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 95, y: 86, scale: 0.9, rotation: 10 },
      ],
    },
  },
  {
    id: "cafe-hopper",
    name: "Cafe Hopper",
    thaiName: "คาเฟ่ฮอปเปอร์ชิคๆ",
    icon: "☕️",
    badge: "มินิมอล",
    description: "กาแฟเทกอะเวย์ เชอร์รี่ และเค้กนุ่มฟู",
    previewIcons: ["/stickers/coffee.svg", "/stickers/cherry.svg"],
    stickers: {
      vertical: [
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 12, y: 3.5, scale: 0.85, rotation: -8 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 88, y: 4, scale: 0.8, rotation: 12 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 7, y: 34, scale: 0.75, rotation: 10 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 93, y: 64, scale: 0.8, rotation: -10 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 88, y: 94, scale: 0.9, rotation: 8 },
      ],
      horizontal: [
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 4, y: 14, scale: 0.85, rotation: -8 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 5, y: 86, scale: 0.8, rotation: 12 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 34, y: 9, scale: 0.75, rotation: 10 },
        { stickerId: "coffee", src: "/stickers/coffee.svg", x: 66, y: 9, scale: 0.8, rotation: -10 },
        { stickerId: "cherry", src: "/stickers/cherry.svg", x: 96, y: 14, scale: 0.85, rotation: -12 },
        { stickerId: "cake", src: "/stickers/cake.svg", x: 95, y: 86, scale: 0.9, rotation: 8 },
      ],
    },
  },
  {
    id: "baby-dino",
    name: "Baby Dino",
    thaiName: "ไดโนเสาร์จิ๋วสุดคิ้วท์",
    icon: "🦖",
    description: "ไดโนเสาร์ตัวเขียวน่ารักและใบไม้โคลเวอร์",
    previewIcons: ["/stickers/dino.svg", "/stickers/clover.svg"],
    stickers: {
      vertical: [
        { stickerId: "dino", src: "/stickers/dino.svg", x: 13, y: 3.5, scale: 0.9, rotation: -8 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 7, y: 34, scale: 0.75, rotation: 12 },
        { stickerId: "dino", src: "/stickers/dino.svg", x: 93, y: 64, scale: 0.85, rotation: 10 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 12, y: 94.5, scale: 0.8, rotation: -12 },
        { stickerId: "dino", src: "/stickers/dino.svg", x: 87, y: 94, scale: 0.95, rotation: -8 },
      ],
      horizontal: [
        { stickerId: "dino", src: "/stickers/dino.svg", x: 5, y: 14, scale: 0.9, rotation: -8 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "star", src: "/stickers/star.svg", x: 34, y: 9, scale: 0.75, rotation: 12 },
        { stickerId: "dino", src: "/stickers/dino.svg", x: 66, y: 9, scale: 0.85, rotation: 10 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 96, y: 14, scale: 0.8, rotation: -12 },
        { stickerId: "dino", src: "/stickers/dino.svg", x: 95, y: 86, scale: 0.95, rotation: -8 },
      ],
    },
  },
  {
    id: "cottage-core",
    name: "Cottagecore",
    thaiName: "เห็ดน้อยคอทเทจคอร์",
    icon: "🍄",
    description: "เห็ดแดงจุดขาว ดอกไม้ และความสงบในป่า",
    previewIcons: ["/stickers/mushroom.svg", "/stickers/flower.svg"],
    stickers: {
      vertical: [
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 12, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 88, y: 4, scale: 0.8, rotation: 12 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 7, y: 34, scale: 0.75, rotation: 8 },
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 93, y: 64, scale: 0.8, rotation: 12 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 88, y: 94, scale: 0.9, rotation: -8 },
      ],
      horizontal: [
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 4, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 5, y: 86, scale: 0.8, rotation: 12 },
        { stickerId: "clover", src: "/stickers/clover.svg", x: 34, y: 9, scale: 0.75, rotation: 8 },
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 66, y: 9, scale: 0.8, rotation: 12 },
        { stickerId: "flower", src: "/stickers/flower.svg", x: 96, y: 14, scale: 0.85, rotation: -12 },
        { stickerId: "mushroom", src: "/stickers/mushroom.svg", x: 95, y: 86, scale: 0.9, rotation: -8 },
      ],
    },
  },
  {
    id: "spooky-kawaii",
    name: "Spooky Kawaii",
    thaiName: "ผีน้อยกุ๊กกู๋ขี้เล่น",
    icon: "👻",
    description: "ผีน้อยน่ารัก ดาวประกาย และหัวใจ",
    previewIcons: ["/stickers/ghost.svg", "/stickers/sparkle.svg"],
    stickers: {
      vertical: [
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 13, y: 3.5, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 7, y: 34, scale: 0.75, rotation: 10 },
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 93, y: 64, scale: 0.85, rotation: 10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 12, y: 94.5, scale: 0.8, rotation: -12 },
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 87, y: 94, scale: 0.9, rotation: -8 },
      ],
      horizontal: [
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 5, y: 14, scale: 0.85, rotation: -8 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "heart", src: "/stickers/heart.svg", x: 34, y: 9, scale: 0.75, rotation: 10 },
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 66, y: 9, scale: 0.85, rotation: 10 },
        { stickerId: "sparkle", src: "/stickers/sparkle.svg", x: 96, y: 14, scale: 0.8, rotation: -12 },
        { stickerId: "ghost", src: "/stickers/ghost.svg", x: 95, y: 86, scale: 0.9, rotation: -8 },
      ],
    },
  },
  {
    id: "retro-gamer",
    name: "Retro Gamer",
    thaiName: "เกมเมอร์เรโทรย้อนยุค",
    icon: "🎮",
    badge: "พิกเซล",
    description: "จอยเกมพิกเซล สายฟ้า และแว่นกันแดด",
    previewIcons: ["/stickers/gameboy.svg", "/stickers/bolt.svg"],
    stickers: {
      vertical: [
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 13, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 7, y: 34, scale: 0.8, rotation: 8 },
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 93, y: 64, scale: 0.8, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 5, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 34, y: 9, scale: 0.8, rotation: 8 },
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 66, y: 9, scale: 0.8, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 96, y: 14, scale: 0.85, rotation: -12 },
        { stickerId: "gameboy", src: "/stickers/gameboy.svg", x: 95, y: 86, scale: 0.9, rotation: 10 },
      ],
    },
  },
  {
    id: "street-fire",
    name: "Street Fire",
    thaiName: "สตรีทไฟแรงสุดเท่",
    icon: "🔥",
    badge: "เท่จัด",
    description: "เปลวไฟ สายฟ้า และแว่นกันแดดสุดคูล",
    previewIcons: ["/stickers/flame.svg", "/stickers/bolt.svg"],
    stickers: {
      vertical: [
        { stickerId: "flame", src: "/stickers/flame.svg", x: 12, y: 3.5, scale: 0.85, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 88, y: 4, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 7, y: 34, scale: 0.8, rotation: 8 },
        { stickerId: "flame", src: "/stickers/flame.svg", x: 93, y: 64, scale: 0.8, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 12, y: 94.5, scale: 0.85, rotation: -12 },
        { stickerId: "flame", src: "/stickers/flame.svg", x: 88, y: 94, scale: 0.9, rotation: 12 },
      ],
      horizontal: [
        { stickerId: "flame", src: "/stickers/flame.svg", x: 4, y: 14, scale: 0.85, rotation: -10 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 5, y: 86, scale: 0.8, rotation: 15 },
        { stickerId: "shades", src: "/stickers/shades.svg", x: 34, y: 9, scale: 0.8, rotation: 6 },
        { stickerId: "flame", src: "/stickers/flame.svg", x: 66, y: 9, scale: 0.8, rotation: -8 },
        { stickerId: "bolt", src: "/stickers/bolt.svg", x: 96, y: 14, scale: 0.85, rotation: 12 },
        { stickerId: "flame", src: "/stickers/flame.svg", x: 95, y: 86, scale: 0.9, rotation: -10 },
      ],
    },
  },
  {
    id: "vintage-kiss",
    name: "Vintage Kiss",
    thaiName: "คิส & มิวสิกปาร์ตี้",
    icon: "💋",
    description: "รอยจูบสีแดง โน้ตดนตรี และโบว์วินเทจ",
    previewIcons: ["/stickers/lip.svg", "/stickers/music.svg"],
    stickers: {
      vertical: [
        { stickerId: "lip", src: "/stickers/lip.svg", x: 12, y: 3.5, scale: 0.85, rotation: -12 },
        { stickerId: "music", src: "/stickers/music.svg", x: 88, y: 4, scale: 0.8, rotation: 12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 7, y: 34, scale: 0.75, rotation: -10 },
        { stickerId: "lip", src: "/stickers/lip.svg", x: 93, y: 64, scale: 0.8, rotation: 8 },
        { stickerId: "music", src: "/stickers/music.svg", x: 12, y: 94.5, scale: 0.8, rotation: -15 },
        { stickerId: "lip", src: "/stickers/lip.svg", x: 88, y: 94, scale: 0.9, rotation: 10 },
      ],
      horizontal: [
        { stickerId: "lip", src: "/stickers/lip.svg", x: 4, y: 14, scale: 0.85, rotation: -12 },
        { stickerId: "music", src: "/stickers/music.svg", x: 5, y: 86, scale: 0.8, rotation: 12 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 34, y: 9, scale: 0.75, rotation: -8 },
        { stickerId: "lip", src: "/stickers/lip.svg", x: 66, y: 9, scale: 0.8, rotation: 8 },
        { stickerId: "ribbon", src: "/stickers/ribbon.svg", x: 96, y: 14, scale: 0.8, rotation: 12 },
        { stickerId: "lip", src: "/stickers/lip.svg", x: 95, y: 86, scale: 0.9, rotation: -10 },
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
