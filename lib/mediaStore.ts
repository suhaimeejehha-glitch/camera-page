import type { PhotoShot } from "@/types/photobooth";

const DB_NAME = "studio_booth_media";
const STORE_NAME = "clips";
const FRAMES_KEY = "session_motion_frames";
const PHOTOS_KEY = "session_captured_photos";

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMotionFrames(frames: string[]): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(frames, FRAMES_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ข้ามถ้า browser ไม่รองรับ IndexedDB
  }
}

export async function loadMotionFrames(): Promise<string[]> {
  try {
    const db = await openMediaDb();
    const result = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(FRAMES_KEY);
      req.onsuccess = () =>
        resolve(Array.isArray(req.result) ? (req.result as string[]) : []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return [];
  }
}

export async function clearMotionFrames(): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(FRAMES_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ข้ามถ้าลบไม่สำเร็จ
  }
}

/**
 * บันทึกรูปถ่ายช็อตทั้งหมดลงใน IndexedDB เพื่อป้องกันปัญหา QuotaExceededError ของ sessionStorage บนมือถือ
 */
export async function saveSessionPhotos(photos: PhotoShot[]): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(photos, PHOTOS_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ข้ามถ้า browser ไม่รองรับ IndexedDB
  }
}

/**
 * ดึงรูปถ่ายช็อตทั้งหมดจาก IndexedDB
 */
export async function loadSessionPhotos(): Promise<PhotoShot[]> {
  try {
    const db = await openMediaDb();
    const result = await new Promise<PhotoShot[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(PHOTOS_KEY);
      req.onsuccess = () =>
        resolve(Array.isArray(req.result) ? (req.result as PhotoShot[]) : []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return [];
  }
}

/**
 * ล้างข้อมูลรูปถ่ายและคลิปทั้งหมดออกจาก IndexedDB
 */
export async function clearSessionPhotos(): Promise<void> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(PHOTOS_KEY);
      tx.objectStore(STORE_NAME).delete(FRAMES_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ข้ามถ้าลบไม่สำเร็จ
  }
}
