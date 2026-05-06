import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Camera } from "@/models/Camera";

// Lấy tên camera từ cameraId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get("cameraId");

    if (!cameraId) {
      return NextResponse.json(
        { error: "Missing cameraId parameter" },
        { status: 400 }
      );
    }

    await connectDB();

    const camera = await Camera.findById(cameraId);
    
    if (!camera) {
      return NextResponse.json(
        { error: "Camera not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      name: camera.name 
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/camera-name error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
