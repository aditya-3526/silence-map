# SilenceMap

A global news-silence tracker. An interactive D3 globe surfaces regions where major events are happening but mainstream coverage is thin or absent — and explains *why* the silence exists (structural access gaps, editorial deprioritization, or active suppression).

## Features

- **Interactive D3 globe** — orthographic projection with auto-rotate, drag-to-spin, hover tooltips, and click-to-select pulsing region markers.
- **Live GDELT data** — coverage-volume sparklines and recent source articles are pulled from the [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/), with a static fallback when requests are blocked or offline.
- **Region panel** — slides in on selection with a silence index, what's happening, mainstream-coverage sparkline, what other sources say, and a classification of the silence.
- **Story mutation tracker** — traces how a story's facts soften and dissolve as it moves from local source to regional wire to international outlet.
- **Archive scrubber** — rewind up to three years to see notable past silences.

## Project structure

| File | Role |
| --- | --- |
| `index.html` | Markup + bootstrap wiring ticker, globe, panel, scrubber, archive |
| `styles.css` | All styling; region accent driven by a `--accent` CSS variable |
| `data.js` | Region database + GDELT DOC 2.0 client (with offline fallback) |
| `globe.js` | `Globe` class — projection, rotation, drag, hover, click |
| `panel.js` | `Panel` class — slide-in panel, sparkline, sources, mutation modal |

## Running locally

Serve over HTTP (not `file://`) so the GDELT fetch calls work:

```bash
python3 -m http.server 8077
# open http://localhost:8077
```

> **Note:** GDELT's DOC API does not always send CORS headers for browser requests. If live calls are blocked, the UI silently falls back to bundled static data (look for `GDELT … fallback` in the console).

## Tech

Plain HTML / CSS / vanilla JS — no build step. Uses [D3](https://d3js.org/) and [topojson-client](https://github.com/topojson/topojson-client) via CDN, plus [world-atlas](https://github.com/topojson/world-atlas) for country geometry.
