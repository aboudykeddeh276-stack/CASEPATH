#!/usr/bin/env python3
"""Outside-in CasePath production readback.

The verifier deliberately distinguishes public reachability from deployment
promotion. It records the exact response bytes, SHA-256, status, content type,
final URL and expected source marker. It does not claim that public content
came from the current source revision unless the caller supplies and verifies
that relationship separately.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import ssl
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def readback(url: str, expected_marker: str | None) -> dict:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "CasePath-Production-Readback/1.0"},
        method="GET",
    )
    context = ssl.create_default_context()
    started = datetime.now(timezone.utc)
    with urllib.request.urlopen(request, context=context, timeout=30) as response:
        body = response.read()
        text = body.decode("utf-8", errors="replace")
        finished = datetime.now(timezone.utc)
        return {
            "requested_url": url,
            "final_url": response.geturl(),
            "http_status": response.status,
            "content_type": response.headers.get("Content-Type"),
            "content_length": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "started_at": started.isoformat(),
            "completed_at": finished.isoformat(),
            "expected_marker": expected_marker,
            "marker_present": (expected_marker in text) if expected_marker else None,
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="https://casepath.com.au/")
    parser.add_argument("--expected-marker", default="")
    parser.add_argument("--output", default="casepath-public-readback.json")
    args = parser.parse_args()

    result = readback(args.url, args.expected_marker or None)
    Path(args.output).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))

    if result["http_status"] < 200 or result["http_status"] >= 400:
        return 2
    if args.expected_marker and not result["marker_present"]:
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
