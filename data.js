/* data.js — region database + live GDELT client
 * Exposes: window.REGIONS, window.GDELT, window.ARCHIVE
 *
 * GDELT DOC 2.0 API ( https://api.gdeltproject.org/api/v2/doc/doc ) is queried
 * directly from the browser. The static `coverage` / `sources` on each region are
 * used as an offline fallback whenever a request fails (rate limit, CORS, offline). */

/* deterministic synthetic coverage, used until / unless GDELT answers */
function genCov(seed, peaks) {
  const a = []; let s = seed;
  for (let i = 0; i < 30; i++) { s = (s * 9301 + 49297) % 233280; const r = s / 233280; a.push(r < 0.80 ? 0 : (r < 0.94 ? 1 : 2)); }
  for (const [idx, h] of peaks) a[idx] = h;
  return a;
}

const REGIONS = [
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
      return { counts, zeros };
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

window.REGIONS = REGIONS;
window.ARCHIVE = ARCHIVE;
window.GDELT = GDELT;
