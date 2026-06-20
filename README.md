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
        │   REGIONS[]  — geometry, score, classification, mutation     │
        │   GDELT       — live DOC 2.0 client (coverage + articles)     │
        │   ARCHIVE[]   — notable historical silences                  │
        │                                                              │
        │   every live call has a bundled static fallback              │
        └──────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    D3 geoOrthographic · TopoJSON world-atlas
```

| File | Role | Explicitly does not |
|---|---|---|
| `index.html` | Markup + bootstrap; owns `selectedId`, builds ticker/scrubber/archive | hold region data or rendering logic |
| `globe.js` | `Globe` — projection, rotation, drag, hover, click hit-testing | know what a panel is; it only emits `onSelect(id)` |
| `panel.js` | `Panel` — slide-in render, sparkline, source cards, mutation modal | fetch geometry or mutate the globe |
| `data.js` | `REGIONS`, `GDELT` client, `ARCHIVE`; live data + offline fallback | render anything to the DOM |
| `styles.css` | All styling; per-region accent via a `--accent` CSS variable | contain inline behavior |

---

## 🛰 The Five Data Sources

SilenceMap's premise only works if the "something is happening" signal comes from somewhere *other* than the news volume it's being compared against. These five feeds supply that ground truth.

| # | Source | What it provides | Status in v1 |
|---|---|---|---|
| 1 | **[GDELT DOC 2.0](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)** | The coverage-volume timeline (`timelinevolraw`) and recent article lists (`artlist`) — the *denominator* of every silence | **Live & wired** — fetched per region in `data.js` |
| 2 | **[ACLED](https://acleddata.com)** | Geolocated armed-conflict and political-violence events — the severity signal behind the silence index | Provenance feed (bundled) |
| 3 | **[GDACS](https://www.gdacs.org)** | Global disaster alerts (floods, conflict displacement) used to corroborate sudden-onset events | Provenance feed (bundled) |
| 4 | **[ReliefWeb](https://reliefweb.int)** | Humanitarian situation reports and flash updates — the on-the-ground reporting that *does* exist | Provenance feed (bundled) |
| 5 | **[OCHA](https://www.unocha.org)** | UN displacement and access figures that quantify who is affected when the press cannot reach them | Provenance feed (bundled) |

> Only **GDELT** is called live from the browser in v1; the other four are the upstream signals the bundled silence scores and source cards are built from, surfaced as provenance tags. Wiring them in as live calls is the v2 roadmap — see [Honest Framing](#-honest-framing).

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

> **CORS note:** GDELT's DOC API does not always return CORS headers for browser requests. If a live call is blocked, the console logs `GDELT … fallback` and the UI keeps the bundled static data — nothing breaks, it just isn't live. A tiny proxy fixes it; that's a v2 item.

---

## ✅ Honest Framing

- **One source is live; four are provenance.** In v1, GDELT is the only feed actually fetched from the browser. The silence scores, severities, and classifications for the five regions are hand-built from public ACLED / GDACS / ReliefWeb / OCHA reporting and shipped as static data — not computed live. This is stated plainly rather than dressed up as a real-time pipeline.
- **The fallback is a feature, not a hidden default.** Every live call degrades to bundled data on failure, and the caption changes to say whether what you're seeing is live. The map never silently shows stale numbers as if they were fresh.
- **The classifications are editorial judgments.** "Structural" vs. "Suppression signal" vs. "Editorial" is an interpretive call about *why* coverage is thin — informed by the sources, but not an automated verdict. It is presented as analysis, not as fact.
- **No inflated metrics.** Five regions. Five feeds. One live integration. Three views. The numbers in this README are the real ones.

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
