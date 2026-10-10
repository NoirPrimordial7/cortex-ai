"""Optional bounded raster-only PDF rendering; no browser PDF scripts/attachments.

Uses an operator-configured absolute pdftoppm path. This child is time-bounded,
not an OS sandbox; enterprise deployment must additionally isolate the renderer.
"""

import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from pypdf import PdfReader


def render(path, executable, page):
    reader = PdfReader(path)
    count = len(reader.pages)
    if reader.is_encrypted or not 1 <= page <= count <= 200:
        raise ValueError("UNSUPPORTED_PAGE")
    with tempfile.TemporaryDirectory(prefix="cortex-pdf-") as temporary:
        output = Path(temporary) / "page"
        subprocess.run(
            [
                executable,
                "-f",
                str(page),
                "-l",
                str(page),
                "-singlefile",
                "-scale-to",
                "1400",
                "-png",
                str(path),
                str(output),
            ],
            capture_output=True,
            timeout=10,
            check=True,
        )
        png = output.with_suffix(".png")
        if not png.is_file() or png.stat().st_size > 4 * 1024 * 1024:
            raise ValueError("RASTER_LIMIT")
        return {"image": base64.b64encode(png.read_bytes()).decode(), "page_count": count}


if __name__ == "__main__":
    try:
        result = render(Path(sys.argv[1]), sys.argv[2], int(sys.argv[3]))
    except Exception:
        result = {"error": "ORIGINAL_PAGE_UNAVAILABLE"}
    print(json.dumps(result))
