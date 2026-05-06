import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rtspUrl } = body;

    if (!rtspUrl) {
      return NextResponse.json({ error: "rtspUrl is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "create_position_table.py");

    // Chạy Python script, truyền rtspUrl qua argument
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" --rtsp "${rtspUrl.replace(/"/g, '\\"')}"`,
      { timeout: 60000 } // 60s timeout cho việc vẽ corners
    );

    if (stderr && !stdout) {
      console.error("Python stderr:", stderr);
      return NextResponse.json({ error: "Script error", detail: stderr }, { status: 500 });
    }

    // Parse JSON output từ script
    const lastLine = stdout.trim().split("\n").pop() ?? "";
    const result = JSON.parse(lastLine);

    if (!result.corners || !Array.isArray(result.corners)) {
      return NextResponse.json({ error: "Invalid output from script" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, corners: result.corners });
  } catch (err) {
    console.error("run-table-corners error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
