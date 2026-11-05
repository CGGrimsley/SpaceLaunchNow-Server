import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { buildRocket } from './model.js';
import { VIEWER_HTML } from './viewer-markup.js';

// rockets: [{ id, name, provider, height, diameter, leo, gto, thrust, mass, stages, boosters, firstFlight,
//            reusable, inWindow, url, sil: { viewBox, silhouette, detail }, paint, model, credit }]
// noHeight: same shape, for rockets with no published height (drawn as a dashed '?' slot).
export function mount({ rockets, noHeight = [], featured, title = '', windowLabel = 'Next 30 days' }) {
featured = String(featured);
for (const r of [...rockets, ...noHeight]) r.id = String(r.id);

const $ = (s, el = document) => el.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = Object.fromEntries(rockets.map(r => [r.id, r]));
const sorted = [...rockets].sort((a, b) => b.height - a.height);
const featuredRocket = byId[featured] || noHeight.find(r => r.id === featured);
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = t => 1 - (1 - t) ** 3;

// ---------- formatting ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = n => n.toLocaleString('en-US');
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th');
function rankSentence(r) {
  const flying = rockets.filter(o => o.inWindow !== false && o.id !== r.id);
  const taller = flying.filter(o => o.height > r.height).length;
  const ties = flying.filter(o => o.height === r.height).length + 1;
  const pos = taller + 1;
  const which = pos === 1 ? (ties > 1 ? 'joint tallest' : 'tallest') : `${ties > 1 ? 'joint ' : ''}${ordinal(pos)} tallest`;
  const n = flying.length + 1, when = windowLabel.toLowerCase();
  return r.inWindow === false
    ? `Not flying in the ${when}, but it would be the ${which} of ${n} rockets.`
    : `The ${which} of ${n} rockets flying in the ${when}.`;
}
const STATS = [
  ['height', 'Height', 'm', v => v],
  ['diameter', 'Diameter', 'm', v => v],
  ['leo', 'To low Earth orbit', 'kg', fmt],
  ['gto', 'To GTO', 'kg', fmt],
  ['thrust', 'Liftoff thrust', 'kN', fmt],
  ['mass', 'Liftoff mass', 't', fmt],
];
function statsHTML(r) {
  return STATS.map(([k, label, unit, f]) => `<div class="ln-stat"><div class="ln-stat-label">${label}</div>${
    r[k] == null ? '<div class="ln-stat-na">Not published</div>' : `<div class="ln-stat-value">${f(r[k])}<span>${unit}</span></div>`}</div>`).join('');
}

// ---------- silhouette svg helpers ----------
function silGroup(id, cls = '') {
  const s = byId[id].sil, g = document.createElementNS(NS, 'g');
  g.setAttribute('class', cls);
  g.innerHTML = s.silhouette.map(d => `<path d="${d}"/>`).join('') +
    `<g class="detail">${s.detail.map(d => `<path d="${d}"/>`).join('')}</g>`;
  return g;
}
function silSVG(id, cls) {
  const r = byId[id], s = r.sil, svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `${s.viewBox[0]} 0 ${s.viewBox[2]} ${r.height}`);
  svg.setAttribute('class', cls);
  svg.setAttribute('overflow', 'visible');
  svg.appendChild(silGroup(id));
  return svg;
}

// ---------- line-up chart (desktop) ----------
// Keep axis labels inside their slot (~6.6px per character at 12px).
const SHORT = [[/^Long March /i, 'LM-'], [/^Space Launch System \(SLS\)/i, 'SLS'], [/^Firefly /i, '']];
const fit = (s, w) => {
  const n = Math.max(4, Math.floor((w - 6) / 6.6));
  if (s.length > n) s = SHORT.reduce((acc, [re, rep]) => acc.replace(re, rep), s);
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};
const chartEl = $('#ln-chart'), listEl = $('#ln-ranked');
function renderChart() {
  const W = Math.floor(chartEl.clientWidth), Hpx = 380, top = 26, left = 48, bottom = 44;
  const plotH = Hpx - top - bottom, maxM = 125, k = plotH / maxM;
  const slots = sorted.length + noHeight.length, slotW = (W - left) / slots;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', W); svg.setAttribute('height', Hpx);
  svg.setAttribute('role', 'list');
  let html = '';
  for (let m = 0; m <= maxM; m += 25) {
    const y = top + plotH - m * k;
    html += `<line class="grid" x1="${left}" x2="${W}" y1="${y}" y2="${y}"/><text class="axis" x="0" y="${y + 4}">${m} m</text>`;
  }
  svg.innerHTML = html;
  const base = top + plotH;
  sorted.forEach((r, i) => {
    const cx = left + slotW * (i + 0.5);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `rocket${r.id === featured ? ' featured' : ''}`);
    g.setAttribute('role', 'listitem'); g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', `${r.name}, ${r.height} metres. Open in 3D`);
    g.dataset.id = r.id;
    const hit = document.createElementNS(NS, 'rect');
    Object.entries({ x: cx - slotW / 2, y: top - 20, width: slotW, height: plotH + bottom + 20, class: 'hit' }).forEach(([a, v]) => hit.setAttribute(a, v));
    g.appendChild(hit);
    const sil = silGroup(r.id, 'sil');
    sil.setAttribute('transform', `translate(${cx} ${base - r.height * k}) scale(${k})`);
    g.appendChild(sil);
    const lab = document.createElementNS(NS, 'g');
    lab.innerHTML = `<text class="val" x="${cx}" y="${base - r.height * k - 8}">${r.height}</text>
      <g class="pill" transform="translate(${cx} ${base - r.height * k - 30})"><rect x="-22" y="-11" width="44" height="18" rx="9"/><text y="2">3D ↗</text></g>
      <text class="name" x="${cx}" y="${base + 20}">${esc(fit(r.name, slotW))}</text>`;
    g.appendChild(lab);
    svg.appendChild(g);
  });
  noHeight.forEach((r, j) => {
    const cx = left + slotW * (sorted.length + j + 0.5), h = 60 * k, w = Math.min(28, slotW * 0.5);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `nohe${r.id === featured ? ' featured' : ''}`);
    g.innerHTML = `<rect x="${cx - w / 2}" y="${base - 75 * k}" width="${w}" height="${75 * k}" rx="3"/>
      <text class="q" x="${cx}" y="${base - 37 * k + 6}">?</text>
      <text class="name" x="${cx}" y="${base + 20}">${esc(fit(r.name, slotW))}</text><text class="sub" x="${cx}" y="${base + 36}">no height</text>`;
    svg.appendChild(g);
    void h;
  });
  chartEl.replaceChildren(svg);
}

// ---------- ranked list (narrow) ----------
function renderList() {
  const maxH = sorted[0].height;
  listEl.innerHTML = '';
  sorted.forEach(r => {
    const row = document.createElement('button');
    row.className = `ln-row${r.id === featured ? ' featured' : ''}`;
    row.dataset.id = r.id;
    row.setAttribute('aria-label', `${r.name}, ${r.height} metres. Open in 3D`);
    row.innerHTML = `<span class="rname">${esc(r.name)}</span><span class="ln-track"></span><span class="rval">${r.height} m</span>`;
    // lying down, tip to the right, same metres-per-pixel for every row
    const s = r.sil, svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 ${s.viewBox[0]} ${r.height} ${s.viewBox[2]}`);
    svg.setAttribute('class', 'sil lying');
    svg.style.width = `${(r.height / maxH) * 100}%`;
    const g = silGroup(r.id); g.setAttribute('transform', `matrix(0 1 -1 0 ${r.height} 0)`);
    svg.appendChild(g);
    $('.ln-track', row).appendChild(svg);
    listEl.appendChild(row);
  });
}

function renderModule() {
  const r = featuredRocket;
  if (!$('#ln-title').textContent.trim()) $('#ln-title').textContent = title || (byId[featured] ? rankSentence(r) : '');
  if (r) $('#ln-stats').innerHTML = statsHTML(r);
  if (!$('#ln-caption').textContent.trim()) {
    const missing = noHeight.filter(n => n.id !== featured).map(n => n.name);
    $('#ln-caption').textContent = `Outlines drawn to scale at each rocket's published height and core diameter. Select any rocket to open it in 3D.${
      missing.length ? ` No published height, so not shown: ${missing.join(', ')}.` : ''}`;
  }
  renderChart(); renderList();
}
renderModule();
let lastW = 0;
new ResizeObserver(() => { const w = chartEl.clientWidth; if (w && Math.abs(w - lastW) > 1) { lastW = w; renderChart(); } }).observe(chartEl);

function sourceEl(id) {
  const narrow = getComputedStyle(listEl).display !== 'none';
  return narrow ? $(`.ln-row[data-id="${id}"] svg`, listEl) : $(`.rocket[data-id="${id}"] .sil`, chartEl);
}

// ---------- 3D viewer ----------
if (!$('#ln-viewer')) document.body.insertAdjacentHTML('beforeend', VIEWER_HTML);
const viewer = $('#ln-viewer'), stage = $('#ln-stage'), canvas = $('#ln-gl');
let renderer, scene, camera, controls, current = null, currentId = null, open = false, busy = false;
const cache = new Map();
const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cam = { az: 0, el: 0, dist: 100, tx: 0, ty: 50 };
let person, ground;

function initGL() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  camera = new THREE.PerspectiveCamera(28, 1, 0.1, 5000);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(60, 120, 90); scene.add(key);
  const rim = new THREE.DirectionalLight('#7fb2ff', 1.6); rim.position.set(-80, 60, -100); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#bcd2ff', '#0a0f1e', 0.5));
  // ground glow
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(30,144,255,0.35)'); gr.addColorStop(0.35, 'rgba(30,144,255,0.10)'); gr.addColorStop(1, 'rgba(30,144,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.49, 0.5, 96), new THREE.MeshBasicMaterial({ color: '#2a3a5c', transparent: true, opacity: 0.8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; ground.add(ring); ring.rotation.x = 0;
  // 1.8 m person for scale
  person = new THREE.Group();
  const pm = new THREE.MeshStandardMaterial({ color: '#1e90ff', emissive: '#1e90ff', emissiveIntensity: 0.6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.0, 4, 12), pm); body.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), pm); head.position.y = 1.62;
  person.add(body, head); person.visible = false; scene.add(person);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enabled = false;
  controls.addEventListener('start', () => { autoSpin = false; $('#ln-btn-spin').setAttribute('aria-pressed', 'false'); });
  new ResizeObserver(resize).observe(stage);
  resize();
  renderer.setAnimationLoop(tick);
}
let autoSpin = false;
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
function frameDist(r) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const byH = (r.height * 1.0) / (0.78 * 2 * Math.tan(vfov / 2));
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const byW = (current?.userData.radius * 2 || r.diameter) / (0.6 * 2 * Math.tan(hfov / 2));
  return Math.max(byH, byW);
}
function applyCam() {
  const { az, el, dist, tx, ty } = cam;
  camera.position.set(tx + dist * Math.sin(az) * Math.cos(el), ty + dist * Math.sin(el), dist * Math.cos(az) * Math.cos(el));
  camera.lookAt(tx, ty, 0);
  controls.target.set(tx, ty, 0);
}
function tick() {
  if (!open && !busy) return;
  if (controls.enabled) {
    if (autoSpin) { const o = camera.position.clone().sub(controls.target); o.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.0035); camera.position.copy(controls.target).add(o); }
    controls.update();
  }
  renderer.render(scene, camera);
}
function tween(ms, fn) {
  return new Promise(res => {
    if (REDUCED) ms = Math.min(ms, 1);
    const t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / ms); fn(t); t < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
}

// ----- models -----
// Some downloaded models are not modelled upright: align the longest principal axis with +Y, tip up.
function uprightFix(obj) {
  obj.updateMatrixWorld(true);
  const pts = [], v = new THREE.Vector3();
  obj.traverse(m => {
    const pos = m.isMesh && m.geometry.attributes.position;
    if (!pos) return;
    const step = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
  });
  if (pts.length < 10) return;
  const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length);
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of pts) { const d = [p.x - c.x, p.y - c.y, p.z - c.z]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += d[i] * d[j]; }
  let e = new THREE.Vector3(0.3, 1, 0.2).normalize();
  for (let k = 0; k < 60; k++) {
    e = new THREE.Vector3(C[0][0] * e.x + C[0][1] * e.y + C[0][2] * e.z, C[1][0] * e.x + C[1][1] * e.y + C[1][2] * e.z, C[2][0] * e.x + C[2][1] * e.y + C[2][2] * e.z).normalize();
  }
  if (e.y < 0) e.negate();
  if (e.y > Math.cos(THREE.MathUtils.degToRad(4))) return; // already upright
  // tip up: the narrow end should be at the top
  const proj = pts.map(p => p.clone().sub(c).dot(e)), lo = Math.min(...proj), hi = Math.max(...proj), L = hi - lo;
  const spread = (a, b) => { let s = 0, n = 0; pts.forEach((p, i) => { if (proj[i] >= a && proj[i] <= b) { s += p.clone().sub(c).projectOnPlane(e).length(); n++; } }); return n ? s / n : 0; };
  if (spread(hi - L * 0.1, hi) > spread(lo, lo + L * 0.1)) e.negate();
  obj.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(e, new THREE.Vector3(0, 1, 0)));
}
function normalise(obj, r) {
  uprightFix(obj);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const s = r.height / size.y;
  const wrap = new THREE.Group();
  obj.position.set(obj.position.x - ctr.x, obj.position.y - box.min.y, obj.position.z - ctr.z);
  wrap.add(obj); wrap.scale.setScalar(s);
  const outer = new THREE.Group(); outer.add(wrap);
  outer.userData.radius = (Math.max(size.x, size.z) / 2) * s;
  return outer;
}
function loadModel(r) {
  if (cache.has(r.id)) return cache.get(r.id);
  const p = r.model
    ? (window.__MODELS?.[r.id]
        ? Promise.resolve().then(() => gltf.parseAsync(Uint8Array.from(atob(window.__MODELS[r.id]), c => c.charCodeAt(0)).buffer, ''))
        : gltf.loadAsync(r.model)).then(g => ({ obj: normalise(g.scene, r), real: true })).catch(e => { console.warn('model failed', r.id, e); return { obj: buildRocket(r, r.sil), real: false }; })
    : Promise.resolve({ obj: buildRocket(r, r.sil), real: false });
  cache.set(r.id, p);
  return p;
}
function setModel(r, m) {
  if (current) scene.remove(current);
  const holder = new THREE.Group(); holder.add(m.obj);
  holder.userData.radius = m.obj.userData.radius || r.diameter / 2;
  current = holder; currentId = r.id; scene.add(holder);
  const gs = Math.max(r.height * 0.9, holder.userData.radius * 6);
  ground.scale.set(gs, gs, 1);
  person.position.set(holder.userData.radius + 2.5, 0, 2);
  renderCredit(r, m.real);
}
function renderCredit(r, real) {
  const c = r.credit;
  $('#ln-credit').innerHTML = real && c && c.original
    ? `3D model by <a href="${c.authorUrl}" target="_blank" rel="noopener">${c.author}</a>, built from the line-up silhouette. Scaled to published height.`
    : real && c
    ? `3D model: <a href="${c.source}" target="_blank" rel="noopener">“${c.title}”</a> by <a href="${c.authorUrl}" target="_blank" rel="noopener">${c.author}</a>, <a href="${c.licenseUrl}" target="_blank" rel="noopener">${c.license}</a>. Scaled to published height.`
    : 'Preview model generated from the line-up silhouette. A detailed model can replace it.';
}

// ----- panel -----
function renderPanel(r) {
  $('#ln-v-eyebrow').textContent = [r.provider, r.inWindow === false ? '' : windowLabel].filter(Boolean).join(' · ');
  $('#ln-v-name').textContent = r.name;
  $('#ln-v-rank').textContent = rankSentence(r);
  $('#ln-v-stats').innerHTML = statsHTML(r);
  $('#ln-v-facts').innerHTML = [
    ['Stages', r.stages], ['Side boosters', r.boosters == null ? null : r.boosters || 'None'], ['First flight', r.firstFlight],
    ['Reuse', typeof r.reusable === 'boolean' ? (r.reusable ? 'Reusable' : 'Expendable') : r.reusable],
  ].filter(([, v]) => v != null && v !== '').map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  const link = $('#ln-v-link');
  link.hidden = !r.url || r.id === featured;
  if (r.url) link.href = r.url;
  document.querySelectorAll('#ln-strip button').forEach(b => b.classList.toggle('ln-active', b.dataset.id === r.id));
  const i = sorted.indexOf(r);
  $('#ln-v-prev').disabled = i === 0; $('#ln-v-next').disabled = i === sorted.length - 1;
}
(function renderStrip() {
  const strip = $('#ln-strip'), maxH = sorted[0].height;
  sorted.forEach(r => {
    const b = document.createElement('button');
    b.dataset.id = r.id; b.title = r.name; b.setAttribute('aria-label', r.name);
    const svg = silSVG(r.id, 'sil');
    svg.style.height = `${(r.height / maxH) * 100}%`;
    b.appendChild(svg);
    b.addEventListener('click', () => switchTo(r.id));
    strip.appendChild(b);
  });
})();

// ----- ghost silhouette used for the 2D -> 3D hand-off -----
function makeGhost(id) {
  const g = silSVG(id, 'ln-ghost');
  g.classList.toggle('featured', id === featured);
  document.body.appendChild(g);
  return g;
}
function projectedRect(r) {
  const sr = canvas.getBoundingClientRect();
  const p = v => v.project(camera);
  const tip = p(new THREE.Vector3(0, r.height, 0)), base = p(new THREE.Vector3(0, 0, 0));
  const yT = sr.top + (1 - tip.y) / 2 * sr.height, yB = sr.top + (1 - base.y) / 2 * sr.height;
  const cx = sr.left + (tip.x + 1) / 2 * sr.width;
  const h = yB - yT, vb = r.sil.viewBox, w = h * vb[2] / r.height;
  return { left: cx - w * (-vb[0] / vb[2]), top: yT, width: w, height: h };
}
function placeGhost(g, rect) {
  Object.assign(g.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
}
function fromTransform(src, dst, lying) {
  const sc = { x: src.left + src.width / 2, y: src.top + src.height / 2 };
  const dc = { x: dst.left + dst.width / 2, y: dst.top + dst.height / 2 };
  const s = (lying ? src.width : src.height) / dst.height;
  return `translate(${sc.x - dc.x}px, ${sc.y - dc.y}px) rotate(${lying ? 90 : 0}deg) scale(${s})`;
}
const isLying = el => !!el?.closest('.ln-row');

function frontPose(r) {
  Object.assign(cam, { az: 0, el: 0, tx: 0, ty: r.height / 2, dist: frameDist(r) });
}
const HERO = { az: 0.62, el: 0.16 };

async function openViewer(id) {
  if (busy || open) return;
  busy = true;
  const r = byId[id], src = sourceEl(id);
  const srcRect = src?.getBoundingClientRect();
  viewer.hidden = false;
  document.documentElement.classList.add('ln-locked');
  initGL(); resize();
  renderPanel(r);
  const modelP = loadModel(r);
  // pre-frame the camera so we know where the silhouette will land
  if (current) scene.remove(current);
  current = null; frontPose(r); applyCam(); camera.updateMatrixWorld();
  const dst = projectedRect(r);
  const ghost = makeGhost(id); placeGhost(ghost, dst);
  canvas.style.opacity = 0;
  if (src) src.style.opacity = 0;
  viewer.classList.add('ln-in');
  const fly = REDUCED || !srcRect ? Promise.resolve() : ghost.animate(
    [{ transform: fromTransform(srcRect, dst, isLying(src)) }, { transform: 'none' }],
    { duration: 720, easing: 'cubic-bezier(.2,.75,.15,1)' }).finished;
  const [m] = await Promise.all([modelP, fly]);
  setModel(r, m);
  frontPose(r); applyCam();
  current.scale.z = 0.001; // a flat cut-out that matches the silhouette exactly
  open = true;
  // cross-fade silhouette -> flat model, then inflate into 3D while the camera swings round
  ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' }).finished.then(() => ghost.remove());
  await tween(280, t => { canvas.style.opacity = t; });
  const end = { ...HERO, dist: frameDist(r) * 1.02 };
  const start = { ...cam };
  await tween(1300, t => {
    const e = ease(t);
    current.scale.z = Math.max(0.001, easeOut(Math.min(1, t * 1.4)));
    cam.az = start.az + (end.az - start.az) * e;
    cam.el = start.el + (end.el - start.el) * e;
    cam.dist = start.dist + (end.dist - start.dist) * e;
    applyCam();
  });
  current.scale.z = 1;
  controls.minDistance = r.height * 0.15; controls.maxDistance = r.height * 5;
  controls.enabled = true;
  busy = false;
  $('#ln-v-close').focus({ preventScroll: true });
}

async function closeViewer() {
  if (busy || !open) return;
  busy = true; controls.enabled = false; autoSpin = false; $('#ln-btn-spin').setAttribute('aria-pressed', 'false');
  const r = byId[currentId];
  // derive current spherical pose from the camera so the return starts where the user left it
  const o = camera.position.clone().sub(controls.target);
  Object.assign(cam, { tx: controls.target.x, ty: controls.target.y, dist: o.length(), az: Math.atan2(o.x, o.z), el: Math.asin(THREE.MathUtils.clamp(o.y / o.length(), -1, 1)) });
  const start = { ...cam }, endD = frameDist(r);
  await tween(650, t => {
    const e = ease(t);
    cam.az = start.az * (1 - e); cam.el = start.el * (1 - e);
    cam.dist = start.dist + (endD - start.dist) * e;
    cam.tx = start.tx * (1 - e); cam.ty = start.ty + (r.height / 2 - start.ty) * e;
    current.scale.z = Math.max(0.001, 1 - easeOut(Math.max(0, t * 1.3 - 0.3)));
    applyCam();
  });
  camera.updateMatrixWorld();
  const dst = projectedRect(r), ghost = makeGhost(r.id);
  placeGhost(ghost, dst);
  ghost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
  await tween(200, t => { canvas.style.opacity = 1 - t; });
  viewer.classList.remove('ln-in');
  const src = sourceEl(r.id);
  src?.scrollIntoView?.({ block: 'nearest' });
  const srcRect = src?.getBoundingClientRect();
  if (src) src.style.opacity = 0;
  if (srcRect && !REDUCED) {
    await ghost.animate([{ transform: 'none' }, { transform: fromTransform(srcRect, dst, isLying(src)) }],
      { duration: 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
  }
  document.querySelectorAll('.sil').forEach(e => { e.style.opacity = ''; });
  ghost.remove();
  viewer.hidden = true; open = false; busy = false;
  document.documentElement.classList.remove('ln-locked');
  if (current) { current.scale.z = 1; }
  (src?.closest('[data-id]'))?.focus({ preventScroll: true });
}

async function switchTo(id) {
  if (busy || !open || id === currentId) return;
  busy = true; controls.enabled = false;
  const r = byId[id], old = current;
  renderPanel(r);
  const modelP = loadModel(r);
  await tween(260, t => { old.scale.setScalar(Math.max(0.001, 1 - ease(t))); });
  const m = await modelP;
  setModel(r, m);
  current.scale.y = 0.001;
  const start = { ...cam };
  const o = camera.position.clone().sub(controls.target);
  start.az = Math.atan2(o.x, o.z); start.el = Math.asin(THREE.MathUtils.clamp(o.y / o.length(), -1, 1)); start.dist = o.length();
  start.tx = controls.target.x; start.ty = controls.target.y;
  const end = { ...HERO, dist: frameDist(r) * 1.02, tx: 0, ty: r.height / 2 };
  await tween(900, t => {
    const e = ease(t);
    current.scale.y = Math.max(0.001, easeOut(t));
    for (const k of ['az', 'el', 'dist', 'tx', 'ty']) cam[k] = start[k] + (end[k] - start[k]) * e;
    applyCam();
  });
  controls.minDistance = r.height * 0.15; controls.maxDistance = r.height * 5;
  controls.enabled = true; busy = false;
}

// ---------- wiring ----------
function onPick(e) {
  const t = e.target.closest('[data-id]');
  if (t && (t.classList.contains('rocket') || t.classList.contains('ln-row'))) openViewer(t.dataset.id);
}
chartEl.addEventListener('click', onPick);
listEl.addEventListener('click', onPick);
chartEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(e); } });
chartEl.addEventListener('pointerover', e => { const t = e.target.closest('.rocket'); if (t) loadModelEarly(t.dataset.id); });
function loadModelEarly(id) { if (renderer) loadModel(byId[id]); }
$('#ln-v-close').addEventListener('click', closeViewer);
$('#ln-v-prev').addEventListener('click', () => { const i = sorted.indexOf(byId[currentId]); if (i > 0) switchTo(sorted[i - 1].id); });
$('#ln-v-next').addEventListener('click', () => { const i = sorted.indexOf(byId[currentId]); if (i < sorted.length - 1) switchTo(sorted[i + 1].id); });
$('#ln-btn-reset').addEventListener('click', () => {
  if (busy) return;
  const r = byId[currentId], o = camera.position.clone().sub(controls.target);
  const start = { az: Math.atan2(o.x, o.z), el: Math.asin(o.y / o.length()), dist: o.length(), tx: controls.target.x, ty: controls.target.y };
  const end = { ...HERO, dist: frameDist(r) * 1.02, tx: 0, ty: r.height / 2 };
  controls.enabled = false; busy = true;
  tween(700, t => { const e = ease(t); for (const k in end) cam[k] = start[k] + (end[k] - start[k]) * e; applyCam(); })
    .then(() => { controls.enabled = true; busy = false; });
});
$('#ln-btn-spin').addEventListener('click', e => { autoSpin = !autoSpin; e.currentTarget.setAttribute('aria-pressed', String(autoSpin)); });
$('#ln-btn-person').addEventListener('click', e => {
  person.visible = !person.visible; e.currentTarget.setAttribute('aria-pressed', String(person.visible));
  if (person.visible && !busy) {
    // fly down to the base so the person is visible
    const r = byId[currentId], o = camera.position.clone().sub(controls.target);
    const start = { az: Math.atan2(o.x, o.z), el: Math.asin(o.y / o.length()), dist: o.length(), tx: controls.target.x, ty: controls.target.y };
    const end = { az: 0.5, el: 0.12, dist: Math.max(14, current.userData.radius * 5), tx: current.userData.radius * 0.6, ty: Math.min(r.height / 2, 3) };
    controls.enabled = false; busy = true;
    tween(900, t => { const e = ease(t); for (const k in end) cam[k] = start[k] + (end[k] - start[k]) * e; applyCam(); })
      .then(() => { controls.enabled = true; busy = false; });
  }
});
addEventListener('keydown', e => {
  if (!open) return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowLeft') $('#ln-v-prev').click();
  if (e.key === 'ArrowRight') $('#ln-v-next').click();
});
// demo hook: ?open=falcon9
const q = new URLSearchParams(location.search).get('open');
if (q && byId[q]) setTimeout(() => openViewer(q), 400);
window.__lineup = { openViewer, closeViewer, switchTo, state: () => ({ open, busy, currentId }) };
}
