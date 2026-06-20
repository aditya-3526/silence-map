/* panel.js — region detail panel: slide-in, sparkline, sources, classification,
 * mutation modal, and async enrichment from live GDELT data.
 * Usage: new Panel({ stage, panel, mutation }) then .open(region) / .close() */

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function coordStr(lon, lat) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
}

function classStyle(t) {
  if (t === 'Suppression signal') return { color: '#ff6a4d', background: 'rgba(255,34,0,0.08)', border: '1px solid rgba(255,60,30,0.4)' };
  return { color: '#d8a85a', background: 'rgba(196,120,0,0.07)', border: '1px solid rgba(196,120,0,0.3)' };
}

/* turn an array of daily counts into an SVG polyline over the 320x60 viewBox */
function sparkPoints(counts) {
  const max = Math.max(3, ...counts);
  return counts.map((d, i) =>
    `${(i / (counts.length - 1) * 320).toFixed(1)},${(56 - d / max * 44).toFixed(1)}`
  ).join(' ');
}

class Panel {
  constructor({ stage, panel, mutation }) {
    this.stage = stage;
    this.panel = panel;
    this.mutationEl = mutation;
    this.region = null;
    this.token = 0; // guards against out-of-order async updates when switching regions
  }

  open(region) {
    this.region = region;
    this.token++;
    this.panel.style.setProperty('--accent', region.color);
    this.panel.innerHTML = this.render(region);
    this.stage.classList.add('panel-open');
    this.panel.classList.add('open');
    this.panel.scrollTop = 0;
    this.wire();
    this.enrich(region, this.token);
  }

  close() {
    this.stage.classList.remove('panel-open');
    this.panel.classList.remove('open');
  }

  wire() {
    this.panel.querySelector('.panel-close').onclick = () => this.close();
    const trace = this.panel.querySelector('.trace-btn');
    if (trace) trace.onclick = () => this.openMutation();
  }

  /* ---- async: pull live coverage + sources from GDELT, then patch the DOM ---- */
  async enrich(region, token) {
    const [cov, srcs] = await Promise.all([
      window.GDELT.fetchCoverage(region.query),
      window.GDELT.fetchSources(region.query)
    ]);
    if (token !== this.token) return; // a newer region was opened; drop stale results

    if (cov) {
      const line = this.panel.querySelector('.spark-line');
      if (line) {
        line.setAttribute('points', sparkPoints(cov.counts));
        line.style.animation = 'none'; void line.getBBox(); line.style.animation = '';
      }
      const cap = this.panel.querySelector('.coverage-text');
      if (cap) {
        cap.classList.remove('loading');
        cap.textContent = `Zero major-outlet stories on ${cov.zeros} of the last 30 days · live GDELT`;
      }
    }

    if (srcs) {
      const list = this.panel.querySelector('.source-list');
      if (list) list.innerHTML = srcs.map(s => this.sourceCard(s, region.color)).join('');
    }
  }

  render(r) {
    const cov = r.coverage;
    const zeros = cov.filter(d => d === 0).length;
    return `
      <div class="panel-head">
        <div class="panel-head-row">
          <div>
            <div class="panel-meta">${esc(r.country)} · ${coordStr(r.lon, r.lat)}</div>
            <h2 class="panel-title">${esc(r.name)}</h2>
          </div>
          <button class="icon-btn panel-close" aria-label="Close">✕</button>
        </div>
        <div class="panel-score-row">
          <div class="panel-score">${r.score}</div>
          <div class="panel-score-label">Silence index<br>/ 100</div>
        </div>
      </div>

      <section class="section">
        <div class="section-label">What's happening</div>
        <div class="fact-row">
          <div class="fact-cell grow"><div class="fact-key">Event</div><div class="fact-val">${esc(r.happening.type)}</div></div>
          <div class="fact-cell sev"><div class="fact-key">Severity</div><div class="fact-val accent">${esc(r.happening.severity)}</div></div>
          <div class="fact-cell pop"><div class="fact-key">Affected</div><div class="fact-val">${esc(r.happening.population)}</div></div>
        </div>
        <p class="summary">${esc(r.happening.summary)}</p>
        <div class="tags">${r.happening.sources.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head">
          <div class="section-label">Mainstream coverage</div>
          <div class="section-sub">Stories / day · 30d</div>
        </div>
        <svg class="spark" viewBox="0 0 320 60" width="100%" height="58" preserveAspectRatio="none">
          <line class="spark-base" x1="0" y1="56" x2="320" y2="56"></line>
          <polyline class="spark-line" points="${sparkPoints(cov)}"></polyline>
        </svg>
        <div class="coverage-caption">
          <span class="coverage-dot"></span>
          <span class="coverage-text loading">Zero major-outlet stories on ${zeros} of the last 30 days · loading live data…</span>
        </div>
      </section>

      <section class="section">
        <div class="section-label">What other sources say</div>
        <div class="source-list">
          ${r.sources.length
            ? r.sources.map(s => this.sourceCard(s, r.color)).join('')
            : `<div class="coverage-text loading">Loading recent articles from GDELT…</div>`}
        </div>
      </section>

      <section class="section">
        <div class="section-label">Why the silence</div>
        ${this.classBadge(r.classification.type)}
        <p class="class-text">${esc(r.classification.text)}</p>
      </section>

      ${r.mutation ? `<div class="trace-wrap">
        <button class="trace-btn">Trace this story's mutation →</button>
      </div>` : ''}`;
  }

  sourceCard(s, color) {
    const tag = s.url ? 'a' : 'div';
    const href = s.url ? ` href="${esc(s.url)}" target="_blank" rel="noopener"` : '';
    return `<${tag} class="source-card"${href} style="border-left-color:${color}">
        <div class="source-top">
          <span class="source-name">${esc(s.name)}</span>
          <span class="source-arrow">↗</span>
        </div>
        <div class="source-meta">${esc(s.type)} · ${esc(s.date)}</div>
        <div class="source-summary">${esc(s.summary)}</div>
      </${tag}>`;
  }

  classBadge(type) {
    const st = classStyle(type);
    return `<div class="class-badge" style="color:${st.color};background:${st.background};border:${st.border}">
        <span class="class-dot"></span>
        <span class="class-label">${esc(type)}</span>
      </div>`;
  }

  /* ---- mutation tracker modal ---- */
  openMutation() {
    const r = this.region;
    this.mutationEl.innerHTML = this.renderMutation(r);
    this.mutationEl.hidden = false;
    this.mutationEl.querySelector('.mutation-close').onclick = () => { this.mutationEl.hidden = true; };
  }

  renderMutation(r) {
    const tierColors = ['#e0b15a', '#9a9a86', '#76768a'];
    const stops = r.mutation.stops.map((st, i) => {
      const tc = tierColors[i] || '#76768a';
      const segs = st.segments.map(sg =>
        sg.m ? `<span class="seg-mut">${esc(sg.t)}</span>` : `<span>${esc(sg.t)}</span>`
      ).join('');
      return `<div class="stop">
          <div class="stop-marker">
            <span class="stop-idx" style="color:${tc}">${('0' + (i + 1)).slice(-2)}</span>
            <span class="stop-dot" style="background:${tc}"></span>
            <span class="stop-line"></span>
          </div>
          <div class="stop-body">
            <div class="stop-tier" style="color:${tc}">${esc(st.tier)}</div>
            <div class="stop-source">${esc(st.source)}</div>
            <div class="stop-date">${esc(st.date)}</div>
            <p class="stop-text">${segs}</p>
          </div>
        </div>`;
    }).join('');

    const changes = r.mutation.summary.map(l =>
      `<div class="change-row"><span class="change-dot"></span><span class="change-text">${esc(l.text)}</span></div>`
    ).join('');

    return `
      <div class="mutation-head">
        <div>
          <div class="mutation-eyebrow">Story mutation trace · ${esc(r.name)}</div>
          <h2 class="mutation-title">${esc(r.mutation.story)}</h2>
        </div>
        <button class="icon-btn lg mutation-close" aria-label="Close">✕</button>
      </div>
      <div class="mutation-body">
        <div class="stops">${stops}</div>
        <div class="changed">
          <div class="section-label">What changed</div>
          <div class="change-grid">${changes}</div>
        </div>
      </div>`;
  }
}

window.Panel = Panel;
