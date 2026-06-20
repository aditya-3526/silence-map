/* nav.js — wires the four header nav buttons to a shared overlay.
 *   LIVE    → close any panel/overlay, return to the globe
 *   METHOD  → render METHODOLOGY.md into the overlay
 *   SOURCES → table of the five data sources, with links
 *   ABOUT   → one-paragraph description + GitHub link
 * Usage: new Nav({ onLive }) */

/* compact, dependency-free Markdown → HTML.
 * Supports: headings, paragraphs, bold/italic/inline-code/links, ordered &
 * unordered lists, blockquotes, fenced code, tables, and horizontal rules —
 * the subset METHODOLOGY.md uses. */
function renderMarkdown(md) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = s => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const isBlockStart = l => /^(#{1,6}\s|```|>|\s*[-*]\s|\s*\d+\.\s|\|)/.test(l) || /^---+\s*$/.test(l) || /^\s*$/.test(l);
  let html = '';

  for (let i = 0; i < lines.length;) {
    const line = lines[i];

    if (/^```/.test(line)) {                                   // fenced code
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`; continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }                 // blank
    if (/^---+\s*$/.test(line)) { html += '<hr>'; i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);                 // heading
    if (h) { const lvl = h[1].length; html += `<h${lvl}>${inline(h[2])}</h${lvl}>`; i++; continue; }

    if (/^>\s?/.test(line)) {                                  // blockquote
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      html += `<blockquote>${inline(buf.join(' '))}</blockquote>`; continue;
    }

    if (line.includes('|') && i + 1 < lines.length &&         // table
        /^[\s|:-]+$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const cells = r => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      const head = cells(line); i += 2;
      let t = '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        t += '<tr>' + cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; i++;
      }
      html += t + '</tbody></table>'; continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {                            // unordered list
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      html += '<ul>' + buf.map(b => `<li>${inline(b)}</li>`).join('') + '</ul>'; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {                           // ordered list
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      html += '<ol>' + buf.map(b => `<li>${inline(b)}</li>`).join('') + '</ol>'; continue;
    }

    const buf = [];                                           // paragraph
    while (i < lines.length && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    html += `<p>${inline(buf.join(' '))}</p>`;
  }
  return html;
}

class Nav {
  constructor({ onLive }) {
    this.onLive = onLive || (() => {});
    this.overlay = document.getElementById('overlay');
    this.titleEl = document.getElementById('overlay-title');
    this.bodyEl = document.getElementById('overlay-body');
    this._mdCache = null;
    this._bind();
  }

  _bind() {
    document.querySelectorAll('[data-nav]').forEach(el =>
      el.addEventListener('click', () => this.handle(el.dataset.nav)));
    document.getElementById('overlay-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !this.overlay.hidden) this.close(); });
  }

  handle(which) {
    switch (which) {
      case 'live': this.close(); this.onLive(); break;
      case 'method': this.method(); break;
      case 'sources': this.sources(); break;
      case 'about': this.about(); break;
    }
  }

  setActive(which) {
    document.querySelectorAll('[data-nav]').forEach(el =>
      el.classList.toggle('active', el.dataset.nav === which));
  }

  open(title, html, which) {
    this.titleEl.textContent = title;
    this.bodyEl.innerHTML = html;
    this.overlay.hidden = false;
    this.bodyEl.scrollTop = 0;
    this.setActive(which);
  }
  close() { this.overlay.hidden = true; this.setActive('live'); }

  async method() {
    if (!this._mdCache) {
      try {
        const md = await fetch('METHODOLOGY.md').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
        this._mdCache = renderMarkdown(md);
      } catch (e) {
        this._mdCache = `<p class="overlay-muted">Couldn't load METHODOLOGY.md (${e.message}). ` +
          `Read it on <a href="${window.REPO_URL}/blob/main/METHODOLOGY.md" target="_blank" rel="noopener">GitHub ↗</a>.</p>`;
      }
    }
    this.open('Methodology', this._mdCache, 'method');
  }

  sources() {
    const rows = window.DATA_SOURCES.map(s => `<tr>
        <td><a href="${s.url}" target="_blank" rel="noopener">${s.name} ↗</a></td>
        <td>${s.provides}</td>
        <td><span class="src-status">${s.status}</span></td>
      </tr>`).join('');
    const html = `<table class="src-table">
        <thead><tr><th>Source</th><th>What it provides</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    this.open('Data sources', html, 'sources');
  }

  about() {
    const html = `<p class="overlay-lead">${window.ABOUT_TEXT}</p>
      <p><a class="overlay-link" href="${window.REPO_URL}" target="_blank" rel="noopener">View the project on GitHub ↗</a></p>`;
    this.open('About', html, 'about');
  }
}

window.renderMarkdown = renderMarkdown;
window.Nav = Nav;
