import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Club } from "@/models/Club";
import { Camera } from "@/models/Camera";

export async function GET() {
  try {
    await connectDB();
    
    // Lấy tất cả cameras và populate thông tin club
    const cameras = await Camera.find()
      .populate("clubId")
      .sort({ _id: -1 })
      .limit(100);
    
    // Format dữ liệu để trả về
    const devices = cameras.map((camera: any) => ({
      _id: camera._id.toString(),
      clubName: camera.name,
      deviceId: camera.scoreboardId,
      rtspURL: camera.rtspUrl,
      branchId: camera.clubId?.branchId ?? "",
      scoreboardId: camera.scoreboardId,
      createdAt: camera.createdAt ?? new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, devices }, { status: 200 });
  } catch (err) {
    console.error("GET /api/devices error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
