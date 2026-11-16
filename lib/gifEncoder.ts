export interface GifFrameInput {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * สร้าง Global Color Table 256 สี: 6x6x6 RGB cube (0..215) + 40 เฉดเทา (216..255)
 */
function buildGlobalColorTable(): Uint8Array {
  const table = new Uint8Array(256 * 3);
  let idx = 0;
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        table[idx++] = Math.round((r * 255) / 5);
        table[idx++] = Math.round((g * 255) / 5);
        table[idx++] = Math.round((b * 255) / 5);
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i * 255) / 39);
    table[idx++] = v;
    table[idx++] = v;
    table[idx++] = v;
  }
  return table;
}

const GLOBAL_PALETTE = buildGlobalColorTable();

function quantizeFrameToIndices(frame: GifFrameInput): Uint8Array {
  const { width, height, rgba } = frame;
  const indices = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const bayerRow = BAYER_4X4[y & 3];
    for (let x = 0; x < width; x++) {
      const p = (rowOffset + x) * 4;
      const dither = (bayerRow[x & 3] / 16 - 0.5) * 32;

      const r = Math.min(255, Math.max(0, rgba[p] + dither));
      const g = Math.min(255, Math.max(0, rgba[p + 1] + dither));
      const b = Math.min(255, Math.max(0, rgba[p + 2] + dither));

      const ri = Math.min(5, Math.max(0, Math.round((r * 5) / 255)));
      const gi = Math.min(5, Math.max(0, Math.round((g * 5) / 255)));
      const bi = Math.min(5, Math.max(0, Math.round((b * 5) / 255)));

      indices[rowOffset + x] = ri * 36 + gi * 6 + bi;
    }
  }

  return indices;
}

function lzwEncode(indices: Uint8Array, minCodeSize = 8): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  const out: number[] = [];
  let currentByte = 0;
  let bitCount = 0;

  const writeBits = (code: number, size: number) => {
    currentByte |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      out.push(currentByte & 0xff);
      currentByte >>>= 8;
      bitCount -= 8;
    }
  };

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let dict = new Map<number, number>();

  const resetDict = () => {
    dict = new Map<number, number>();
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  writeBits(clearCode, codeSize);
  resetDict();

  if (indices.length === 0) {
    writeBits(eoiCode, codeSize);
    if (bitCount > 0) out.push(currentByte & 0xff);
    return new Uint8Array(out);
  }

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 12) | k;
    const existing = dict.get(key);

    if (existing !== undefined) {
      prefix = existing;
    } else {
      writeBits(prefix, codeSize);

      if (nextCode < 4096) {
        dict.set(key, nextCode);
        nextCode += 1;
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize += 1;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetDict();
      }

      prefix = k;
    }
  }

  writeBits(prefix, codeSize);
  writeBits(eoiCode, codeSize);
  if (bitCount > 0) {
    out.push(currentByte & 0xff);
  }

  return new Uint8Array(out);
}

function writeSubBlocks(target: number[], data: Uint8Array) {
  let offset = 0;
  while (offset < data.length) {
    const size = Math.min(255, data.length - offset);
    target.push(size);
    for (let i = 0; i < size; i++) {
      target.push(data[offset + i]);
    }
    offset += size;
  }
  target.push(0);
}

/**
 * เข้ารหัสชุดเฟรมภาพเป็นไฟล์ภาพเคลื่อนไหว GIF89a (.gif) แบบวนลูปไม่รู้จบ
 * @param delayCs ระยะเวลาแสดงต่อเฟรม (หน่วย 1/100 วินาที เช่น 18 = 180ms)
 */
export function encodeAnimatedGif(
  frames: GifFrameInput[],
  delayCs = 20
): Uint8Array {
  if (frames.length === 0) {
    throw new Error("No frames to encode");
  }

  const { width, height } = frames[0];
  const bytes: number[] = [];

  // Header: GIF89a
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

  // Logical Screen Descriptor
  bytes.push(
    width & 0xff,
    (width >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
    0xf7, // Global Color Table (256 colors)
    0x00,
    0x00
  );

  // Global Color Table (768 bytes)
  for (let i = 0; i < GLOBAL_PALETTE.length; i++) {
    bytes.push(GLOBAL_PALETTE[i]);
  }

  // Netscape 2.0 Infinite Loop Application Extension
  bytes.push(
    0x21,
    0xff,
    0x0b,
    0x4e,
    0x45,
    0x54,
    0x53,
    0x43,
    0x41,
    0x50,
    0x45,
    0x32,
    0x2e,
    0x30,
    0x03,
    0x01,
    0x00,
    0x00,
    0x00
  );

  const clampedDelay = Math.max(4, Math.min(65535, Math.round(delayCs)));

  for (const frame of frames) {
    // Graphic Control Extension
    bytes.push(
      0x21,
      0xf9,
      0x04,
      0x04,
      clampedDelay & 0xff,
      (clampedDelay >> 8) & 0xff,
      0x00,
      0x00
    );

    // Image Descriptor
    bytes.push(
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      width & 0xff,
      (width >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
      0x00
    );

    // LZW Image Data
    bytes.push(0x08);
    const indices = quantizeFrameToIndices(frame);
    const compressed = lzwEncode(indices, 8);
    writeSubBlocks(bytes, compressed);
  }

  // GIF Trailer
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}
