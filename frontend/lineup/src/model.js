import * as THREE from 'three';

// ---------- SVG path parsing (silhouettes use absolute M/L/C/Z only) ----------
export function parseD(d) {
  const toks = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  const subs = [];
  let cur = null, cmd = null, i = 0, last = [0, 0];
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    const t = toks[i];
    if (/^[MLCZ]$/i.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') { cur = null; continue; } }
    else if (cmd === 'M') cmd = 'L';
    if (cmd === 'M') { cur = []; subs.push(cur); last = [num(), num()]; cur.push(last); }
    else if (cmd === 'L') { if (!cur) { cur = [last]; subs.push(cur); } last = [num(), num()]; cur.push(last); }
    else if (cmd === 'C') {
      const p0 = last, p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()];
      for (let s = 1; s <= 12; s++) {
        const u = s / 12, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), e = u ** 3;
        cur.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
      }
      last = p3;
    } else i++;
  }
  return subs.map(dedupe).filter(s => s.length > 2);
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) { const q = out[out.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-5) out.push(p); }
  if (out.length > 1) { const a = out[0], b = out[out.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-5) out.pop(); }
  return out;
}

function bbox(pts) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2 };
}

// Longest cyclically-contiguous run of points that satisfy pred.
function cyclicRun(pts, pred) {
  const n = pts.length, ok = pts.map(pred);
  const k = ok.indexOf(false);
  if (k < 0) return pts.slice();
  let best = [], run = [];
  for (let s = 1; s <= n; s++) {
    const j = (k + s) % n;
    if (ok[j]) run.push(pts[j]); else { if (run.length > best.length) best = run; run = []; }
  }
  if (run.length > best.length) best = run;
  return best;
}

// Horizontal scanline through a closed polygon -> [xmin, xmax] or null.
function scan(pts, y) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    if ((a[1] <= y && y < b[1]) || (b[1] <= y && y < a[1])) {
      const x = a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]);
      lo = Math.min(lo, x); hi = Math.max(hi, x);
    }
  }
  return lo <= hi ? [lo, hi] : null;
}

// Duplicate sharp corners so LatheGeometry keeps crisp creases.
function creaseProfile(v) {
  const out = [v[0]];
  for (let i = 1; i < v.length - 1; i++) {
    const a = v[i].clone().sub(v[i - 1]).normalize(), b = v[i + 1].clone().sub(v[i]).normalize();
    out.push(v[i]);
    if (Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)) > 0.45) out.push(v[i].clone());
  }
  out.push(v[v.length - 1]);
  return out;
}

function latheFromSubpath(pts, H) {
  const run = cyclicRun(pts, p => p[0] >= -1e-4);
  let prof = run.map(([x, y]) => new THREE.Vector2(Math.max(x, 0), H - y));
  if (prof[0].y > prof[prof.length - 1].y) prof.reverse();
  if (prof[0].x > 1e-4) prof.unshift(new THREE.Vector2(0, prof[0].y));
  const l = prof[prof.length - 1];
  if (l.x > 1e-4) prof.push(new THREE.Vector2(0, l.y));
  return new THREE.LatheGeometry(creaseProfile(prof), 64);
}

// Loft a (possibly asymmetric) side outline into a round body whose centre follows the outline.
function loftFromSubpath(pts, H, segs = 40) {
  const b = bbox(pts), ys = new Set();
  for (const p of pts) { ys.add(p[1] - 0.003); ys.add(p[1] + 0.003); }
  for (let i = 0; i <= 60; i++) ys.add(b.y0 + (b.h * i) / 60);
  const rows = [...ys].filter(y => y > b.y0 + 1e-3 && y < b.y1 - 1e-3).sort((a, c) => a - c)
    .map(y => { const s = scan(pts, y); return s && { y, c: (s[0] + s[1]) / 2, r: (s[1] - s[0]) / 2 }; }).filter(Boolean);
  const first = rows[0], last = rows[rows.length - 1];
  rows.unshift({ y: b.y0, c: first.c, r: 0 });
  rows.push({ y: b.y1, c: last.c, r: last.r }, { y: b.y1, c: last.c, r: 0 });
  const pos = [], idx = [];
  for (const row of rows) for (let j = 0; j <= segs; j++) {
    const f = (j / segs) * Math.PI * 2;
    pos.push(row.c + row.r * Math.cos(f), H - row.y, row.r * Math.sin(f));
  }
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < segs; j++) {
    const a = i * (segs + 1) + j, bb = a + segs + 1;
    idx.push(a, bb, a + 1, bb, bb + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function finFromSubpath(pts, H, depth) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, H - y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

const mat = (color, paint, extra = {}) => new THREE.MeshStandardMaterial({
  color, metalness: paint.metal ?? 0.12, roughness: paint.rough ?? 0.5, ...extra,
});

// Build a procedural 3D rocket from a 2D silhouette (1 unit = 1 m, tip at y=0).
export function buildRocket(rocket, sil) {
  const H = rocket.height, paint = rocket.paint;
  const group = new THREE.Group();
  const parts = sil.silhouette.flatMap(parseD).map(pts => ({ pts, b: bbox(pts) }));

  const axial = parts.filter(p => p.b.x0 < 0 && Math.abs(p.b.x0 + p.b.x1) < 0.05 * p.b.w + 0.01);
  const core = axial.reduce((a, p) => (p.b.h > a.b.h ? p : a), axial[0]);
  const coreR = (scan(core.pts, core.b.y0 + core.b.h * 0.85) || [0, rocket.diameter / 2])[1];

  for (const p of axial) {
    const m = new THREE.Mesh(latheFromSubpath(p.pts, H), mat(p === core ? paint.body : (paint.top || paint.body), paint));
    group.add(m);
  }

  const side = parts.filter(p => !axial.includes(p) && p.b.cx > 0);
  const isBooster = p => p.b.h > 0.22 * H && p.b.w > 0.45 * coreR;
  const boosterParts = side.filter(isBooster);
  const tpl = boosterParts.sort((a, c) => a.b.cx - c.b.cx)[0];
  const nBoost = tpl ? (rocket.ringBoosters || rocket.boosters || 2) : 0;
  const boostAngles = Array.from({ length: nBoost }, (_, i) => (i * Math.PI * 2) / nBoost);
  if (tpl) {
    const g = loftFromSubpath(tpl.pts, H);
    const m = mat(paint.boosters || paint.body, paint, { side: THREE.DoubleSide });
    for (const a of boostAngles) { const mesh = new THREE.Mesh(g, m); mesh.rotation.y = a; group.add(mesh); }
  }

  const finMat = mat(paint.fins || paint.body, paint);
  const depth = THREE.MathUtils.clamp(coreR * 0.08, 0.05, 0.35);
  for (const p of side) {
    if (isBooster(p) || p.b.x1 <= coreR + 0.02) continue;
    const onBooster = tpl && p.b.x0 >= coreR + 0.05;
    const angles = onBooster ? boostAngles : [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const g = finFromSubpath(p.pts, H, depth);
    for (const a of angles) { const mesh = new THREE.Mesh(g, finMat); mesh.rotation.y = a; group.add(mesh); }
  }

  // Panel lines from the silhouette's detail layer become thin rings.
  const ringMat = new THREE.MeshStandardMaterial({ color: '#161826', transparent: true, opacity: 0.55, roughness: 0.8 });
  for (const d of sil.detail) for (const pts of parseD(d + ' Z').concat(parseD(d))) {
    if (pts.length !== 2 || Math.abs(pts[0][1] - pts[1][1]) > 1e-3) continue;
    const y = H - pts[0][1], cx = (pts[0][0] + pts[1][0]) / 2, r = Math.abs(pts[1][0] - pts[0][0]) / 2 + 0.015;
    const ring = new THREE.CylinderGeometry(r, r, 0.22, 64, 1, true);
    if (Math.abs(cx) < 0.02) { const m = new THREE.Mesh(ring, ringMat); m.position.y = y; group.add(m); }
    else if (tpl && Math.abs(cx - tpl.b.cx) < 0.1) for (const a of boostAngles) {
      const piv = new THREE.Group(); const m = new THREE.Mesh(ring, ringMat);
      m.position.set(cx, y, 0); piv.add(m); piv.rotation.y = a; group.add(piv);
    }
  }
  group.userData.radius = Math.max(coreR, ...parts.map(p => Math.max(Math.abs(p.b.x0), Math.abs(p.b.x1))));
  return group;
}
