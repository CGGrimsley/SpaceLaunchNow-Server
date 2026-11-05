// Launch vehicle page: data comes from the server (web/lineup.py) via json_script.
import { mount } from './app.js';
import { prepare } from './prepare.js';

const root = document.getElementById('ln-module');
const el = document.getElementById('ln-data');
if (root && el) {
  const data = JSON.parse(el.textContent);
  const base = root.dataset.modelBase;
  mount({
    rockets: data.rockets.map(r => prepare(r, base)),
    noHeight: data.no_height,
    featured: data.featured,
    windowLabel: data.window_label,
  });
}
