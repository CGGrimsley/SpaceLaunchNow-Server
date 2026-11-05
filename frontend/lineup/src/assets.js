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
  lm2c: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm2d: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm3b: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm4c: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm5b: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm6a: { ringBoosters: 4, paint: { body: '#e9e6dc', boosters: '#f0f0ee', fins: '#f0f0ee', engine: '#2a2d33' } },
  lm7: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm7a: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm8: { ringBoosters: 2, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  lm12: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  zhuque2e: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  ceres1: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  kinetica1: { ringBoosters: 0, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  gravity1: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  pslv: { ringBoosters: 6, paint: { body: '#eceae4', boosters: '#d9d4c5', fins: '#d9d4c5', engine: '#2a2d33' } },
  lvm3: { ringBoosters: 2, paint: { body: '#eceae4', boosters: '#cfd2d6', fins: '#cfd2d6', engine: '#2a2d33' } },
  h3: { ringBoosters: 2, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  angaraa5: { ringBoosters: 4, paint: { body: '#f0f0ee', boosters: '#e9e9e4', fins: '#e9e9e4', engine: '#2a2d33' } },
  fireflyalpha: { ringBoosters: 0, paint: { body: '#1d1f24', metal: 0.2, rough: 0.6, fins: '#e9e9e4', engine: '#111214' } },
  neutron: { ringBoosters: 0, paint: { body: '#1d1f24', metal: 0.2, rough: 0.6, fins: '#1d1f24', engine: '#111214' } },
};

for (const [k, a] of Object.entries(ASSETS)) {
  a.sil = SILHOUETTES[k];
  a.credit = CREDITS[k] || null;
}
