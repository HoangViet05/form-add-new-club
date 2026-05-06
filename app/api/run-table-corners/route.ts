import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rtspUrl } = body;

    if (!rtspUrl) {
      return NextResponse.json({ error: "rtspUrl is required" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "create_position_table.py");

    const result = await runPythonScript(scriptPath, rtspUrl);
    return NextResponse.json(result);
  } catch (err) {
    console.error("run-table-corners error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function runPythonScript(
  scriptPath: string,
  rtspUrl: string
): Promise<{ ok: boolean; corners?: number[][]; error?: string }> {
  return new Promise((resolve) => {
    // Dùng spawn để script có thể mở GUI window (cv2.imshow)
    const proc = spawn("python", [scriptPath, "--rtsp", rtspUrl], {
      // Không set timeout ở đây — người dùng cần thời gian kéo thả góc bàn
      // GUI sẽ block cho đến khi nhấn ENTER hoặc ESC
      windowsHide: false, // Cho phép hiện cửa sổ GUI trên Windows
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script stderr:", stderr);
        // Thử parse JSON từ stdout trước (script có thể in error JSON)
        try {
          const parsed = JSON.parse(stdout.trim().split("\n").pop() ?? "");
          resolve({ ok: false, error: parsed.error ?? `Exit code ${code}` });
        } catch {
          resolve({ ok: false, error: stderr || `Script exited with code ${code}` });
        }
        return;
      }

      // Lấy dòng JSON cuối cùng từ stdout
      const lines = stdout.trim().split("\n").filter(Boolean);
      const lastLine = lines[lines.length - 1] ?? "";

      try {
        const parsed = JSON.parse(lastLine);

        if (parsed.error) {
          resolve({ ok: false, error: parsed.error });
          return;
        }

        if (!parsed.corners || !Array.isArray(parsed.corners)) {
          resolve({ ok: false, error: "Script did not return corners" });
          return;
        }

        resolve({ ok: true, corners: parsed.corners });
      } catch {
        resolve({ ok: false, error: `Cannot parse script output: ${lastLine}` });
      }
    });

    proc.on("error", (err) => {
      resolve({ ok: false, error: `Failed to start Python: ${err.message}` });
    });
  });
}
