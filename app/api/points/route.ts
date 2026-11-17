import { NextRequest, NextResponse } from "next/server";
import { getMember, addStamp, redeemStamp, setTestPoints } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const member = await getMember(phone);
    return NextResponse.json({
      success: true,
      member: member
        ? {
            phone: member.phone,
            points: member.points,
            totalVisits: member.total_visits,
            redeemedCount: member.redeemed_count,
            lastVisit: member.last_visit,
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/points error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, points } = body;

    if (!phone || typeof phone !== "string" || phone.length < 9) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง" },
        { status: 400 }
      );
    }

    if (action === "earn") {
      const result = await addStamp(phone);
      return NextResponse.json({
        success: true,
        data: {
          phone: result.member.phone,
          points: result.member.points,
          totalVisits: result.member.total_visits,
          redeemedCount: result.member.redeemed_count,
          lastVisit: result.member.last_visit,
        },
        isFirstTime: result.isFirstTime,
        isRedeemable: result.isRedeemable,
      });
    }

    if (action === "redeem") {
      const result = await redeemStamp(phone);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          phone: result.member.phone,
          points: result.member.points,
          totalVisits: result.member.total_visits,
          redeemedCount: result.member.redeemed_count,
          lastVisit: result.member.last_visit,
        },
      });
    }

    if (action === "set_test") {
      const pts = typeof points === "number" ? points : 10;
      const member = await setTestPoints(phone, pts);
      return NextResponse.json({
        success: true,
        data: {
          phone: member.phone,
          points: member.points,
          totalVisits: member.total_visits,
          redeemedCount: member.redeemed_count,
          lastVisit: member.last_visit,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/points error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
