# Rocket line-up + 3D viewer (standalone mockup)

A clickable prototype for the "Line-up · next 30 days" module on launch vehicle pages.
Selecting a rocket flies its silhouette into a 3D viewer (drag to rotate, scroll to zoom)
with the rocket's statistics alongside. Figures in the mockup are sample values.

Run it from the repository root, so the page can load the 3D models that live in
`src/static/lineup/models/`:

    python3 -m http.server 8000
    # then open http://localhost:8000/docs/mockups/rocket-lineup-3d/

- Silhouettes: drawn to scale, 1 unit = 1 m.
- 3D models: glTF binaries compressed with meshopt. See CREDITS.md. The CC BY 4.0
  credits must stay visible wherever the models are shown (the viewer shows them).
- Rockets without a model (Soyuz 2.1b, Kuaizhou 1A) get a preview model generated
  from their silhouette.
- Append `?open=falcon9` (or any rocket id) to open the viewer straight away.
