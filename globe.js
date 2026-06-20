/* globe.js — D3 orthographic globe with auto-rotate, drag, hover & click-to-select.
 * Usage: new Globe({ canvas, tooltip, regions, onSelect, getSelectedId }) */

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

class Globe {
  constructor({ canvas, tooltip, regions, onSelect, getSelectedId }) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.regions = regions;
    this.onSelect = onSelect;
    this.getSelectedId = getSelectedId || (() => null);

    this.byCountry = {};
    for (const r of regions) this.byCountry[r.countryId] = r;

    this.rotation = [-30, -14];
    this.autoRotate = true;
    this.dragging = false;
    this.moved = 0;
    this.time = 0;

    this.loop = this.loop.bind(this);
  }

  start() {
    this.attach();
    this.loadWorld();
    this.raf = requestAnimationFrame(this.loop);
  }
  stop() { cancelAnimationFrame(this.raf); }

  async loadWorld() {
    if (!window.d3 || !window.topojson) return;
    try {
      const w = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
      this.countries = window.topojson.feature(w, w.objects.countries).features;
      this.borders = window.topojson.mesh(w, w.objects.countries, (a, b) => a !== b);
    } catch (e) { /* land is an enhancement; globe still draws */ }
  }

  loop() {
    this.time = performance.now();
    if (this.autoRotate && !this.dragging) this.rotation[0] += 0.12;
    try { this.draw(); } catch (e) { /* keep the loop alive */ }
    this.raf = requestAnimationFrame(this.loop);
  }

  draw() {
    const c = this.canvas; if (!c || !window.d3) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const ctx = c.getContext('2d'); ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
    const d3 = window.d3;
    const R = Math.min(w, h) / 2 - 30;
    const proj = d3.geoOrthographic().translate([w / 2, h / 2]).scale(R).rotate(this.rotation).clipAngle(90);
    const path = d3.geoPath(proj, ctx);

    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = '#0c0c15'; ctx.fill();
    ctx.beginPath(); path(d3.geoGraticule10()); ctx.lineWidth = 0.5; ctx.strokeStyle = 'rgba(120,130,165,0.055)'; ctx.stroke();

    if (this.countries) {
      for (const f of this.countries) {
        ctx.beginPath(); path(f);
        const r = this.byCountry[f.id];
        ctx.fillStyle = r ? hexA(r.color, 0.16) : '#16161f'; ctx.fill();
      }
      ctx.beginPath(); path(this.borders); ctx.lineWidth = 0.5; ctx.strokeStyle = 'rgba(145,155,175,0.11)'; ctx.stroke();
    }
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(160,170,205,0.13)'; ctx.stroke();

    const center = [-this.rotation[0], -this.rotation[1]];
    for (const r of this.regions) {
      const dist = d3.geoDistance([r.lon, r.lat], center);
      if (dist > Math.PI / 2) { r._screen = null; continue; }
      r._screen = proj([r.lon, r.lat]);
      this.marker(ctx, r._screen, r);
    }
    ctx.restore();
  }

  marker(ctx, p, r) {
    const selected = r.id === this.getSelectedId();
    const ph = (Math.sin(this.time / 620 + r.lon) + 1) / 2;
    ctx.beginPath(); ctx.arc(p[0], p[1], 7 + ph * 12, 0, 2 * Math.PI);
    ctx.strokeStyle = hexA(r.color, 0.05 + 0.22 * (1 - ph)); ctx.lineWidth = 1.2; ctx.stroke();
    if (selected) { ctx.beginPath(); ctx.arc(p[0], p[1], 14, 0, 2 * Math.PI); ctx.strokeStyle = hexA(r.color, 0.9); ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(p[0], p[1], 3.6, 0, 2 * Math.PI); ctx.fillStyle = r.color; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  }

  regionAt(ox, oy) {
    let best = null, bd = 18;
    for (const r of this.regions) {
      if (!r._screen) continue;
      const d = Math.hypot(r._screen[0] - ox, r._screen[1] - oy);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }

  attach() {
    const c = this.canvas;
    c.addEventListener('pointerenter', () => { this.autoRotate = false; });
    c.addEventListener('pointerleave', () => { this.autoRotate = true; this.dragging = false; this.hideTip(); c.style.cursor = 'grab'; });
    c.addEventListener('pointerdown', (e) => {
      this.dragging = true; this.moved = 0; this.lastX = e.clientX; this.lastY = e.clientY;
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
      c.style.cursor = 'grabbing';
    });
    c.addEventListener('pointermove', (e) => {
      const rect = c.getBoundingClientRect();
      const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
      if (this.dragging) {
        const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
        this.lastX = e.clientX; this.lastY = e.clientY;
        this.moved += Math.abs(dx) + Math.abs(dy);
        this.rotation[0] += dx * 0.25;
        this.rotation[1] = Math.max(-85, Math.min(85, this.rotation[1] - dy * 0.25));
        this.hideTip(); return;
      }
      this.hover(ox, oy);
    });
    c.addEventListener('pointerup', (e) => {
      const rect = c.getBoundingClientRect();
      const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
      if (this.dragging && this.moved < 6) {
        const r = this.regionAt(ox, oy);
        if (r) this.onSelect(r.id);
      }
      this.dragging = false; c.style.cursor = 'grab';
    });
  }

  hover(ox, oy) {
    const r = this.regionAt(ox, oy), tip = this.tooltip, c = this.canvas;
    if (!tip) return;
    if (r) {
      c.style.cursor = 'pointer';
      tip.style.display = 'block'; tip.style.left = ox + 'px'; tip.style.top = oy + 'px';
      tip.innerHTML = `<div class="tooltip-name">${r.name}</div>` +
        `<div class="tooltip-score" style="color:${r.color}">SILENCE ${r.score} / 100</div>`;
    } else { c.style.cursor = 'grab'; this.hideTip(); }
  }
  hideTip() { if (this.tooltip) this.tooltip.style.display = 'none'; }
}

window.Globe = Globe;
