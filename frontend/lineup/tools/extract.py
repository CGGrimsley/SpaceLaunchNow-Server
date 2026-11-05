"""Generate src/silhouettes.js from a folder of line-up silhouette SVGs.

Usage: python tools/extract.py <svg dir> > src/silhouettes.js

Each SVG is drawn at 1 unit = 1 m with the tip at y = 0, and keeps its outline
paths in <g id="silhouette"> and its panel lines in <g id="detail">.
"""

import json
import pathlib
import re
import sys

PATH_DATA = re.compile(r"[MLCZ0-9.,\s\-]+")


def group_paths(svg, group_id):
    """Return the d attributes of the paths inside <g id="group_id">."""
    match = re.search(rf'<g id="{group_id}"[^>]*>(.*?)</g>', svg, re.S)
    return re.findall(r'd="([^"]+)"', match.group(1)) if match else []


def read_silhouette(path):
    svg = re.sub(r"<metadata>.*?</metadata>", "", path.read_text(), flags=re.S)
    view_box = [float(x) for x in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    silhouette, detail = group_paths(svg, "silhouette"), group_paths(svg, "detail")
    for d in silhouette + detail:
        if not PATH_DATA.fullmatch(d):
            raise ValueError(f"{path.name}: unexpected path data {d!r}")
    return {"viewBox": view_box, "silhouette": silhouette, "detail": detail}


def main(svg_dir):
    out = {f.stem: read_silhouette(f) for f in sorted(pathlib.Path(svg_dir).glob("*.svg"))}
    print("export const SILHOUETTES = " + json.dumps(out) + ";")


if __name__ == "__main__":
    main(sys.argv[1])
