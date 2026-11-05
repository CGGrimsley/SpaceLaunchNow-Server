// Standalone mockup: sample figures from data.js.
import { mount } from './app.js';
import { ROCKETS, NO_HEIGHT, FEATURED } from './data.js';
import { prepare } from './prepare.js';

const base = window.LINEUP_MODEL_BASE || 'models/';
mount({
  rockets: ROCKETS.map(r => prepare({ ...r, asset: r.id }, base)),
  noHeight: NO_HEIGHT,
  featured: FEATURED,
});
