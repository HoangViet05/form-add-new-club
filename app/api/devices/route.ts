import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Club } from "@/models/Club";
import { Camera } from "@/models/Camera";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubName, rtspURL, branchId, scoreboardId, tableCorners } = body;

    if (!clubName || !rtspURL || !branchId || !scoreboardId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Tạo club trước
    const club = await Club.create({
      name: clubName,
      branchId,
      description: "Chi nhánh chính của Arena Billiard",
      workerId: "",
      type: "business",
      phone: "",
    });

    // 2. Tạo camera với clubId lấy từ club vừa tạo
    const camera = await Camera.create({
      name: clubName,
      clubId: club._id,
      rtspUrl: rtspURL,
      scoreboardId,
      cameraChannel: 201,
      port: 1555,
      username: "admin",
      password: "",
      domain: "",
      tableCorners: tableCorners ?? [
        [176, 167],
        [1711, 168],
        [1717, 940],
        [172, 940],
      ],
    });

    return NextResponse.json({ success: true, club, camera }, { status: 201 });
  } catch (err) {
    console.error("POST /api/devices error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
