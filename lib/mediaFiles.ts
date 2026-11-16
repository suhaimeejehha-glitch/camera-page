import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const EXPORT_DIR = path.join(os.tmpdir(), "studio-booth-exports");
const EXPORT_TTL_MS = 30 * 60 * 1000; // เก็บไฟล์ชั่วคราว 30 นาที
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_-]{6,48}\.(png|gif)$/;

async function cleanupExpiredExports() {
  try {
    const files = await readdir(EXPORT_DIR);
    const now = Date.now();
    await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(EXPORT_DIR, file);
        const info = await stat(fullPath);
        if (now - info.mtimeMs > EXPORT_TTL_MS) {
          await unlink(fullPath);
        }
      })
    );
  } catch {
    // ข้ามถ้าโฟลเดอร์ยังไม่มีหรือลบไม่ได้
  }
}

export async function saveExportFile(
  filename: string,
  bytes: Uint8Array
): Promise<void> {
  if (!SAFE_FILENAME_REGEX.test(filename)) {
    throw new Error("Invalid export filename");
  }
  await mkdir(EXPORT_DIR, { recursive: true });
  await cleanupExpiredExports();
  await writeFile(path.join(EXPORT_DIR, filename), bytes);
}

export async function loadExportFile(filename: string): Promise<Buffer | null> {
  if (!SAFE_FILENAME_REGEX.test(filename)) {
    return null;
  }
  try {
    return await readFile(path.join(EXPORT_DIR, filename));
  } catch {
    return null;
  }
}
