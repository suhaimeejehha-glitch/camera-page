import { neon } from "@neondatabase/serverless";

export interface MemberRecord {
  phone: string;
  points: number;
  total_visits: number;
  redeemed_count: number;
  last_visit: string;
  created_at: string;
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(databaseUrl);
}

/** ดึงข้อมูลสมาชิกจากเบอร์โทร */
export async function getMember(phone: string): Promise<MemberRecord | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT phone, points, total_visits, redeemed_count, last_visit, created_at
    FROM members
    WHERE phone = ${phone}
    LIMIT 1;
  `;

  if (rows.length === 0) return null;
  return rows[0] as MemberRecord;
}

/** สะสมแต้มสมาชิก (+1 แต้ม) */
export async function addStamp(phone: string): Promise<{
  member: MemberRecord;
  isFirstTime: boolean;
  isRedeemable: boolean;
}> {
  const sql = getSql();

  // ตรวจสอบว่าเคยมีข้อมูลสมาชิกนี้หรือยัง
  const existing = await getMember(phone);
  const isFirstTime = !existing;

  // Insert หรือ Update สมาชิก
  const rows = await sql`
    INSERT INTO members (phone, points, total_visits, redeemed_count, last_visit)
    VALUES (${phone}, 1, 1, 0, NOW())
    ON CONFLICT (phone)
    DO UPDATE SET
      points = members.points + 1,
      total_visits = members.total_visits + 1,
      last_visit = NOW()
    RETURNING phone, points, total_visits, redeemed_count, last_visit, created_at;
  `;

  const updated = rows[0] as MemberRecord;

  // บันทึกลง stamp_logs
  await sql`
    INSERT INTO stamp_logs (phone, action, points_change, current_points, note)
    VALUES (${phone}, 'earn', 1, ${updated.points}, 'สแกนชำระเงินและสะสมแต้มสำเร็จ');
  `;

  return {
    member: updated,
    isFirstTime,
    isRedeemable: updated.points >= 10,
  };
}

/** แลกสิทธิ์ถ่ายฟรี 1 ครั้ง (หัก 10 แต้ม) */
export async function redeemStamp(phone: string): Promise<{
  success: boolean;
  message: string;
  member: MemberRecord;
}> {
  const sql = getSql();
  const current = await getMember(phone);

  if (!current || current.points < 10) {
    const pts = current?.points ?? 0;
    return {
      success: false,
      message: `เบอร์นี้มี ${pts}/10 แต้ม (ยังไม่ครบ 10 แต้ม)`,
      member: current || {
        phone,
        points: 0,
        total_visits: 0,
        redeemed_count: 0,
        last_visit: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    };
  }

  // หัก 10 แต้ม และเพิ่ม redeemed_count + 1
  const rows = await sql`
    UPDATE members
    SET
      points = points - 10,
      redeemed_count = redeemed_count + 1,
      last_visit = NOW()
    WHERE phone = ${phone} AND points >= 10
    RETURNING phone, points, total_visits, redeemed_count, last_visit, created_at;
  `;

  if (rows.length === 0) {
    return {
      success: false,
      message: "แต้มไม่เพียงพอสำหรับการแลกถ่ายฟรี",
      member: current,
    };
  }

  const updated = rows[0] as MemberRecord;

  // บันทึกลง stamp_logs
  await sql`
    INSERT INTO stamp_logs (phone, action, points_change, current_points, note)
    VALUES (${phone}, 'redeem', -10, ${updated.points}, 'แลกสิทธิ์ถ่ายฟรี 1 ครั้ง');
  `;

  return {
    success: true,
    message: "ใช้สิทธิ์ถ่ายฟรี 1 ครั้งสำเร็จ! (หัก 10 แต้ม)",
    member: updated,
  };
}

/** ฟังก์ชันสำหรับทดสอบ (ปรับแต้มตามต้องการ) */
export async function setTestPoints(phone: string, points: number): Promise<MemberRecord> {
  const sql = getSql();

  const rows = await sql`
    INSERT INTO members (phone, points, total_visits, redeemed_count, last_visit)
    VALUES (${phone}, ${points}, ${points}, 0, NOW())
    ON CONFLICT (phone)
    DO UPDATE SET
      points = ${points},
      total_visits = GREATEST(members.total_visits, ${points}),
      last_visit = NOW()
    RETURNING phone, points, total_visits, redeemed_count, last_visit, created_at;
  `;

  const updated = rows[0] as MemberRecord;

  await sql`
    INSERT INTO stamp_logs (phone, action, points_change, current_points, note)
    VALUES (${phone}, 'test_set', 0, ${updated.points}, 'ตั้งค่าแต้มเพื่อทดสอบ');
  `;

  return updated;
}
