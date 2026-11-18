"""Check local Markdown/HTML links, including members of design-history ZIPs."""

import re
import zipfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def local_links(text):
    yield from re.findall(r"!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+[^)]+)?\)", text)
    yield from re.findall(r"""(?:href|src)=["']([^"']+)["']""", text)


def check():
    files = [ROOT / "README.md"]
    for directory in ("docs", "tools", ".github"):
        files.extend(
            path for path in (ROOT / directory).rglob("*")
            if path.is_file() and path.suffix in {".md", ".html"}
        )
    errors, count = [], 0
    for source in files:
        for link in local_links(source.read_text(encoding="utf-8")):
            parsed = urlsplit(link.strip("<>"))
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = (source.parent / unquote(parsed.path)).resolve()
            if not target.is_relative_to(ROOT) or not target.exists():
                errors.append((source.relative_to(ROOT).as_posix(), link))
                continue
            if target.suffix == ".zip" and parsed.fragment:
                with zipfile.ZipFile(target) as archive:
                    if unquote(parsed.fragment) not in archive.namelist():
                        errors.append((source.relative_to(ROOT).as_posix(), link))
                        continue
            count += 1
    for source, link in errors:
        print(f"{source}: {link}")
    print(f"Checked {count} local links; {len(errors)} missing targets.")
    return errors


if __name__ == "__main__":
    raise SystemExit(bool(check()))
