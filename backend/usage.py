import json
import os

USAGE_FILE = os.path.join(os.path.dirname(__file__), "embed_usage.json")

LIMITS = {
    "video_requests": 3000,
    "video_minutes": 600,
    "image_requests": 3000,
}

# Fresh TwelveLabs account as of 2026-07-19 (key rotated) - starts at zero.
# embed_usage.json then tracks incrementally from here across local test runs.
DEFAULT_USAGE = {
    "video_requests": 0,
    "video_minutes": 0.0,
    "image_requests": 0,
}


def _load() -> dict:
    if os.path.exists(USAGE_FILE):
        with open(USAGE_FILE) as f:
            return json.load(f)
    return dict(DEFAULT_USAGE)


def _save(usage: dict) -> None:
    with open(USAGE_FILE, "w") as f:
        json.dump(usage, f, indent=2)


def _bump(key: str, amount: float) -> None:
    usage = _load()
    usage[key] = usage.get(key, 0) + amount
    _save(usage)

    limit = LIMITS[key]
    used = round(usage[key], 2)
    print(f"[twelvelabs usage] {key}: {used}/{limit} used, {round(limit - used, 2)} remaining")


def track_video_request(duration_sec: float) -> None:
    _bump("video_requests", 1)
    _bump("video_minutes", duration_sec / 60)


def track_image_request() -> None:
    _bump("image_requests", 1)
