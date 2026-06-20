```
███████╗██╗██╗     ███████╗███╗   ██╗ ██████╗███████╗███╗   ███╗ █████╗ ██████╗ 
██╔════╝██║██║     ██╔════╝████╗  ██║██╔════╝██╔════╝████╗ ████║██╔══██╗██╔══██╗
███████╗██║██║     █████╗  ██╔██╗ ██║██║     █████╗  ██╔████╔██║███████║██████╔╝
╚════██║██║██║     ██╔══╝  ██║╚██╗██║██║     ██╔══╝  ██║╚██╔╝██║██╔══██║██╔═══╝ 
███████║██║███████╗███████╗██║ ╚████║╚██████╗███████╗██║ ╚═╝ ██║██║  ██║██║     
╚══════╝╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     
```

### **The silence is the story.**

*A global news-silence tracker. An interactive globe that surfaces the places where major events are unfolding but mainstream coverage is thin, fading, or absent — and names why each silence exists.*

[![JavaScript](https://img.shields.io/badge/Vanilla_JS-No_Build_Step-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org)
[![TopoJSON](https://img.shields.io/badge/TopoJSON-world--atlas-5e5e6c?style=for-the-badge)](https://github.com/topojson/world-atlas)
[![GDELT](https://img.shields.io/badge/GDELT-DOC_2.0_API-e85d00?style=for-the-badge)](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

[![Version](https://img.shields.io/badge/Release-v1.0.0-ff2200?style=for-the-badge)](https://github.com/aditya-3526/silence-map/releases/tag/v1.0.0)
[![Live Data](https://img.shields.io/badge/Live_Coverage-GDELT_+_offline_fallback-22c55e?style=for-the-badge)](data.js)

> *"Most news maps show you where the headlines are.*
> *SilenceMap shows you where they should be — and aren't."*

[**The Insight**](#-the-insight) · [**Architecture**](#-architecture) · [**Data Sources**](#-the-five-data-sources) · [**The Views**](#-the-three-views) · [**Run Locally**](#-run-it-locally) · [**Honest Framing**](#-honest-framing)

---

## 🎯 The Insight

Coverage volume is usually read as a proxy for importance — the more a story is reported, the more it must matter. SilenceMap inverts that reading: it treats a **gap** between the *severity* of what's verifiably happening on the ground and the *volume* of mainstream coverage as a signal in its own right. A region where conflict-event monitors, humanitarian situation reports, and connectivity trackers all light up, while the global news-volume timeline flatlines, is not quiet because nothing is happening — it is quiet because something is interrupting the reporting. SilenceMap measures that gap per region, scores it as a **silence index (0–100)**, and — crucially — refuses to leave it at a number: each silence is classified by *cause* (structural access collapse, editorial deprioritization, news-cycle displacement, or active suppression), because a blackout in a war zone with no foreign bureaus is a fundamentally different thing from a story a newsroom simply chose not to run.

---

## 🏗 Architecture

No build step, no framework, no bundler. Five plain files, each with one job. The globe and the panel never touch each other's internals — the bootstrap in `index.html` is the only place they're wired together, and region selection is the single event that flows between them.

```
        ┌──────────────────────────────────────────────────────────────┐
        │                     index.html (bootstrap)                   │
        │   • builds the ticker, scrubber, archive                     │
        │   • owns selectedId — the single source of truth            │
        │   • wires globe.onSelect ──▶ panel.open                      │
        └───────┬───────────────────────────────────┬──────────────────┘
        select  │                                   │  render + enrich
                ▼                                   ▼
        ┌────────────────┐                  ┌────────────────────┐
        │   Globe class  │                  │     Panel class    │
        │   (globe.js)   │                  │     (panel.js)     │
        │                │                  │                    │
        │ • orthographic │   click marker   │ • slide-in render  │
        │   projection   │ ───────────────▶ │ • sparkline math   │
        │ • auto-rotate  │   onSelect(id)   │ • source cards     │
        │ • drag / hover │                  │ • mutation modal   │
        │ • hit-testing  │                  │ • async enrich ──┐ │
        └───────┬────────┘                  └──────────────────┼─┘
                │ reads                                        │ fetch
                ▼                                              ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                          data.js                             │
        │   Pipeline    — ACLED → aggregate → GDELT → score → top 20   │
        │   ACLED        — live conflict-zone client (severity)        │
        │   GDELT        — live DOC 2.0 client (coverage + articles)   │
        │   SEED_REGIONS — 5 curated regions (instant render + fallback)│
        │   ARCHIVE[]    — notable historical silences                 │
        │                                                              │
        │   every live call has a bundled static fallback              │
        └──────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    D3 geoOrthographic · TopoJSON world-atlas
```

### The v2 region pipeline

Regions are no longer hardcoded — they're computed. `Pipeline.buildRegions()` runs the chain below, and the bootstrap renders the seed regions first so the globe is interactive within a frame, then swaps in the live results when they resolve.

```
ACLED.fetchConflictZones(30d, fatalities>0)
        │  aggregate events by country + admin1 (Σ fatalities, Σ events, centroid)
        ▼
top 35 most-severe zones  ──(bounded concurrency)──▶  GDELT.fetchCoverage(per zone)
        │
        ▼
score = round( 100 · sevNorm · (1 − covNorm) )      sevNorm = log1p(fatalities)/log1p(max)
        │  severe AND under-covered → high           covNorm = log1p(volume)/log1p(max)
        ▼
sort by score desc ──▶ top 20 surfaced automatically
```

| File | Role | Explicitly does not |
|---|---|---|
| `index.html` | Markup + bootstrap; owns `selectedId`, builds ticker/scrubber/archive | hold region data or rendering logic |
| `globe.js` | `Globe` — projection, rotation, drag, hover, click hit-testing | know what a panel is; it only emits `onSelect(id)` |
| `panel.js` | `Panel` — slide-in render, sparkline, source cards, mutation modal | fetch geometry or mutate the globe |
| `data.js` | `Pipeline` (ACLED→GDELT→score→top 20), `ACLED`/`GDELT` clients, `SEED_REGIONS`, `ARCHIVE`; live data + offline fallback | render anything to the DOM |
| `styles.css` | All styling; per-region accent via a `--accent` CSS variable | contain inline behavior |

---

## 🛰 The Five Data Sources

SilenceMap's premise only works if the "something is happening" signal comes from somewhere *other* than the news volume it's being compared against. These five feeds supply that ground truth.

| # | Source | What it provides | Status |
|---|---|---|---|
| 1 | **[ACLED](https://acleddata.com)** | Geolocated armed-conflict and political-violence events — the *severity numerator*. v2 pulls every fatal event (last 30 days, fatalities > 0) and aggregates them into conflict zones | **Live & wired** — drives the v2 region pipeline (needs a free API key) |
| 2 | **[GDELT DOC 2.0](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)** | The coverage-volume timeline (`timelinevolraw`) and recent article lists (`artlist`) — the *denominator* cross-referenced against ACLED severity | **Live & wired** — fetched per region in `data.js` |
| 3 | **[GDACS](https://www.gdacs.org)** | Global disaster alerts (floods, conflict displacement) used to corroborate sudden-onset events | Provenance feed (seed regions) |
| 4 | **[ReliefWeb](https://reliefweb.int)** | Humanitarian situation reports and flash updates — the on-the-ground reporting that *does* exist | Provenance feed (seed regions) |
| 5 | **[OCHA](https://www.unocha.org)** | UN displacement and access figures that quantify who is affected when the press cannot reach them | Provenance feed (seed regions) |

> **v2** wires ACLED and GDELT together into a live pipeline: ACLED supplies the active conflict zones and their severity, GDELT supplies the coverage each zone is (or isn't) getting, and the silence score is the divergence between the two. GDACS / ReliefWeb / OCHA remain provenance signals behind the five curated **seed regions**, which are shown instantly on load and kept as the fallback whenever the pipeline can't run. See [Honest Framing](#-honest-framing).

---

## 📸 The Three Views

| Globe View | Region Panel | Story Mutation Tracker |
|---|---|---|
| ![Globe view](docs/screenshots/globe.png) | ![Region panel](docs/screenshots/panel.png) | ![Mutation tracker](docs/screenshots/mutation.png) |

**1. Globe view** — A D3 orthographic projection rendered to canvas, auto-rotating until you grab it. Five regions pulse as markers sized by proximity to the front of the globe; hovering reads out the silence score, clicking selects. A legend maps the land tint from *none* to *suppression*, and a 3-year archive scrubber sits along the bottom.

**2. Region panel** — Slides in on selection. Leads with the silence index and what's verifiably happening (event type, severity, affected population), then a **30-day coverage sparkline** drawn from live GDELT volume, the most recent source articles, and a one-line classification of *why* the silence exists.

**3. Story mutation tracker** — The payoff view. Traces a single reported event as it travels from a local source to a regional wire to an international desk, highlighting where named victims become "dozens," a named town becomes "a remote region," and "artillery struck" becomes "violence flared." Silence isn't only absence — it's also erosion.

> Screenshots live in `docs/screenshots/`. If you've just cloned the repo, capture them by running locally and selecting Tigray, then opening the mutation tracker.

---

## 🚀 Run It Locally

Serve over HTTP — not `file://` — so the GDELT `fetch` calls and the world-atlas geometry load:

```bash
git clone https://github.com/aditya-3526/silence-map.git
cd silence-map

python3 -m http.server 8077
# → http://localhost:8077
```

Then drag the globe, click a pulsing marker, and watch the panel slide in. The sparkline and source cards render instantly from bundled data, then quietly upgrade to live GDELT results a moment later.

**To enable the live v2 pipeline**, register a free [ACLED API key](https://developer.acleddata.com) and provide it before `data.js` loads — e.g. add to `index.html`:

```html
<script>window.SILENCEMAP_ACLED = { key: 'YOUR_KEY', email: 'you@example.com' };</script>
```

Without it, the app runs on the five curated seed regions (still fully interactive, GDELT coverage still live).

> **CORS note:** GDELT's DOC API does not always return CORS headers for browser requests. If a live call is blocked, the console logs `GDELT … fallback` and the UI keeps the bundled static data — nothing breaks, it just isn't live. A tiny proxy fixes it; that's a v2 item.

---

## ✅ Honest Framing

- **The pipeline is real, but ACLED needs a key.** v2 computes regions live: ACLED → conflict zones → GDELT cross-reference → silence score → top 20. ACLED's API requires a free registered key + email (`window.SILENCEMAP_ACLED = { key, email }`). Without credentials — or on CORS/rate-limit/offline failure — the app falls back to the five curated seed regions rather than breaking. This is the designed behavior, stated plainly.
- **The silence score measures a gap, not a cause.** A high score means substantial fatal violence (ACLED) with little mainstream coverage (GDELT). It does **not**, on its own, establish *why* — structural access collapse, editorial deprioritization, and active suppression all produce the same divergence. Auto-generated regions are labeled "Coverage gap" precisely to avoid asserting a cause the data can't prove.
- **Curated vs. computed.** The five seed regions carry hand-built classifications and story-mutation traces sourced from public ACLED / GDACS / ReliefWeb / OCHA reporting. The auto-surfaced top-20 regions carry live ACLED severity + live GDELT coverage, but no mutation trace — the mutation view is shown only where one exists.
- **The fallback is a feature, not a hidden default.** Every live call degrades to bundled data on failure, and captions say whether what you're seeing is live. The map never silently shows stale numbers as if they were fresh.
- **No inflated metrics.** Two live integrations. A 35-zone candidate pool scored down to the top 20. Five seed regions. The numbers in this README are the real ones.

---

## 📁 Repository Structure

```
silence-map/
├── index.html              # Markup + bootstrap (ticker, scrubber, archive, wiring)
├── globe.js                # Globe class — projection, rotation, drag, hover, click
├── panel.js                # Panel class — slide-in, sparkline, sources, mutation modal
├── data.js                 # REGIONS + GDELT DOC 2.0 client + ARCHIVE (offline fallback)
├── styles.css              # All styling; per-region accent via --accent
├── docs/screenshots/       # globe.png · panel.png · mutation.png
├── SilenceMap.dc.html      # Original design mockup (reference)
├── LICENSE
└── README.md
```

---

## 🔗 Links

- **Repository:** https://github.com/aditya-3526/silence-map
- **Release:** [v1.0.0 — Version One](https://github.com/aditya-3526/silence-map/releases/tag/v1.0.0)
- **Author:** [Aditya Aryan](https://github.com/aditya-3526) — Computer Engineering, TIET Patiala

---

*Built on the premise that what a newsroom doesn't cover is itself a measurable, mappable thing.*
