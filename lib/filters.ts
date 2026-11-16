export interface PhotoTone {
  id: string;
  name: string;
  labelEn: string;
  cssFilter: string;
  previewColor: string;
}

export const PHOTO_TONES: PhotoTone[] = [
  {
    id: "normal",
    name: "ปกติ",
    labelEn: "Original",
    cssFilter: "none",
    previewColor: "#e4e4e7",
  },
  {
    id: "bright",
    name: "ไบรท์ใส",
    labelEn: "Bright",
    cssFilter: "brightness(1.08) contrast(1.05) saturate(1.1)",
    previewColor: "#fef08a",
  },
  {
    id: "warm",
    name: "วอร์มฟิล์ม",
    labelEn: "Warm",
    cssFilter: "sepia(0.22) contrast(1.08) brightness(1.04) saturate(1.15)",
    previewColor: "#fed7aa",
  },
  {
    id: "cool",
    name: "คูลพาสเทล",
    labelEn: "Cool",
    cssFilter: "contrast(1.05) brightness(1.06) saturate(0.95) hue-rotate(8deg)",
    previewColor: "#bae6fd",
  },
  {
    id: "vintage",
    name: "วินเทจ 90s",
    labelEn: "Vintage",
    cssFilter: "sepia(0.38) contrast(1.15) brightness(0.96) saturate(1.2)",
    previewColor: "#d97706",
  },
  {
    id: "bw",
    name: "ขาวดำ",
    labelEn: "B&W",
    cssFilter: "grayscale(1) contrast(1.2) brightness(1.05)",
    previewColor: "#a1a1aa",
  },
  {
    id: "noir",
    name: "ฟิล์มนัวร์",
    labelEn: "Noir 400",
    cssFilter: "grayscale(1) contrast(1.45) brightness(0.92)",
    previewColor: "#52525b",
  },
  {
    id: "cyber",
    name: "มูดี้ป๊อป",
    labelEn: "Moody",
    cssFilter: "contrast(1.18) saturate(1.25) brightness(1.02) hue-rotate(-12deg)",
    previewColor: "#f43f5e",
  },
];
