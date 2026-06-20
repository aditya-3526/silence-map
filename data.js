/* data.js — dynamic region pipeline + live GDELT/ACLED clients
 * Exposes: window.REGIONS (initial seed), window.SEED_REGIONS, window.GDELT,
 *          window.ACLED, window.Pipeline, window.ARCHIVE, window.scoreColor
 *
 * v2 pipeline (Pipeline.buildRegions):
 *   1. ACLED  — pull active conflict zones: events in the last 30 days, fatalities > 0
 *   2. aggregate events into regions (country + admin1), with fatalities + event counts
 *   3. GDELT  — cross-reference each candidate's mainstream coverage volume
 *   4. score  — silence = high on-the-ground severity, low coverage
 *   5. surface the top 20 highest-silence regions automatically
 *
 * The 5 curated SEED_REGIONS below are the seed/fallback: shown immediately on load
 * and kept if the ACLED pipeline fails (no key, CORS, rate limit, offline). Both the
 * ACLED and GDELT DOC 2.0 APIs are called directly from the browser; every live call
 * degrades to bundled data rather than breaking the UI. */

/* deterministic synthetic coverage, used until / unless GDELT answers */
function genCov(seed, peaks) {
  const a = []; let s = seed;
  for (let i = 0; i < 30; i++) { s = (s * 9301 + 49297) % 233280; const r = s / 233280; a.push(r < 0.80 ? 0 : (r < 0.94 ? 1 : 2)); }
  for (const [idx, h] of peaks) a[idx] = h;
  return a;
}

const SEED_REGIONS = [
  { id:'tigray', name:'Tigray, Ethiopia', country:'Ethiopia', countryId:'231', lon:39.2, lat:13.8, color:'#e85d00', score:94,
    query:'(Tigray OR Adigrat OR Mekelle) sourcelang:english',
    banner:'Renewed clashes displace half a million; near-total media blackout',
    happening:{ type:'Armed clashes & displacement', severity:'Severe', population:'≈512,000 newly displaced',
      summary:`Renewed fighting between regional forces and allied militias has spread across eastern Tigray since early March. Verified events include shelling of populated areas, blocked aid convoys, and the collapse of health services in three woredas. Food assistance has not reached the worst-affected districts in over six weeks.`,
      sources:['ACLED','GDACS','ReliefWeb','OCHA'] },
    coverage:genCov(7,[[9,4],[24,2]]),
    sources:[
      { name:'Addis Standard', type:'Local outlet', date:'Jun 17', summary:`Residents in Adigrat describe nightly shelling and a cash shortage as banks stay shut.` },
      { name:'Tigrai Media House', type:'Local broadcaster', date:'Jun 16', summary:`Reports three rural clinics out of service after generator fuel ran out.` },
      { name:'OCHA Ethiopia', type:'UN situation report', date:'Jun 15', summary:`Estimates 512,000 newly displaced; humanitarian access "severely constrained" in the east.` },
      { name:'Ethiopia Peace Observatory', type:'ACLED partner', date:'Jun 14', summary:`Logs 38 violent events in two weeks — the highest fortnightly count since 2022.` },
      { name:'Médecins Sans Frontières', type:'NGO field update', date:'Jun 12', summary:`Suspends operations in two districts citing staff safety and supply blockages.` },
      { name:'UNHCR Flash Update', type:'Machine-translated', date:'Jun 11', summary:`Cross-border arrivals into Sudan rising despite insecurity along the route.` } ],
    classification:{ type:'Structural', text:`Coverage is absent because the infrastructure to report it isn't there — no foreign bureaus, restricted travel, and intermittent communications. The silence is a byproduct of access, not an editorial choice.` },
    mutation:{ story:'Reported shelling in Adigrat — June 14', summary:[
        {text:'"At least 47 civilians" collapses to "dozens," then disappears entirely.'},
        {text:'Named location "Adigrat market" widens to "northern Ethiopia."'},
        {text:'"Artillery struck" — a weapon and an actor — becomes "violence flared."'},
        {text:'Child and clinic-staff victims present locally are gone by the third version.'} ],
      stops:[
        { tier:'Local source', source:'Tigrai Television', date:'Jun 14', segments:[
          {t:'Artillery struck the Adigrat central market',m:1},{t:', killing '},{t:'at least 47 civilians',m:1},{t:' including '},{t:'nine children',m:1},{t:', residents and two clinic staff said.'} ] },
        { tier:'Regional wire', source:'Pan-African News Wire', date:'Jun 15', segments:[
          {t:'Clashes reportedly killed dozens',m:1},{t:' in northern Tigray on Saturday, '},{t:'according to unverified local accounts',m:1},{t:'.'} ] },
        { tier:'International outlet', source:'Global desk brief', date:'Jun 16', segments:[
          {t:'Violence flared in northern Ethiopia',m:1},{t:' amid '},{t:'renewed tensions between rival forces',m:1},{t:', officials said.'} ] } ] } },

  { id:'baloch', name:'Balochistan, Pakistan', country:'Pakistan', countryId:'586', lon:65.5, lat:28.2, color:'#ff2200', score:88,
    query:'(Balochistan OR Makran OR Turbat OR Kech) sourcelang:english',
    banner:'Enforced disappearances surge as connectivity stays throttled',
    happening:{ type:'Enforced disappearances & unrest', severity:'High', population:'≈1,900 cases logged in 2026',
      summary:`Rights monitors report a sharp rise in enforced disappearances and night raids across Makran and Kech since April, alongside an internet slowdown now in its 18th day. Independent journalists are largely barred from the province.`,
      sources:['ACLED','ReliefWeb'] },
    coverage:genCov(13,[[18,2]]),
    sources:[
      { name:'The Balochistan Post', type:'Local · translated', date:'Jun 16', summary:`Families stage a sit-in in Turbat over relatives missing since a May raid.` },
      { name:'HRC of Balochistan', type:'NGO monitor', date:'Jun 15', summary:`Documents 214 new disappearance cases this quarter, most unreported elsewhere.` },
      { name:'NetBlocks', type:'Connectivity monitor', date:'Jun 14', summary:`Confirms reduced connectivity across Makran for an 18th consecutive day.` },
      { name:'Voice for Baloch Missing Persons', type:'Advocacy group', date:'Jun 12', summary:`Publishes names of 31 detainees said to be held without charge.` },
      { name:'ACLED South Asia', type:'Conflict data', date:'Jun 10', summary:`Records a cluster of night-time security operations around Kech.` } ],
    classification:{ type:'Suppression signal', text:`Reporting is being actively impeded — independent journalists barred, connectivity throttled, families intimidated. The pattern is consistent with deliberate information control and warrants close scrutiny.` },
    mutation:{ story:'Reported night raid in Turbat — May 28', summary:[
        {text:'"14 men, including a 16-year-old" softens to "several people."'},
        {text:'"Detained" becomes "picked up," then a neutral "security operation."'},
        {text:'Named detainees become anonymous "sources said."'},
        {text:'Frame shifts to a "restive region" defined by "insurgency."'} ],
      stops:[
        { tier:'Local source', source:'The Balochistan Post', date:'May 28', segments:[
          {t:'Security forces detained 14 men',m:1},{t:' in a pre-dawn raid on a Turbat neighbourhood, '},{t:'including a 16-year-old student',m:1},{t:', families said.'} ] },
        { tier:'Regional wire', source:'National daily, Karachi', date:'May 30', segments:[
          {t:'Several people were picked up',m:1},{t:' during a '},{t:'security operation',m:1},{t:' in Balochistan, sources said.'} ] },
        { tier:'International outlet', source:'Wire brief', date:'Jun 02', segments:[
          {t:'Pakistani forces conducted operations',m:1},{t:" in the country's restive southwest "},{t:'amid a long-running insurgency',m:1},{t:'.'} ] } ] } },

  { id:'westpapua', name:'West Papua, Indonesia', country:'Indonesia', countryId:'360', lon:138.0, lat:-4.0, color:'#c47800', score:79,
    query:'("West Papua" OR Nduga OR "Intan Jaya") sourcelang:english',
    banner:'Highland offensive widens with foreign press still barred',
    happening:{ type:'Highland military operation', severity:'High', population:'≈61,000 displaced since 2023',
      summary:`A renewed offensive in the central highlands has displaced thousands more from Nduga and Intan Jaya. Foreign journalists remain barred from the region, leaving church networks as the main source of casualty reporting.`,
      sources:['ACLED','ReliefWeb'] },
    coverage:genCov(21,[[5,2],[12,1]]),
    sources:[
      { name:'Jubi', type:'Local · translated', date:'Jun 15', summary:`Reports fresh displacement from two highland villages after an air operation.` },
      { name:'Papua Church Council', type:'Faith network', date:'Jun 13', summary:`Says at least 4,000 people are sheltering in forest and church compounds.` },
      { name:'Human Rights Monitor', type:'NGO', date:'Jun 11', summary:`Verifies two civilian deaths via geolocated footage.` },
      { name:'ULMWP situation note', type:'Advocacy', date:'Jun 09', summary:`Calls for humanitarian access to the central highlands.` },
      { name:'Amnesty Indonesia', type:'NGO', date:'Jun 07', summary:`Reiterates concern that the press ban limits independent verification.` } ],
    classification:{ type:'Editorial', text:`The story is reachable through proxies but consistently deprioritized — judged too remote, too complex, or too costly to cover against competing news. The silence is a product of newsroom choices.` },
    mutation:{ story:'Highland air operation — June 09', summary:[
        {text:'A named "air strike on Kiwirok" becomes a generic "security operation."'},
        {text:'"Around 800 residents fleeing" is dropped from the wire version.'},
        {text:'Official framing — "armed criminal groups" / "separatists" — is adopted wholesale.'},
        {text:'Location degrades from a village to a "remote eastern region."'} ],
      stops:[
        { tier:'Local source', source:'Jubi', date:'Jun 09', segments:[
          {t:'An air strike hit Kiwirok village',m:1},{t:', forcing '},{t:'around 800 residents',m:1},{t:' to flee, church workers said.'} ] },
        { tier:'Regional wire', source:'Jakarta outlet', date:'Jun 11', segments:[
          {t:'A security operation was carried out',m:1},{t:" in Papua's highlands "},{t:'to pursue armed criminal groups',m:1},{t:', the military said.'} ] },
        { tier:'International outlet', source:'Wire brief', date:'Jun 13', segments:[
          {t:'Indonesian forces clashed with separatists',m:1},{t:' in a '},{t:'remote eastern region',m:1},{t:'.'} ] } ] } },

  { id:'cabo', name:'Cabo Delgado, Mozambique', country:'Mozambique', countryId:'508', lon:39.8, lat:-12.2, color:'#8b5e00', score:72,
    query:'("Cabo Delgado" OR Macomia OR Quissanga) sourcelang:english',
    banner:'Coastal insurgent raids resume; the aid road is shut again',
    happening:{ type:'Insurgent raids', severity:'High', population:'≈74,000 displaced this quarter',
      summary:`Attacks attributed to an Islamist insurgency have resumed along the Cabo Delgado coast, hitting Macomia and Quissanga districts. Aid agencies have again suspended movement on the main coastal road.`,
      sources:['ACLED','GDACS','ReliefWeb'] },
    coverage:genCov(29,[[16,3]]),
    sources:[
      { name:'Cabo Ligado', type:'Conflict monitor', date:'Jun 16', summary:`Maps six attacks in two weeks, concentrated around Macomia.` },
      { name:'Pinnacle News', type:'Local · translated', date:'Jun 14', summary:`Residents flee Quissanga after an overnight raid on the district seat.` },
      { name:'OCHA Mozambique', type:'UN situation report', date:'Jun 13', summary:`Reports 74,000 displaced this quarter; coastal road movement suspended.` },
      { name:'Save the Children', type:'NGO field update', date:'Jun 11', summary:`Warns of rising acute malnutrition among newly displaced children.` },
      { name:'IOM DTM', type:'Displacement tracking', date:'Jun 09', summary:`Records new arrivals in Pemba reception sites.` } ],
    classification:{ type:'Displaced', text:`Coverage exists but has moved on — attention spiked during an earlier phase of this conflict and never returned as conditions worsened. The silence is the gap left by a news cycle that already closed.` },
    mutation:{ story:'Quissanga raid — June 13', summary:[
        {text:'"At least 9 beheaded" reduces to "a number of people dead."'},
        {text:'The method and the atrocity detail vanish in regional retelling.'},
        {text:'A named town becomes "northern Mozambique."'},
        {text:'Attribution narrows to vague "violence linked to an insurgency."'} ],
      stops:[
        { tier:'Local source', source:'Pinnacle News', date:'Jun 13', segments:[
          {t:'Insurgents beheaded at least 9 people',m:1},{t:' and burned the '},{t:'district administration in Quissanga',m:1},{t:', survivors said.'} ] },
        { tier:'Regional wire', source:'Maputo daily', date:'Jun 15', segments:[
          {t:'Suspected militants killed several people',m:1},{t:' in an attack in northern Mozambique, '},{t:'officials confirmed',m:1},{t:'.'} ] },
        { tier:'International outlet', source:'Wire brief', date:'Jun 17', segments:[
          {t:'Violence linked to an insurgency',m:1},{t:' left '},{t:'a number of people dead',m:1},{t:" in Mozambique's north."} ] } ] } },

  { id:'kivu', name:'North Kivu, DR Congo', country:'Dem. Rep. Congo', countryId:'180', lon:29.0, lat:-1.2, color:'#c47800', score:83,
    query:'("North Kivu" OR Goma OR Kanyabayonga) sourcelang:english',
    banner:'Armed advance severs the main humanitarian corridor north of Goma',
    happening:{ type:'Armed offensive & blockade', severity:'Severe', population:'≈2.8M displaced in province',
      summary:`An armed-group advance has cut a key humanitarian corridor north of Goma, stranding aid and civilians. Frontline shifts have repeatedly closed the main supply road over the past month.`,
      sources:['ACLED','GDACS','ReliefWeb','OCHA'] },
    coverage:genCov(3,[[7,3],[20,2]]),
    sources:[
      { name:'Actualité.cd', type:'Local · translated', date:'Jun 17', summary:`Reports the Kanyabayonga axis closed for a fourth time this month.` },
      { name:'OCHA DRC', type:'UN situation report', date:'Jun 15', summary:`Says aid to northern Rutshuru is "effectively cut" by frontline movement.` },
      { name:'Kivu Security Tracker', type:'Conflict monitor', date:'Jun 14', summary:`Logs clashes along the Goma–Butembo road corridor.` },
      { name:'Norwegian Refugee Council', type:'NGO', date:'Jun 12', summary:`Suspends distributions in two sites citing access and security.` },
      { name:'MSF', type:'NGO field update', date:'Jun 10', summary:`Reports a surge of wounded arriving at a Goma-area hospital.` } ],
    classification:{ type:'Structural', text:`The fighting is reachable but the reporting capacity isn't — shifting front lines, severed roads, and few resident correspondents leave verification slow and partial. The silence tracks the collapse of access.` },
    mutation:{ story:'Kanyabayonga shelling — June 14', summary:[
        {text:'"12 civilians killed by shelling of a camp" becomes "casualties reported."'},
        {text:'The perpetrator and the weapon both drop out of the wire copy.'},
        {text:'A displacement camp dissolves into "an area hosting displaced people."'},
        {text:'The event is finally reduced to a "complex conflict."'} ],
      stops:[
        { tier:'Local source', source:'Actualité.cd', date:'Jun 14', segments:[
          {t:'Shells hit a displacement camp',m:1},{t:' near Kanyabayonga, '},{t:'killing 12 civilians',m:1},{t:', local officials said.'} ] },
        { tier:'Regional wire', source:'Regional wire', date:'Jun 15', segments:[
          {t:'Fighting reached an area hosting displaced people',m:1},{t:', with '},{t:'casualties reported',m:1},{t:'.'} ] },
        { tier:'International outlet', source:'Wire brief', date:'Jun 16', segments:[
          {t:'Renewed clashes in eastern Congo',m:1},{t:' displaced more people '},{t:'amid a complex conflict',m:1},{t:'.'} ] } ] } }
];

const ARCHIVE = [
  { region:'Tigray, Ethiopia', dates:'Nov 2021 – Mar 2022', color:'#e85d00', event:'Communications blackout during famine-level food insecurity across the region.', gap:'147 days of near-zero major-outlet coverage' },
  { region:'Cabo Delgado, Mozambique', dates:'Mar 2021', color:'#c47800', event:'Assault on Palma town displaced tens of thousands within days.', gap:'11 days of zero major-outlet coverage' },
  { region:'West Papua, Indonesia', dates:'2019', color:'#8b5e00', event:'Highlands unrest with foreign press barred for months on end.', gap:'63 days, a single international wire story' }
];

/* ---- GDELT DOC 2.0 client ---- */
const GDELT = {
  BASE: 'https://api.gdeltproject.org/api/v2/doc/doc',

  async _json(params) {
    const url = this.BASE + '?' + new URLSearchParams(params).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error('GDELT ' + res.status);
    return res.json();
  },

  /* Daily article-count timeline for the last 30 days.
   * Returns { counts:[..30 ints..], zeros:Number } or null on failure. */
  async fetchCoverage(query) {
    try {
      const data = await this._json({
        query, mode: 'timelinevolraw', timespan: '30d', format: 'json'
      });
      const series = (data.timeline || []).find(s => /article/i.test(s.series)) || (data.timeline || [])[0];
      if (!series || !series.data || !series.data.length) return null;
      const counts = this._toDaily(series.data);
      if (!counts.length) return null;
      const zeros = counts.filter(c => c === 0).length;
      const total = counts.reduce((a, b) => a + b, 0);
      return { counts, zeros, total };
    } catch (e) {
      console.warn('GDELT coverage fallback:', e.message);
      return null;
    }
  },

  /* Most recent articles for the region. Returns [{name,type,date,summary,url}] or null. */
  async fetchSources(query, max = 6) {
    try {
      const data = await this._json({
        query, mode: 'artlist', maxrecords: String(max), sort: 'datedesc', format: 'json'
      });
      let arts = data.articles || [];
      if (!arts.length) return null;
      // deduplicate by headline text — keep the first article for each title
      const seen = new Set();
      arts = arts.filter(a => {
        const key = (a.title || '').trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      return arts.map(a => ({
        name: a.domain || a.sourcecountry || 'Source',
        type: (a.sourcecountry || 'Wire') + (a.language ? ' · ' + a.language : ''),
        date: this._fmtDate(a.seendate),
        summary: a.title || '(untitled)',
        url: a.url
      }));
    } catch (e) {
      console.warn('GDELT sources fallback:', e.message);
      return null;
    }
  },

  /* GDELT may return sub-daily bins; collapse to one count per calendar day,
   * then pad/trim to the most recent 30 days. */
  _toDaily(points) {
    const byDay = new Map();
    for (const p of points) {
      const day = String(p.date).slice(0, 10).replace(/-/g, '');
      byDay.set(day, (byDay.get(day) || 0) + (Number(p.value) || 0));
    }
    const days = [...byDay.keys()].sort();
    return days.slice(-30).map(d => Math.round(byDay.get(d)));
  },

  _fmtDate(s) {
    if (!s) return '';
    const m = String(s).match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return String(s);
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleString('en', { month: 'short', day: '2-digit' });
  }
};

/* ---- shared helpers ---- */

/* legend ramp: low silence → cool/dark, high silence → red */
const SILENCE_RAMP = ['#1a1a2e', '#4a3800', '#8b5e00', '#c47800', '#e85d00', '#ff2200'];
function scoreColor(score) {
  const i = Math.min(SILENCE_RAMP.length - 1, Math.max(0, Math.floor(score / 100 * SILENCE_RAMP.length)));
  return SILENCE_RAMP[i];
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'region';
}

function severityLabel(fatalities) {
  if (fatalities >= 100) return 'Severe';
  if (fatalities >= 25) return 'High';
  if (fatalities >= 5) return 'Elevated';
  return 'Reported';
}

/* run async `fn` over `items` with bounded concurrency */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/* ---- ACLED client ---- */
/* The ACLED Access API needs a registered key + email (https://developer.acleddata.com).
 * Provide them via window.SILENCEMAP_ACLED = { key, email } before this script loads,
 * or by editing ACLED_CONFIG below. Without credentials the call fails and the pipeline
 * falls back to the seed regions. */
const ACLED_CONFIG = Object.assign(
  { key: '', email: '' },
  (typeof window !== 'undefined' && window.SILENCEMAP_ACLED) || {}
);

const ACLED = {
  BASE: 'https://api.acleddata.com/acled/read',

  configured() { return !!(ACLED_CONFIG.key && ACLED_CONFIG.email); },

  /* Fetch fatal events from the last `days` days and aggregate them into conflict
   * zones keyed by country + admin1. Returns [{ country, admin1, lat, lon,
   * fatalities, events, topType, latestDate, latestNotes }] or null on failure. */
  async fetchConflictZones(days = 30, maxRecords = 5000) {
    if (!this.configured()) { console.warn('ACLED: no key/email configured — using seed regions'); return null; }
    try {
      const params = new URLSearchParams({
        key: ACLED_CONFIG.key,
        email: ACLED_CONFIG.email,
        event_date: daysAgoISO(days) + '|' + daysAgoISO(0),
        event_date_where: 'BETWEEN',
        fatalities: '0',
        fatalities_where: '>',
        fields: 'event_date|country|admin1|latitude|longitude|fatalities|event_type|sub_event_type|notes',
        limit: String(maxRecords)
      });
      const res = await fetch(this.BASE + '?' + params.toString());
      if (!res.ok) throw new Error('ACLED ' + res.status);
      const json = await res.json();
      const rows = json.data || [];
      if (!rows.length) return null;
      return this._aggregate(rows);
    } catch (e) {
      console.warn('ACLED fallback:', e.message);
      return null;
    }
  },

  _aggregate(rows) {
    const zones = new Map();
    for (const r of rows) {
      const country = r.country || 'Unknown';
      const admin1 = r.admin1 || country;
      const key = country + '||' + admin1;
      const fat = Number(r.fatalities) || 0;
      const lat = Number(r.latitude), lon = Number(r.longitude);
      let z = zones.get(key);
      if (!z) { z = { country, admin1, fatalities: 0, events: 0, _lat: 0, _lon: 0, _n: 0, types: {}, latestDate: '', latestNotes: '' }; zones.set(key, z); }
      z.fatalities += fat;
      z.events += 1;
      if (Number.isFinite(lat) && Number.isFinite(lon)) { z._lat += lat; z._lon += lon; z._n += 1; }
      const t = r.sub_event_type || r.event_type || 'Violence';
      z.types[t] = (z.types[t] || 0) + 1;
      if (!z.latestDate || r.event_date > z.latestDate) { z.latestDate = r.event_date; z.latestNotes = r.notes || ''; }
    }
    return [...zones.values()].map(z => ({
      country: z.country, admin1: z.admin1,
      lat: z._n ? z._lat / z._n : 0, lon: z._n ? z._lon / z._n : 0,
      fatalities: z.fatalities, events: z.events,
      topType: Object.entries(z.types).sort((a, b) => b[1] - a[1])[0][0],
      latestDate: z.latestDate, latestNotes: z.latestNotes
    }));
  }
};

/* ---- the v2 pipeline ---- */
const Pipeline = {
  CANDIDATES: 35,   // how many top-severity zones to cross-reference against GDELT
  TOP_N: 20,        // how many highest-silence regions to surface
  GDELT_CONCURRENCY: 4,

  /* Build the live region list. Resolves to an array of region objects shaped like
   * SEED_REGIONS, or SEED_REGIONS itself if the pipeline can't run. */
  async buildRegions(onProgress = () => {}) {
    onProgress('Scanning ACLED for active conflict zones…');
    const zones = await ACLED.fetchConflictZones(30);
    if (!zones || !zones.length) { onProgress('seed'); return SEED_REGIONS; }

    // most-severe zones first; only cross-reference the top slice against GDELT
    zones.sort((a, b) => b.fatalities - a.fatalities || b.events - a.events);
    const candidates = zones.slice(0, this.CANDIDATES);

    onProgress(`Cross-referencing coverage for ${candidates.length} zones…`);
    const coverage = await mapLimit(candidates, this.GDELT_CONCURRENCY, async (z) => {
      const cov = await GDELT.fetchCoverage(this.queryFor(z));
      return cov || { counts: [], zeros: 30, total: 0 };
    });

    // normalize severity and coverage across the candidate pool (log-scaled so a
    // single mega-conflict doesn't flatten everything else)
    const maxFatLog = Math.log1p(Math.max(...candidates.map(z => z.fatalities), 1));
    const maxCovLog = Math.log1p(Math.max(...coverage.map(c => c.total), 1));

    const scored = candidates.map((z, i) => {
      const cov = coverage[i];
      const sevNorm = Math.log1p(z.fatalities) / maxFatLog;
      const covNorm = maxCovLog > 0 ? Math.log1p(cov.total) / maxCovLog : 0;
      // severe AND under-covered → high silence; either alone → low
      const score = Math.round(100 * sevNorm * (1 - covNorm));
      return { zone: z, cov, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, this.TOP_N);
    onProgress(`Surfaced ${top.length} highest-silence regions`);
    return top.map(s => this.toRegion(s));
  },

  queryFor(z) {
    // articles mentioning both the admin1 region and its country (space = AND in GDELT)
    return `"${z.admin1}" "${z.country}" sourcelang:english`;
  },

  toRegion({ zone, cov, score }) {
    const color = scoreColor(score);
    const counts = cov.counts.length ? cov.counts : genCov(zone.fatalities % 30, []);
    return {
      id: slugify(zone.country + '-' + zone.admin1),
      name: `${zone.admin1}, ${zone.country}`,
      country: zone.country,
      countryId: null,            // dynamic zones aren't matched to topojson land tint
      lon: zone.lon, lat: zone.lat,
      color, score,
      query: this.queryFor(zone),
      banner: `${zone.fatalities} reported fatalities across ${zone.events} events · coverage volume ${cov.total}`,
      happening: {
        type: zone.topType,
        severity: severityLabel(zone.fatalities),
        population: `${zone.events} violent events · ${zone.fatalities} fatalities (30d)`,
        summary: zone.latestNotes
          ? zone.latestNotes.slice(0, 320)
          : `ACLED logged ${zone.events} fatal events in ${zone.admin1} over the last 30 days, with ${zone.fatalities} reported fatalities. Most recent activity: ${zone.topType}.`,
        sources: ['ACLED', 'GDELT']
      },
      coverage: counts,
      sources: [],                // filled live by Panel.enrich via GDELT artlist
      classification: {
        type: 'Coverage gap',
        text: `This region scores ${score}/100 because ACLED records substantial fatal violence (${zone.fatalities} fatalities, ${zone.events} events in 30 days) while GDELT shows only ${cov.total} mainstream articles mentioning it. The score measures that divergence; it does not, on its own, establish the cause — structural access, editorial choice, and active suppression all produce the same gap.`
      },
      mutation: null,             // no curated mutation trace for auto-generated regions
      dynamic: true
    };
  }
};

/* ---- static content for the nav modals ---- */
const REPO_URL = 'https://github.com/aditya-3526/silence-map';

const DATA_SOURCES = [
  { name: 'ACLED', url: 'https://acleddata.com',
    provides: 'Geolocated armed-conflict & political-violence events — the severity numerator', status: 'Live · pipeline' },
  { name: 'GDELT DOC 2.0', url: 'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/',
    provides: 'Coverage-volume timeline & recent article lists — the coverage denominator', status: 'Live' },
  { name: 'GDACS', url: 'https://www.gdacs.org',
    provides: 'Global disaster alerts corroborating sudden-onset events', status: 'Seed provenance' },
  { name: 'ReliefWeb', url: 'https://reliefweb.int',
    provides: 'Humanitarian situation reports & flash updates', status: 'Seed provenance' },
  { name: 'OCHA', url: 'https://www.unocha.org',
    provides: 'UN displacement & access figures', status: 'Seed provenance' }
];

const ABOUT_TEXT = `SilenceMap is a global news-silence tracker. It treats the gap between how much fatal violence is verifiably happening in a place and how much the mainstream press covers it as a signal in its own right — surfacing, on an interactive globe, the regions where major events unfold in near-darkness. Active conflict zones are pulled live from ACLED, cross-referenced against GDELT coverage volume, scored for silence, and ranked automatically, with five curated regions as the seed and fallback. The silence is the story.`;

window.SEED_REGIONS = SEED_REGIONS;
window.REGIONS = SEED_REGIONS;   // initial render uses the seed; pipeline replaces it
window.ARCHIVE = ARCHIVE;
window.GDELT = GDELT;
window.ACLED = ACLED;
window.Pipeline = Pipeline;
window.scoreColor = scoreColor;
window.DATA_SOURCES = DATA_SOURCES;
window.ABOUT_TEXT = ABOUT_TEXT;
window.REPO_URL = REPO_URL;
