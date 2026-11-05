// Markup for the full-screen 3D viewer, injected once per page.
export const VIEWER_HTML = `<div id="ln-viewer" hidden role="dialog" aria-modal="true" aria-labelledby="ln-v-name">
  <div id="ln-stage">
    <canvas id="ln-gl" aria-label="3D model. Drag to rotate, scroll or pinch to zoom."></canvas>
    <div class="ln-vtop">
      <button class="ln-btn" id="ln-v-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>Line-up</button>
    </div>
    <div id="ln-credit"></div>
    <div class="ln-tools">
      <button class="ln-btn" id="ln-btn-reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Reset view</button>
      <button class="ln-btn" id="ln-btn-spin" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="4"/><path d="M12 2v20"/></svg>Spin</button>
      <button class="ln-btn" id="ln-btn-person" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7m0 0-3 6m3-6 3 6M8 11h8"/></svg>Human scale</button>
    </div>
    <div class="ln-howto">Drag to rotate · Scroll to zoom · Right-drag to pan · Esc to close</div>
  </div>
  <aside class="ln-vpanel">
    <div>
      <div class="ln-eyebrow" id="ln-v-eyebrow"></div>
      <h2 id="ln-v-name"></h2>
    </div>
    <p class="ln-rank" id="ln-v-rank"></p>
    <div class="ln-stats" id="ln-v-stats"></div>
    <dl class="ln-facts" id="ln-v-facts"></dl>
    <a class="ln-open" id="ln-v-link" hidden>Open vehicle page →</a>
    <div class="ln-strip-wrap">
      <div class="ln-strip-head"><span class="ln-eyebrow">Line-up</span>
        <div class="ln-navbtns"><button class="ln-btn" id="ln-v-prev" aria-label="Taller rocket">‹</button><button class="ln-btn" id="ln-v-next" aria-label="Shorter rocket">›</button></div>
      </div>
      <div id="ln-strip"></div>
    </div>
  </aside>
</div>`;
