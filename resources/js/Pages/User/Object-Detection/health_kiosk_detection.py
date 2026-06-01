"""
IoT-Based School Health Kiosk - Object Detection

This script uses YOLOv8 person detection to decide when the kiosk should
show the idle screen or allow the login screen.

Output JSON status:
    NO_STUDENT
    MOVE_TO_CENTER
    HOLD_STILL
    READY

The person must stay inside the center zone for HOLD_SECONDS before READY.
"""

from __future__ import annotations

import argparse
import json
import os
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
from ultralytics import YOLO


PERSON_CLASS_ID = 0
HOLD_SECONDS = 5.0
DETECTION_CONFIDENCE = 0.45
NO_STUDENT_RESET_SECONDS = 0.5

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[4]

RESOURCE_STATUS_PATH = SCRIPT_DIR / "status.json"
PUBLIC_STATUS_PATH = PROJECT_ROOT / "public" / "object-detection" / "status.json"


@dataclass
class DetectionState:
    status: str = "NO_STUDENT"
    confidence: float = 0.0
    in_zone: bool = False
    hold_progress: float = 0.0
    timestamp: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "confidence": round(float(self.confidence), 4),
            "in_zone": bool(self.in_zone),
            "hold_progress": round(float(self.hold_progress), 4),
            "timestamp": self.timestamp,
        }


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path = Path(path)
    os.makedirs(path.parent, exist_ok=True)

    try:
        temp_name = str(path) + ".tmp"

        with open(temp_name, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        os.replace(temp_name, path)

    except PermissionError:
        # Fallback for Windows file-lock issue
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)


def write_status(state: DetectionState) -> None:
    payload = state.to_dict()
    atomic_write_json(RESOURCE_STATUS_PATH, payload)
    atomic_write_json(PUBLIC_STATUS_PATH, payload)


def get_center_zone(frame_width: int, frame_height: int) -> tuple[int, int, int, int]:
    zone_width = int(frame_width * 0.42)
    zone_height = int(frame_height * 0.72)
    x1 = (frame_width - zone_width) // 2
    y1 = (frame_height - zone_height) // 2
    x2 = x1 + zone_width
    y2 = y1 + zone_height

    return x1, y1, x2, y2


def is_box_centered(box: tuple[int, int, int, int], zone: tuple[int, int, int, int]) -> bool:
    x1, y1, x2, y2 = box
    zone_x1, zone_y1, zone_x2, zone_y2 = zone
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2

    return zone_x1 <= center_x <= zone_x2 and zone_y1 <= center_y <= zone_y2


def get_best_person(result: Any) -> tuple[tuple[int, int, int, int] | None, float]:
    best_box = None
    best_confidence = 0.0

    for detected_box in result.boxes:
        class_id = int(detected_box.cls[0])
        confidence = float(detected_box.conf[0])

        if class_id != PERSON_CLASS_ID or confidence < DETECTION_CONFIDENCE:
            continue

        if confidence <= best_confidence:
            continue

        x1, y1, x2, y2 = detected_box.xyxy[0].tolist()
        best_box = (int(x1), int(y1), int(x2), int(y2))
        best_confidence = confidence

    return best_box, best_confidence


def draw_overlay(
    frame: Any,
    zone: tuple[int, int, int, int],
    person_box: tuple[int, int, int, int] | None,
    state: DetectionState,
) -> None:
    zone_color = (32, 183, 244) if state.in_zone else (0, 191, 255)
    status_color = {
        "NO_STUDENT": (120, 120, 120),
        "MOVE_TO_CENTER": (0, 165, 255),
        "HOLD_STILL": (255, 180, 0),
        "READY": (0, 200, 90),
    }.get(state.status, (120, 120, 120))

    zx1, zy1, zx2, zy2 = zone
    cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), zone_color, 2)

    if person_box:
        x1, y1, x2, y2 = person_box
        cv2.rectangle(frame, (x1, y1), (x2, y2), status_color, 2)

    label = f"{state.status} | {int(state.hold_progress * 100)}%"
    cv2.putText(
        frame,
        label,
        (24, 42),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.85,
        status_color,
        2,
        cv2.LINE_AA,
    )

    progress_x = 24
    progress_y = 64
    progress_w = 280
    progress_h = 12
    cv2.rectangle(frame, (progress_x, progress_y), (progress_x + progress_w, progress_y + progress_h), (45, 45, 45), -1)
    cv2.rectangle(
        frame,
        (progress_x, progress_y),
        (progress_x + int(progress_w * state.hold_progress), progress_y + progress_h),
        status_color,
        -1,
    )


def create_status(
    status: str,
    confidence: float = 0.0,
    in_zone: bool = False,
    hold_progress: float = 0.0,
) -> DetectionState:
    return DetectionState(
        status=status,
        confidence=confidence,
        in_zone=in_zone,
        hold_progress=max(0.0, min(1.0, hold_progress)),
        timestamp=time.time(),
    )


def run_detection(camera_index: int, model_path: str, show_preview: bool) -> None:
    model = YOLO(model_path)
    camera = cv2.VideoCapture(camera_index)

    if not camera.isOpened():
        state = create_status("NO_STUDENT")
        write_status(state)
        raise RuntimeError(f"Camera index {camera_index} could not be opened.")

    centered_since: float | None = None
    last_person_seen = 0.0

    write_status(create_status("NO_STUDENT"))

    try:
        while True:
            success, frame = camera.read()

            if not success:
                state = create_status("NO_STUDENT")
                write_status(state)
                time.sleep(0.5)
                continue

            frame_height, frame_width = frame.shape[:2]
            center_zone = get_center_zone(frame_width, frame_height)
            result = model.predict(frame, conf=DETECTION_CONFIDENCE, classes=[PERSON_CLASS_ID], verbose=False)[0]
            person_box, confidence = get_best_person(result)
            now = time.time()

            if person_box is None:
                if now - last_person_seen >= NO_STUDENT_RESET_SECONDS:
                    centered_since = None
                    state = create_status("NO_STUDENT")
                else:
                    state = create_status("HOLD_STILL", confidence=confidence, in_zone=False)
            else:
                last_person_seen = now
                in_zone = is_box_centered(person_box, center_zone)

                if not in_zone:
                    centered_since = None
                    state = create_status("MOVE_TO_CENTER", confidence=confidence, in_zone=False)
                else:
                    if centered_since is None:
                        centered_since = now

                    hold_duration = now - centered_since
                    hold_progress = hold_duration / HOLD_SECONDS

                    if hold_duration >= HOLD_SECONDS:
                        state = create_status("READY", confidence=confidence, in_zone=True, hold_progress=1.0)
                    else:
                        state = create_status("HOLD_STILL", confidence=confidence, in_zone=True, hold_progress=hold_progress)

            write_status(state)

            if show_preview:
                draw_overlay(frame, center_zone, person_box, state)
                cv2.imshow("Health Kiosk Object Detection", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

    finally:
        camera.release()
        if show_preview:
            cv2.destroyAllWindows()
        write_status(create_status("NO_STUDENT"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Health Kiosk YOLOv8 person detection")
    parser.add_argument("--camera", type=int, default=0, help="Camera index. Default: 0")
    parser.add_argument("--model", default="yolov8n.pt", help="YOLOv8 model path. Default: yolov8n.pt")
    parser.add_argument("--preview", action="store_true", help="Show camera preview window")

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_detection(camera_index=args.camera, model_path=args.model, show_preview=args.preview)
