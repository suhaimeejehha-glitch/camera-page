// ไฟล์: lib/pointsStore.ts
/**
 * Points Store สำหรับจัดการแต้มสมาชิก (Points / Stamps)
 * เชื่อมต่อ Neon Database (PostgreSQL) ผ่าน /api/points
 * พร้อม Fallback สู่ LocalStorage อัตโนมัติหากออฟไลน์หรือเน็ตมีปัญหา
 */

export interface MemberPointsData {
  phone: string;
  points: number; // 0 - 10 (เมื่อครบ 10 สามารถแลกถ่ายฟรีได้)
  totalVisits: number; // จำนวนครั้งที่เคยถ่ายทั้งหมด
  redeemedCount: number; // จำนวนครั้งที่เคยแลกฟรีไปแล้ว
  lastVisit: string;
}

const STORAGE_PREFIX = "photobooth_points_";

/** อ่านจาก LocalStorage โดยตรง (Sync Fallback / Local Cache) */
export function getLocalMemberPoints(phone: string): MemberPointsData {
  if (typeof window === "undefined") {
    return {
      phone,
      points: 0,
      totalVisits: 0,
      redeemedCount: 0,
      lastVisit: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${phone}`);
    if (raw) {
      return JSON.parse(raw) as MemberPointsData;
    }
  } catch {
    // ข้าม
  }

  return {
    phone,
    points: 0,
    totalVisits: 0,
    redeemedCount: 0,
    lastVisit: new Date().toISOString(),
  };
}

/** บันทึกลง LocalStorage (Local Cache) */
export function saveLocalMemberPoints(data: MemberPointsData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${data.phone}`, JSON.stringify(data));
  } catch {
    // ข้าม
  }
}

/** ดึงข้อมูลสมาชิก (เรียก Neon API -> Fallback LocalStorage) */
export async function getMemberPoints(phone: string): Promise<MemberPointsData> {
  try {
    const res = await fetch(`/api/points?phone=${encodeURIComponent(phone)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.member) {
        saveLocalMemberPoints(json.member);
        return json.member;
      }
    }
  } catch (err) {
    console.warn("Neon API unreachable, using local points data:", err);
  }

  return getLocalMemberPoints(phone);
}

/** สะสมแต้มสมาชิก (+1 แต้ม) ผ่าน Neon API */
export async function addMemberPoint(phone: string): Promise<{
  data: MemberPointsData;
  isRedeemable: boolean;
  isFirstTime: boolean;
}> {
  try {
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "earn", phone }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveLocalMemberPoints(json.data);
        return {
          data: json.data,
          isRedeemable: json.isRedeemable,
          isFirstTime: json.isFirstTime,
        };
      }
    }
  } catch (err) {
    console.warn("Neon API earn failed, falling back to local:", err);
  }

  // Fallback: LocalStorage
  const current = getLocalMemberPoints(phone);
  const isFirstTime = current.totalVisits === 0;
  const nextPoints = current.points + 1;
  const nextVisits = current.totalVisits + 1;

  const updated: MemberPointsData = {
    phone,
    points: nextPoints,
    totalVisits: nextVisits,
    redeemedCount: current.redeemedCount,
    lastVisit: new Date().toISOString(),
  };

  saveLocalMemberPoints(updated);

  return {
    data: updated,
    isRedeemable: nextPoints >= 10,
    isFirstTime,
  };
}

/** แลกสิทธิ์ถ่ายฟรี 1 ครั้ง (หัก 10 แต้ม) ผ่าน Neon API */
export async function redeemMemberPoints(phone: string): Promise<{
  success: boolean;
  data: MemberPointsData;
  message: string;
}> {
  try {
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem", phone }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveLocalMemberPoints(json.data);
      }
      return {
        success: !!json.success,
        data: json.data || getLocalMemberPoints(phone),
        message: json.message || (json.success ? "ใช้สิทธิ์ถ่ายฟรีสำเร็จ!" : "แต้มไม่เพียงพอ"),
      };
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.message) {
        return {
          success: false,
          data: getLocalMemberPoints(phone),
          message: errJson.message,
        };
      }
    }
  } catch (err) {
    console.warn("Neon API redeem failed, falling back to local:", err);
  }

  // Fallback: LocalStorage
  const current = getLocalMemberPoints(phone);
  if (current.points < 10) {
    return {
      success: false,
      data: current,
      message: `เบอร์นี้มี ${current.points}/10 แต้ม (ยังไม่ครบ 10 แต้ม)`,
    };
  }

  const updated: MemberPointsData = {
    ...current,
    points: current.points - 10,
    redeemedCount: current.redeemedCount + 1,
    lastVisit: new Date().toISOString(),
  };

  saveLocalMemberPoints(updated);

  return {
    success: true,
    data: updated,
    message: "ใช้สิทธิ์ถ่ายฟรี 1 ครั้งสำเร็จ! (หัก 10 แต้ม)",
  };
}

/** ฟังก์ชันพิเศษสำหรับทดสอบ: ตั้งแต้มเป็น 10 ทันที เพื่อทดสอบการแลกฟรี */
export async function setTestMemberPoints(
  phone: string,
  points: number = 10
): Promise<MemberPointsData> {
  try {
    const res = await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_test", phone, points }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveLocalMemberPoints(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn("Neon API set_test failed, falling back to local:", err);
  }

  const current = getLocalMemberPoints(phone);
  const updated: MemberPointsData = {
    ...current,
    phone,
    points,
    totalVisits: Math.max(current.totalVisits, points),
    lastVisit: new Date().toISOString(),
  };

  saveLocalMemberPoints(updated);
  return updated;
}
