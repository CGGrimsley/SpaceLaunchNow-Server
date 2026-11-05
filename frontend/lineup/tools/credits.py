"""Generate src/credits.js from the 3D models' Sketchfab license.txt files.

Usage: python tools/credits.py <models dir> > src/credits.js

<models dir> holds one folder per asset key, each with the license.txt that
Sketchfab ships with a download. Models from other sources are listed below.
"""

import json
import pathlib
import re
import sys

CC_BY = {"license": "CC BY 4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0/"}
NASA_3D = "https://science.nasa.gov/3d-resources/"
ATLAS_V = {
    "title": "Atlas V 551",
    "source": NASA_3D,
    "author": "NASA",
    "authorUrl": NASA_3D,
    "license": "NASA media guidelines",
    "licenseUrl": "https://www.nasa.gov/nasa-brand-center/images-and-media/",
}
AUTHOR_URL = "https://github.com/CGGrimsley"
# Models built for the line-up in Blender from the line-up silhouettes.
ORIGINAL = {
    "lm2c": "Long March 2C",
    "lm2d": "Long March 2D",
    "lm3b": "Long March 3B",
    "lm4c": "Long March 4C",
    "lm5b": "Long March 5B",
    "lm6a": "Long March 6A",
    "lm7": "Long March 7",
    "lm7a": "Long March 7A",
    "lm8": "Long March 8",
    "lm12": "Long March 12",
    "zhuque2e": "Zhuque-2E",
    "ceres1": "Ceres-1",
    "kinetica1": "Kinetica-1",
    "gravity1": "Gravity-1",
    "angaraa5": "Angara A5",
    "kuaizhou": "Kuaizhou 1A",
    "h3": "H3",
    "soyuz": "Soyuz 2.1b",
}


def license_field(text, key):
    return re.search(rf"\* {key}:\t(.*)", text).group(1).strip()


def sketchfab_credit(model_dir):
    text = (model_dir / "license.txt").read_text()
    if "CC-BY-4.0" not in license_field(text, "license type"):
        raise ValueError(f"{model_dir.name}: not CC BY 4.0")
    author, author_url = re.match(r"(.*) \((.*)\)", license_field(text, "author")).groups()
    return {
        "title": license_field(text, "title"),
        "source": license_field(text, "source"),
        "author": author,
        "authorUrl": author_url,
        **CC_BY,
    }


def original_credit(title):
    return {
        "title": title,
        "source": AUTHOR_URL,
        "author": "CGGrimsley",
        "authorUrl": AUTHOR_URL,
        "license": "made for Space Launch Now",
        "licenseUrl": AUTHOR_URL,
        "original": True,
    }


def main(models_dir):
    out = {d.name: sketchfab_credit(d) for d in sorted(pathlib.Path(models_dir).iterdir())}
    out["atlasv"] = ATLAS_V
    out.update({key: original_credit(title) for key, title in ORIGINAL.items()})
    print("export const CREDITS = " + json.dumps(out, indent=1) + ";")


if __name__ == "__main__":
    main(sys.argv[1])
