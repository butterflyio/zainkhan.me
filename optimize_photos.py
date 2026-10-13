#!/usr/bin/env python3
"""
Resize and compress photos for the timeline.

Usage:  python3 optimize_photos.py photo1.jpg photo2.png ...

Writes web-ready JPEGs into images/timeline/ (max 1600px on the long edge,
quality 82, progressive). Prints the output filename for each input, which is
the value to put in the `photo:` field in content.md.
"""
import os
import re
import sys

from PIL import Image, ImageOps

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "timeline")
MAX = 1600


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "photo"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)
    for src in sys.argv[1:]:
        im = Image.open(src)
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        im.thumbnail((MAX, MAX), Image.LANCZOS)
        dst = os.path.join(OUT, slug(os.path.splitext(os.path.basename(src))[0]) + ".jpg")
        im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
        print("%s  ->  images/timeline/%s" % (src, os.path.basename(dst)))


if __name__ == "__main__":
    main()
