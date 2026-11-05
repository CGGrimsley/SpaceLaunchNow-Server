// Per-vehicle assets: silhouette (silhouettes.js), optional detailed model (models/<key>.glb + credits.js)
// and the paint/booster layout used when a preview model is generated from the silhouette.
import { CREDITS } from './credits.js';
import { SILHOUETTES } from './silhouettes.js';

export const ASSETS = {
  starship: { ringBoosters: 0, paint: { body: '#b9bec6', metal: 0.85, rough: 0.32, fins: '#8f949c', engine: '#2a2d33' } },
  sls: { ringBoosters: 2, paint: { body: '#d9822b', boosters: '#eceae4', fins: '#eceae4', top: '#eceae4', engine: '#2a2d33' } },
  newglenn: { ringBoosters: 0, paint: { body: '#eef0f3', fins: '#2b4a8c', engine: '#2a2d33' } },
  falcon9: { ringBoosters: 0, paint: { body: '#f2f3f5', fins: '#3a3d44', engine: '#2a2d33' } },
  falconheavy: { ringBoosters: 2, paint: { body: '#f2f3f5', boosters: '#f2f3f5', fins: '#3a3d44', engine: '#2a2d33' } },
  ariane6: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e6e6e2', fins: '#e6e6e2', engine: '#2a2d33' } },
  vulcan: { ringBoosters: 6, paint: { body: '#d98a3a', boosters: '#eceae4', top: '#eceae4', fins: '#eceae4', engine: '#2a2d33' } },
  atlasv: { ringBoosters: 5, paint: { body: '#c27b3c', boosters: '#eceae4', top: '#eceae4', fins: '#eceae4', engine: '#2a2d33' } },
  longmarch5: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#f0f0ee', fins: '#f0f0ee', engine: '#2a2d33' } },
  soyuz: { ringBoosters: 4, paint: { body: '#c9cdbf', boosters: '#c9cdbf', top: '#eceae4', fins: '#c9cdbf', engine: '#2a2d33' } },
  vegac: { ringBoosters: 0, paint: { body: '#eceae4', fins: '#eceae4', engine: '#2a2d33' } },
  kuaizhou: { ringBoosters: 0, paint: { body: '#eceae4', fins: '#c23b3b', engine: '#2a2d33' } },
  electron: { ringBoosters: 0, paint: { body: '#1d1f24', metal: 0.2, rough: 0.6, fins: '#1d1f24', engine: '#111214' } },
};

for (const [k, a] of Object.entries(ASSETS)) {
  a.sil = SILHOUETTES[k];
  a.credit = CREDITS[k] || null;
}
