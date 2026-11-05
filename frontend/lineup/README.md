# Line-up + 3D viewer

Front end for the "Line-up · Next 30 days" module on launch vehicle pages
(`web/templates/web/vehicles/launch_vehicle/line_up.html`, data from `src/web/lineup.py`).
Every rocket flying in the next 30 days is drawn to scale; selecting one animates its
silhouette into a three.js viewer with the vehicle's statistics.

The built files are committed, so nothing here runs at deploy time:

| Output | What |
| --- | --- |
| `src/static/lineup/lineup.js` | Bundle for the vehicle page (three.js included, ~670 KB, ~170 KB gzipped). Loaded with `defer` on that page only. |
| `src/static/lineup/lineup.css` | Styles. Everything is scoped to `.ln-*` / `#ln-*` so it can't collide with Material Kit / Bootstrap. |
| `src/static/lineup/models/*.glb` | Detailed models, meshopt-compressed, 512 px WebP textures. |
| `docs/mockups/rocket-lineup-3d/index.html` | Standalone mockup with sample figures. |

## Wiring it in

This branch only adds files; no existing file is changed. To show the module on launch
vehicle pages, make these three edits:

1. `src/web/views.py`, import the helper and add it to the `launch_vehicle_id` context:

       from web.lineup import get_line_up
       ...
                           "previous_vehicle_launches": previous_vehicle_launches,
                           "line_up": get_line_up(vehicle),

2. `launch_vehicle_detail.html`, at the end of `{% block extrahead %}`:

       {% if line_up %}
           <link rel="stylesheet" href="{% static 'lineup/lineup.css' %}">
       {% endif %}

3. Same template, just above the "Upcoming Spaceflights" section:

       {% if line_up %}
           <div class="col-sm-12" style="margin-bottom: 30px">
               {% include "web/vehicles/launch_vehicle/line_up.html" %}
           </div>
       {% endif %}

The tests in `src/web/tests_lineup.py` cover `web/lineup.py` and run without the wiring.

## Build

    cd frontend/lineup
    npm install
    ./build.sh

## Source

- `src/app.js` chart, phone list, transition and viewer (`mount()`).
- `src/model.js` turns a silhouette into a 3D preview model (lathe for the core, loft for boosters, extruded fins).
- `src/assets.js` per-vehicle silhouette, paint and model. Keys match `ASSET_PATTERNS` in `src/web/lineup.py`.
- `src/silhouettes.js` generated from the silhouette SVGs (1 unit = 1 m, tip at y = 0) with `tools/extract.py <svg dir>`.
- `src/credits.js` generated from the models' `license.txt` files with `tools/credits.py <models dir>`.
- `src/vehicle-entry.js` / `src/mockup-entry.js` the two entry points.

Vehicles without a silhouette get a generic outline from their length and diameter. Vehicles
without a `.glb` get a preview model generated from their silhouette.

## Adding a model

1. Optimise it into the static folder (any scale and orientation; the viewer scales it to the
   published length and stands it upright):

       npx gltf-transform optimize scene.gltf ../../src/static/lineup/models/<key>.glb \
         --compress meshopt --texture-compress webp --texture-size 512 \
         --simplify true --simplify-ratio 0.35 --simplify-error 0.001

2. Add its credit to `src/credits.js` (CC BY models must be credited; the viewer shows the
   credit above the model).
3. If it's a new vehicle, add a silhouette and an entry in `src/assets.js`, and a pattern in
   `ASSET_PATTERNS` (`src/web/lineup.py`).
4. `./build.sh`

## Model credits

See `docs/mockups/rocket-lineup-3d/CREDITS.md`.
