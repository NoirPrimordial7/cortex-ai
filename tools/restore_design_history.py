"""Restore archived gallery inputs under ignored outputs/design-history/."""

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    destination = (ROOT / "outputs/design-history").resolve()
    destination.mkdir(parents=True, exist_ok=True)
    count = 0
    for archive in sorted((ROOT / "docs/archive/design-history").glob("*.zip")):
        with zipfile.ZipFile(archive) as bundle:
            if bundle.testzip() is not None:
                raise ValueError(f"Damaged archive: {archive.name}")
            for member in bundle.infolist():
                target = (destination / member.filename).resolve()
                if not target.is_relative_to(destination):
                    raise ValueError("Archive path escapes the restore directory")
            bundle.extractall(destination)
            count += len(bundle.infolist())
    print(f"Restored {count} historical files into {destination}")


if __name__ == "__main__":
    main()
