import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { QRCode } from "@/models/QRCode";
import { Camera } from "@/models/Camera";

// Lưu QR code mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cameraId, name, qrImageBase64, url } = body;

    if (!cameraId || !name || !qrImageBase64 || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const qrCode = await QRCode.create({
      cameraId,
      name,
      qrImageBase64,
      url,
    });

    return NextResponse.json({ success: true, qrCode }, { status: 201 });
  } catch (err) {
    console.error("POST /api/qrcodes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Lấy danh sách QR codes
export async function GET() {
  try {
    await connectDB();
    const qrCodes = await QRCode.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, qrCodes }, { status: 200 });
  } catch (err) {
    console.error("GET /api/qrcodes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
