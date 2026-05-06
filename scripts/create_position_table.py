import cv2
import numpy as np
import json
import argparse
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Billiard Table Corner Selection Tool")
    parser.add_argument("--rtsp", type=str, default=None, help="RTSP stream URL to capture frame from")
    parser.add_argument("--input_file", type=str, default=None, help="Path to input image (billiard table)")
    parser.add_argument("--output_file", type=str, default=None, help="Path to save output image with marked corners")
    parser.add_argument("--json_file", type=str, default=None, help="Path to save JSON file containing corner coordinates")
    return parser.parse_args()


def capture_frame_from_rtsp(rtsp_url: str, max_retries: int = 5):
    """Capture a single frame from an RTSP stream."""
    cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    frame = None
    for _ in range(max_retries):
        ret, f = cap.read()
        if ret and f is not None:
            frame = f
            break

    cap.release()
    return frame


def drag_points(image, points):
    dragging_idx = None
    needs_update = True

    def mouse_callback(event, x, y, flags, param):
        nonlocal dragging_idx, needs_update
        if event == cv2.EVENT_LBUTTONDOWN:
            for i, (px, py) in enumerate(points):
                if abs(x - px) < 15 and abs(y - py) < 15:
                    dragging_idx = i
                    needs_update = True
        elif event == cv2.EVENT_LBUTTONUP:
            dragging_idx = None
            needs_update = True
        elif event == cv2.EVENT_MOUSEMOVE:
            if dragging_idx is not None:
                points[dragging_idx] = [x, y]
                needs_update = True

    clone = image.copy()
    cv2.namedWindow("Set Table Corners", cv2.WINDOW_AUTOSIZE)
    cv2.setMouseCallback("Set Table Corners", mouse_callback)

    while True:
        if needs_update:
            disp = clone.copy()
            for idx, (px, py) in enumerate(points):
                cv2.circle(disp, (px, py), 8, (0, 255, 0), -1)
                cv2.putText(disp, f"{idx+1}", (px + 10, py - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.polylines(disp, [np.array(points, np.int32).reshape((-1, 1, 2))],
                          isClosed=True, color=(255, 0, 255), thickness=2)
            cv2.putText(disp, "Drag corners. Press ENTER to save. ESC to cancel.",
                        (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.imshow("Set Table Corners", disp)
            needs_update = False

        key = cv2.waitKey(10)
        if key in [13, 10]:  # ENTER
            break
        elif key == 27:  # ESC
            cv2.destroyWindow("Set Table Corners")
            return None

    cv2.destroyWindow("Set Table Corners")
    return points


def main():
    args = parse_args()

    # ── Load image ────────────────────────────────────────────────────────────
    if args.rtsp:
        img = capture_frame_from_rtsp(args.rtsp)
        if img is None:
            # Print error as JSON so the API can parse it
            print(json.dumps({"error": f"Cannot capture frame from RTSP: {args.rtsp}"}))
            sys.exit(1)
    elif args.input_file:
        img = cv2.imread(args.input_file)
        if img is None:
            print(json.dumps({"error": f"Image not found: {args.input_file}"}))
            sys.exit(1)
    else:
        print(json.dumps({"error": "Provide --rtsp or --input_file"}))
        sys.exit(1)

    # ── Default corner points ─────────────────────────────────────────────────
    h, w = img.shape[:2]
    default_points = [
        [int(w * 0.1), int(h * 0.1)],
        [int(w * 0.9), int(h * 0.1)],
        [int(w * 0.9), int(h * 0.9)],
        [int(w * 0.1), int(h * 0.9)],
    ]

    # ── Open GUI for dragging ─────────────────────────────────────────────────
    points = drag_points(img, default_points)

    if points is None:
        print(json.dumps({"error": "Operation cancelled by user"}))
        sys.exit(1)

    # ── Save optional files ───────────────────────────────────────────────────
    if args.json_file:
        with open(args.json_file, "w") as f:
            json.dump({"table_corners": points}, f, indent=2)

    if args.output_file:
        img_marked = img.copy()
        for idx, (px, py) in enumerate(points):
            cv2.circle(img_marked, (px, py), 8, (0, 255, 0), -1)
            cv2.putText(img_marked, f"{idx+1}", (px + 10, py - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.polylines(img_marked, [np.array(points, np.int32).reshape((-1, 1, 2))],
                      isClosed=True, color=(255, 0, 255), thickness=2)
        cv2.imwrite(args.output_file, img_marked)

    # ── Print JSON result to stdout (read by Next.js API) ─────────────────────
    print(json.dumps({"corners": points}))


if __name__ == "__main__":
    main()
