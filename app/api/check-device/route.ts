import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.arenabilliard.com/api/scoreboards/check-device/?deviceId=${encodeURIComponent(deviceId)}&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `API responded with ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("check-device error:", err);
    return NextResponse.json({ error: "Failed to reach Arena API" }, { status: 502 });
  }
}
