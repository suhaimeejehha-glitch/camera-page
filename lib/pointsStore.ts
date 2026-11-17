// ไฟล์: lib/pointsStore.ts
/**
 * Mock Store สำหรับจัดการแต้มสมาชิก (Points / Stamps) บน LocalStorage
 * เมื่อเชื่อมต่อ Supabase จริง จะเปลี่ยนฟังก์ชันเหล่านี้ให้เรียก API แทนได้ทันที
 */

export interface MemberPointsData {
  phone: string;
  points: number; // 0 - 10 (เมื่อครบ 10 สามารถแลกถ่ายฟรีได้)
  totalVisits: number; // จำนวนครั้งที่เคยถ่ายทั้งหมด
  redeemedCount: number; // จำนวนครั้งที่เคยแลกฟรีไปแล้ว
  lastVisit: string;
}

const STORAGE_PREFIX = "photobooth_points_";

export function getMemberPoints(phone: string): MemberPointsData {
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
    // ข้ามถ้าอ่าน storage ไม่ได้
  }

  return {
    phone,
    points: 0,
    totalVisits: 0,
    redeemedCount: 0,
    lastVisit: new Date().toISOString(),
  };
}

export function addMemberPoint(phone: string): {
  data: MemberPointsData;
  isRedeemable: boolean;
  isFirstTime: boolean;
} {
  const current = getMemberPoints(phone);
  const isFirstTime = current.totalVisits === 0;

  // เพิ่มแต้ม (+1)
  const nextPoints = current.points + 1;
  const nextVisits = current.totalVisits + 1;

  const updated: MemberPointsData = {
    phone,
    points: nextPoints,
    totalVisits: nextVisits,
    redeemedCount: current.redeemedCount,
    lastVisit: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${phone}`, JSON.stringify(updated));
  } catch {
    // ข้ามถ้าบันทึกไม่ได้
  }

  return {
    data: updated,
    isRedeemable: nextPoints >= 10,
    isFirstTime,
  };
}

export function redeemMemberPoints(phone: string): {
  success: boolean;
  data: MemberPointsData;
  message: string;
} {
  const current = getMemberPoints(phone);

  if (current.points < 10) {
    return {
      success: false,
      data: current,
      message: `เบอร์นี้มี ${current.points}/10 แต้ม (ยังไม่ครบ 10 แต้ม)`,
    };
  }

  // หักออก 10 แต้ม
  const updated: MemberPointsData = {
    ...current,
    points: current.points - 10,
    redeemedCount: current.redeemedCount + 1,
    lastVisit: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${phone}`, JSON.stringify(updated));
  } catch {
    // ข้าม
  }

  return {
    success: true,
    data: updated,
    message: "ใช้สิทธิ์ถ่ายฟรี 1 ครั้งสำเร็จ! (หัก 10 แต้ม)",
  };
}

/** ฟังก์ชันพิเศษสำหรับทดสอบ: ตั้งแต้มเป็น 10 ทันที เพื่อทดสอบการแลกฟรี */
export function setTestMemberPoints(phone: string, points: number = 10): MemberPointsData {
  const current = getMemberPoints(phone);
  const updated: MemberPointsData = {
    ...current,
    phone,
    points,
    totalVisits: Math.max(current.totalVisits, points),
    lastVisit: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${phone}`, JSON.stringify(updated));
  } catch {}

  return updated;
}
