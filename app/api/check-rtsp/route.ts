import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rtspUrl = searchParams.get("url");

  if (!rtspUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Validate scheme
  if (!rtspUrl.startsWith("rtsp://") && !rtspUrl.startsWith("rtsps://")) {
    return NextResponse.json({ error: "Invalid RTSP URL" }, { status: 400 });
  }

  try {
    // ffprobe: probe stream with 5s timeout, no output, just exit code
    const cmd = `ffprobe -v quiet -rtsp_transport tcp -i "${rtspUrl.replace(/"/g, '\\"')}" -show_entries format=duration -of default=noprint_wrappers=1 -timeout 5000000`;

    await execAsync(cmd, { timeout: 8000 });

    return NextResponse.json({ ok: true });
  } catch {
    // ffprobe not available — fallback: try net socket connect to host:port
    try {
      const url = new URL(rtspUrl);
      const host = url.hostname;
      const port = parseInt(url.port) || 554;

      const reachable = await checkTcpPort(host, port, 5000);
      if (reachable) {
        return NextResponse.json({ ok: true, method: "tcp" });
      }
      return NextResponse.json({ ok: false }, { status: 200 });
    } catch {
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }
}

function checkTcpPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const net = require("net");
    const socket = new net.Socket();
    let resolved = false;

    const done = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.connect(port, host, () => done(true));
    socket.on("error", () => done(false));
    socket.on("timeout", () => done(false));
  });
}
