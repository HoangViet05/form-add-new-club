import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { rtspUrl } = await request.json();

    if (!rtspUrl) {
      return NextResponse.json({ error: "rtspUrl is required" }, { status: 400 });
    }

    const frameBase64 = await captureFrame(rtspUrl);
    return NextResponse.json({ ok: true, frame: frameBase64 });
  } catch (err) {
    console.error("capture-frame error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function captureFrame(rtspUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    // Cho phép override ffmpeg path qua env variable
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    // ffmpeg: grab 1 frame, output as JPEG to stdout
    const proc = spawn(ffmpegPath, [
      "-rtsp_transport", "tcp",
      "-i", rtspUrl,
      "-frames:v", "1",
      "-f", "image2",
      "-vcodec", "mjpeg",
      "pipe:1",
    ], { windowsHide: true });

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));

    proc.on("close", (code) => {
      if (code !== 0 || chunks.length === 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }
      const buffer = Buffer.concat(chunks);
      resolve("data:image/jpeg;base64," + buffer.toString("base64"));
    });

    proc.on("error", (err) => {
      reject(new Error(`ffmpeg not found at "${ffmpegPath}". Please install ffmpeg or set FFMPEG_PATH env variable. Error: ${err.message}`));
    });

    // 10s timeout
    setTimeout(() => {
      proc.kill();
      reject(new Error("Timeout capturing frame"));
    }, 10000);
  });
}
