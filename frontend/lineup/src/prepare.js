// Attach drawing assets (silhouette, preview-model paint, detailed model + credit) to rocket records.
import { ASSETS } from './assets.js';

const DEFAULT_PAINT = { body: '#eceef2', fins: '#9aa3b5', engine: '#2a2d33' };

// Stretch a silhouette drawn at its own height to the height we are showing.
function scaleSil(sil, height) {
  const native = sil.viewBox[3] - 0.6; // viewBox is [x, -0.3, width, height + 0.6]
  const f = height / native;
  if (Math.abs(f - 1) < 0.005) return sil;
  const scaleD = d => {
    let i = 0;
    return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, n => (i++ % 2 ? String(+(parseFloat(n) * f).toFixed(3)) : n));
  };
  return { viewBox: [sil.viewBox[0], -0.3, sil.viewBox[2], height + 0.6], silhouette: sil.silhouette.map(scaleD), detail: sil.detail.map(scaleD) };
}

// Plain nose-cone-and-body outline for vehicles that have no drawn silhouette yet.
export function genericSil(height, diameter) {
  const r = Math.max((diameter || height / 14) / 2, 0.3), H = height, n = Math.min(H * 0.14, r * 4);
  const f = v => +v.toFixed(3);
  const d = `M0,0 C${f(r * 0.55)},${f(n * 0.1)} ${f(r)},${f(n * 0.5)} ${f(r)},${f(n)} L${f(r)},${f(H)} L${f(-r)},${f(H)} ` +
    `L${f(-r)},${f(n)} C${f(-r)},${f(n * 0.5)} ${f(-r * 0.55)},${f(n * 0.1)} 0,0 Z`;
  const detail = [0.3, 0.55, 0.85].map(t => `M${f(-r)},${f(H * t)} L${f(r)},${f(H * t)}`);
  return { viewBox: [f(-r * 1.25), -0.3, f(r * 2.5), f(H + 0.6)], silhouette: [d], detail };
}

export function prepare(rocket, modelBase) {
  const a = ASSETS[rocket.asset];
  if (rocket.height) rocket.sil = a ? scaleSil(a.sil, rocket.height) : genericSil(rocket.height, rocket.diameter);
  rocket.paint = a?.paint || DEFAULT_PAINT;
  rocket.ringBoosters = a?.ringBoosters ?? 0;
  if (a?.credit) { rocket.model = `${modelBase}${rocket.asset}.glb`; rocket.credit = a.credit; }
  return rocket;
}
