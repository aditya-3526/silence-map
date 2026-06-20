# Methodology

SilenceMap measures the gap between how much fatal violence is happening in a place and how much the mainstream press is covering it. A region that is both **severe** and **under-covered** scores high; a region that is minor, or severe but heavily covered, scores low.

## The silence score

For each candidate conflict zone the score is computed from two normalized signals — severity from ACLED, coverage from GDELT:

```
score = round( 100 · sevNorm · (1 − covNorm) )

sevNorm = log1p(fatalities) / log1p(maxFatalities)
covNorm = log1p(coverageVolume) / log1p(maxCoverageVolume)
```

Both signals are **log-scaled** across the candidate pool so a single mega-conflict doesn't flatten everything else, and normalized to 0–1. The multiplication is deliberate: a region must be high on severity **and** low on coverage to score near 100. Either factor alone pulls the score down.

## How the pipeline runs

1. Pull every fatal event from **ACLED** for the last 30 days (`fatalities > 0`).
2. Aggregate events into conflict zones keyed by country and first-level admin region, summing fatalities and event counts and averaging coordinates to a centroid.
3. Take the 35 most-severe zones as candidates.
4. Cross-reference each candidate's mainstream coverage volume from **GDELT** (articles mentioning both the region and its country).
5. Score every candidate, sort by silence, and surface the top 20 automatically.

## Data sources

- **ACLED** — geolocated armed-conflict and political-violence events; supplies the severity numerator.
- **GDELT DOC 2.0** — coverage-volume timeline and article lists; supplies the coverage denominator.
- **GDACS** — global disaster alerts; corroborates sudden-onset events for the curated seed regions.
- **ReliefWeb** — humanitarian situation reports and flash updates.
- **OCHA** — UN displacement and access figures.

## Limitations

- **The score measures a gap, not a cause.** Structural access collapse, editorial deprioritization, and active suppression all produce the same divergence. Auto-generated regions are labeled "Coverage gap" precisely so the app never asserts a cause the data can't prove.
- **Coverage is a proxy.** GDELT indexes online news in many but not all languages; a region covered only in untracked local-language outlets can read as more silent than it is.
- **ACLED needs a key.** Without registered credentials — or on CORS, rate-limit, or offline failure — the pipeline falls back to five curated seed regions rather than breaking.
- **Aggregation is coarse.** Events are grouped by first-level admin region, which can merge distinct local situations or split a cross-border one.
- **Severity is fatalities-weighted.** Displacement, detention, and disappearance — which often *are* the story where the press is barred — are under-counted relative to killings.
