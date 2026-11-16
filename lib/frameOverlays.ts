import type {
  FrameConfig,
  LayoutOrientation,
  ShotCount,
  SlotRect,
} from "@/types/photobooth";

const HEART_CUTOUT_PATH =
  "M50 85C50 85 5 57 5 27C5 12 16 2 30 2C39 2 46 7 50 14C54 7 61 2 70 2C84 2 95 12 95 27C95 57 50 85 50 85Z";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderSlotMaskCutout(slot: SlotRect): string {
  if (slot.shape === "heart") {
    const sx = (slot.width / 100).toFixed(4);
    const sy = (slot.height / 88).toFixed(4);
    return `<g transform="translate(${slot.x} ${slot.y}) scale(${sx} ${sy})"><path d="${HEART_CUTOUT_PATH}" fill="black" /></g>`;
  }
  return `<rect x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" rx="10" fill="black" />`;
}

function renderSlotStroke(slot: SlotRect, color: string, width = 3): string {
  if (slot.shape === "heart") {
    const sx = (slot.width / 100).toFixed(4);
    const sy = (slot.height / 88).toFixed(4);
    return `<g transform="translate(${slot.x} ${slot.y}) scale(${sx} ${sy})"><path d="${HEART_CUTOUT_PATH}" stroke="${color}" stroke-width="${width}" vector-effect="non-scaling-stroke" /></g>`;
  }
  return `<rect x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" rx="10" stroke="${color}" stroke-width="${width}" />`;
}

function buildClapperboardSvg(
  width: number,
  height: number,
  slots: SlotRect[],
  shots: ShotCount,
  orientation: LayoutOrientation
): string {
  const maskId = `cutouts-clapper-${orientation}-${shots}`;
  const cutsLabel = `${shots} CUT${shots > 1 ? "S" : ""}`;
  const cutouts = slots.map(renderSlotMaskCutout).join("");
  const borders = slots.map((s) => renderSlotStroke(s, "#27272a", 2)).join("");

  if (orientation === "vertical") {
    const sprocketYs: number[] = [];
    for (let y = 346; y <= height - 68; y += 62) {
      sprocketYs.push(y);
    }
    const leftHoles = sprocketYs
      .map((y) => `<rect x="18" y="${y}" width="26" height="32" rx="4" />`)
      .join("");
    const rightHoles = sprocketYs
      .map((y) => `<rect x="556" y="${y}" width="26" height="32" rx="4" />`)
      .join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="${maskId}">
      <rect width="${width}" height="${height}" fill="white" />
      ${cutouts}
    </mask>
  </defs>
  <rect width="${width}" height="${height}" rx="16" fill="#0d0e11" mask="url(#${maskId})" />
  <g transform="translate(22 18)">
    <rect x="0" y="0" width="556" height="68" rx="6" fill="#18191f" stroke="#d4d4d8" stroke-width="2" />
    <path d="M98 2H144L174 34L144 66H98L128 34L98 2Z" fill="#f8fafc" />
    <path d="M188 2H234L264 34L234 66H188L218 34L188 2Z" fill="#f8fafc" />
    <path d="M278 2H324L354 34L324 66H278L308 34L278 2Z" fill="#f8fafc" />
    <path d="M368 2H414L444 34L414 66H368L398 34L368 2Z" fill="#f8fafc" />
    <path d="M458 2H504L534 34L504 66H458L488 34L458 2Z" fill="#f8fafc" />
    <path d="M2 4C2 2 4 0 6 0H66L106 66H6C3 66 2 64 2 62V4Z" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2" />
    <circle cx="22" cy="18" r="5" fill="#71717a" />
    <circle cx="22" cy="50" r="5" fill="#71717a" />
    <circle cx="68" cy="50" r="5" fill="#71717a" />
    <rect x="0" y="76" width="556" height="224" rx="10" fill="#16181d" stroke="#52525b" stroke-width="2" />
    <text x="20" y="114" fill="#a1a1aa" font-size="20" font-weight="bold" font-family="sans-serif">TITLE</text>
    <text x="195" y="114" fill="#ffffff" font-size="22" font-weight="bold" font-family="sans-serif">PHOTOBOOTH PARTY</text>
    <line x1="16" y1="134" x2="540" y2="134" stroke="#71717a" stroke-width="2" />
    <text x="20" y="172" fill="#a1a1aa" font-size="20" font-weight="bold" font-family="sans-serif">DIRECTOR</text>
    <text x="195" y="172" fill="#ffffff" font-size="22" font-weight="bold" font-family="sans-serif">STUDIO</text>
    <line x1="16" y1="192" x2="540" y2="192" stroke="#71717a" stroke-width="2" />
    <text x="20" y="226" fill="#a1a1aa" font-size="18" font-weight="bold" font-family="sans-serif">DATE</text>
    <text x="166" y="226" fill="#a1a1aa" font-size="18" font-weight="bold" font-family="sans-serif">SCENE</text>
    <text x="415" y="226" fill="#a1a1aa" font-size="18" font-weight="bold" font-family="sans-serif">TAKE</text>
    <line x1="16" y1="242" x2="540" y2="242" stroke="#71717a" stroke-width="2" />
    <line x1="148" y1="242" x2="148" y2="294" stroke="#71717a" stroke-width="2" />
    <line x1="396" y1="242" x2="396" y2="294" stroke="#71717a" stroke-width="2" />
    <text x="82" y="278" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="bold" font-family="monospace">2026</text>
    <text x="272" y="278" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="bold" font-family="sans-serif">${cutsLabel}</text>
    <text x="468" y="278" text-anchor="middle" fill="#38bdf8" font-size="24" font-weight="bold" font-family="monospace">01</text>
  </g>
  <g fill="#f4f4f5">${leftHoles}${rightHoles}</g>
  ${borders}
  <text x="300" y="${height - 26}" text-anchor="middle" fill="#a1a1aa" font-size="16" font-weight="bold" letter-spacing="4" font-family="monospace">SCENE • TAKE • ACTION</text>
</svg>`;
  }

  // แนวนอน (Horizontal): แผงสเลทหนังด้านซ้าย + ช่องฟิล์มรูฟิล์มด้านขวา
  const holeXs: number[] = [];
  for (let x = 324; x <= width - 54; x += 56) {
    holeXs.push(x);
  }
  const topHoles = holeXs
    .map((x) => `<rect x="${x}" y="22" width="30" height="24" rx="4" />`)
    .join("");
  const bottomHoles = holeXs
    .map((x) => `<rect x="${x}" y="${height - 46}" width="30" height="24" rx="4" />`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <defs>
    <mask id="${maskId}">
      <rect width="${width}" height="${height}" fill="white" />
      ${cutouts}
    </mask>
  </defs>
  <rect width="${width}" height="${height}" rx="18" fill="#0d0e11" mask="url(#${maskId})" />
  <g transform="translate(22 22)">
    <rect x="0" y="0" width="268" height="62" rx="6" fill="#18191f" stroke="#d4d4d8" stroke-width="2" />
    <path d="M74 2H112L134 31L112 60H74L96 31L74 2Z" fill="#f8fafc" />
    <path d="M132 2H170L192 31L170 60H132L154 31L132 2Z" fill="#f8fafc" />
    <path d="M190 2H228L250 31L228 60H190L212 31L190 2Z" fill="#f8fafc" />
    <path d="M2 4C2 2 4 0 6 0H54L82 60H6C3 60 2 58 2 56V4Z" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2" />
    <circle cx="18" cy="16" r="4" fill="#71717a" />
    <circle cx="18" cy="46" r="4" fill="#71717a" />
    <circle cx="54" cy="46" r="4" fill="#71717a" />
    <rect x="0" y="74" width="268" height="462" rx="10" fill="#16181d" stroke="#52525b" stroke-width="2" />
    <text x="18" y="114" fill="#a1a1aa" font-size="15" font-weight="bold" font-family="sans-serif">TITLE</text>
    <text x="18" y="144" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif">PHOTOBOOTH</text>
    <line x1="14" y1="166" x2="254" y2="166" stroke="#71717a" stroke-width="2" />
    <text x="18" y="204" fill="#a1a1aa" font-size="15" font-weight="bold" font-family="sans-serif">DIRECTOR</text>
    <text x="18" y="234" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif">STUDIO</text>
    <line x1="14" y1="256" x2="254" y2="256" stroke="#71717a" stroke-width="2" />
    <text x="18" y="294" fill="#a1a1aa" font-size="15" font-weight="bold" font-family="sans-serif">DATE</text>
    <text x="18" y="324" fill="#ffffff" font-size="20" font-weight="bold" font-family="monospace">2026</text>
    <line x1="14" y1="346" x2="254" y2="346" stroke="#71717a" stroke-width="2" />
    <text x="18" y="384" fill="#a1a1aa" font-size="15" font-weight="bold" font-family="sans-serif">SCENE</text>
    <text x="164" y="384" fill="#a1a1aa" font-size="15" font-weight="bold" font-family="sans-serif">TAKE</text>
    <line x1="144" y1="364" x2="144" y2="442" stroke="#71717a" stroke-width="2" />
    <text x="18" y="422" fill="#ffffff" font-size="21" font-weight="bold" font-family="sans-serif">${cutsLabel}</text>
    <text x="164" y="424" fill="#38bdf8" font-size="24" font-weight="bold" font-family="monospace">01</text>
    <line x1="14" y1="454" x2="254" y2="454" stroke="#52525b" stroke-width="2" />
    <text x="134" y="498" text-anchor="middle" fill="#a1a1aa" font-size="13" font-weight="bold" letter-spacing="2" font-family="monospace">SCENE • TAKE • ACTION</text>
  </g>
  <g fill="#f4f4f5">${topHoles}${bottomHoles}</g>
  ${borders}
</svg>`;
}

function buildThemedOverlaySvg(
  frame: FrameConfig,
  shots: ShotCount,
  orientation: LayoutOrientation
): string {
  const { id, name, backgroundColor, accentColor, labelText, canvasWidth, canvasHeight, slots } =
    frame;

  if (id === "clapperboard-4cut") {
    return buildClapperboardSvg(
      canvasWidth,
      canvasHeight,
      slots,
      shots,
      orientation
    );
  }

  const maskId = `cutouts-${id}-${orientation}-${shots}`;
  const cutouts = slots.map(renderSlotMaskCutout).join("");
  const borders = slots.map((s) => renderSlotStroke(s, accentColor, 3)).join("");

  let decor = "";
  if (id === "noir-film-4cut") {
    if (orientation === "vertical") {
      const holes: string[] = [];
      for (let y = 60; y <= canvasHeight - 90; y += 68) {
        holes.push(`<rect x="14" y="${y}" width="20" height="32" rx="4" />`);
        holes.push(`<rect x="${canvasWidth - 34}" y="${y}" width="20" height="32" rx="4" />`);
      }
      decor = `<g fill="#2b2e36" stroke="#3f434e" stroke-width="1">${holes.join("")}</g>`;
    } else {
      const holes: string[] = [];
      for (let x = 50; x <= canvasWidth - 70; x += 64) {
        holes.push(`<rect x="${x}" y="14" width="32" height="18" rx="4" />`);
        holes.push(`<rect x="${x}" y="${canvasHeight - 32}" width="32" height="18" rx="4" />`);
      }
      decor = `<g fill="#2b2e36" stroke="#3f434e" stroke-width="1">${holes.join("")}</g>`;
    }
  } else if (id === "cyber-hud-4cut") {
    decor = `<rect x="16" y="16" width="${canvasWidth - 32}" height="${canvasHeight - 32}" rx="14" stroke="#22d3ee" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="14 8" />
    <circle cx="${canvasWidth - 52}" cy="34" r="6" fill="#f43f5e" />
    <text x="${canvasWidth - 66}" y="39" text-anchor="end" fill="#22d3ee" font-size="14" font-weight="bold" font-family="monospace">REC</text>`;
  } else if (id === "street-navy-4cut") {
    decor = `<rect x="16" y="16" width="${canvasWidth - 32}" height="${canvasHeight - 32}" rx="16" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="3" />
    <path d="M24 28H92M24 38H68" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />`;
  } else if (frame.category === "event") {
    decor = `<circle cx="32" cy="30" r="7" fill="${accentColor}" />
    <circle cx="${canvasWidth - 34}" cy="30" r="7" fill="#f472b6" />
    <circle cx="72" cy="24" r="5" fill="#38bdf8" />
    <circle cx="${canvasWidth - 76}" cy="24" r="5" fill="#a78bfa" />
    <rect x="14" y="14" width="${canvasWidth - 28}" height="${canvasHeight - 28}" rx="18" stroke="${accentColor}" stroke-opacity="0.45" stroke-width="3" />`;
  } else if (frame.category === "cute") {
    decor = `<text x="32" y="34" fill="${accentColor}" font-size="20" font-weight="bold" font-family="sans-serif">♡</text>
    <text x="${canvasWidth - 32}" y="34" text-anchor="end" fill="${accentColor}" font-size="20" font-weight="bold" font-family="sans-serif">✿</text>
    <rect x="14" y="14" width="${canvasWidth - 28}" height="${canvasHeight - 28}" rx="18" stroke="${accentColor}" stroke-opacity="0.35" stroke-width="2" />`;
  } else {
    decor = `<rect x="16" y="16" width="${canvasWidth - 32}" height="${canvasHeight - 32}" rx="16" stroke="${accentColor}" stroke-opacity="0.35" stroke-width="2" />`;
  }

  const footerY = canvasHeight - 26;
  const safeName = escapeXml(name.toUpperCase());
  const safeLabel = escapeXml(labelText);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}" fill="none">
  <defs>
    <mask id="${maskId}">
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="white" />
      ${cutouts}
    </mask>
  </defs>
  <rect width="${canvasWidth}" height="${canvasHeight}" rx="20" fill="${backgroundColor}" mask="url(#${maskId})" />
  ${decor}
  ${borders}
  <text x="42" y="${footerY}" fill="${accentColor}" font-size="24" font-weight="bold" letter-spacing="2" font-family="sans-serif">${safeName}</text>
  <text x="${canvasWidth - 42}" y="${footerY}" text-anchor="end" fill="${accentColor}" font-size="20" font-weight="bold" letter-spacing="2" font-family="monospace">${safeLabel}</text>
</svg>`;
}

export function createAdaptedFrameOverlay(
  frame: FrameConfig,
  shots: ShotCount,
  orientation: LayoutOrientation
): string {
  return toSvgDataUri(buildThemedOverlaySvg(frame, shots, orientation));
}
