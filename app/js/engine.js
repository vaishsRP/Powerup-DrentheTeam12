// Engine for the v2 app: pure calculations, no DOM.
// Queue model: per area, direction and year, scarce capacity goes to requests in ACM priority order
// (1 congestion relievers, 2 safety, 3 public functions, 4 others), then by request order. A request connects in the
// first year it fits. Batteries add relief. Load = base (illustrative) + connected requests − relief; capacity = base + upgrades in service.

const ENGINE = (() => {
  const START = 2026, END = 2035;
  const PRIO = { battery: 1, defence: 2, hospital: 3, school: 3, housing: 3 };
  const MEASURE = { timeblock: 0.15, cablepool: 0.6, battery: 0.5, nonfirm: 0 }; // share of peak MW left (illustrative)
  let ORDERS = [], polyCache = null;

  const D = () => STORE.data;
  const area = (id) => D().areas.features.find((f) => f.properties.id === id)?.properties;
  const key = (d) => (d === "teruglevering" ? "feed_in" : "offtake");
  const oDir = (o) => (o.mw_feed_in > o.mw_offtake ? "teruglevering" : "afname");
  const oMW = (o) => Math.max(o.mw_offtake || 0, o.mw_feed_in || 0) || o.mw_flex || 0;
  const upYear = (u, dec) => dec.upgradeYears[u.id] ?? u.year_feasible;
  const upgradesIn = (aid) => D().upgrades.filter((u) => u.area_id === aid);
  const base = (aid, d, y) => { const a = area(aid); return a[`base_${key(d)}_mw`] * Math.pow(1 + a[`growth_${key(d)}`], y - START); };
  const capacity = (aid, d, y, dec) => area(aid)[`cap_${key(d)}_mw`] +
    upgradesIn(aid).filter((u) => upYear(u, dec) <= y).reduce((s, u) => s + u[`mw_added_${key(d)}`], 0);

  // ---------- geometry ----------
  function inRing(x, y, ring) {
    let ins = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
  const inGeom = (lat, lon, g) => polys(g).some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));
  function areaAt(lat, lon) {
    polyCache ??= D().areas.features.map((f) => ({ id: f.properties.id, g: f.geometry }));
    return polyCache.find((a) => inGeom(lat, lon, a.g))?.id || null;
  }
  const realAreaAt = (lat, lon) => D().realAreas?.features.find((f) => inGeom(lat, lon, f.geometry)) || null;
  const inDrenthe = (lat, lon) => D().muni?.features.some((f) => inGeom(lat, lon, f.geometry));

  // ---------- register ----------
  function init() {
    const seeded = D().plans.concat(EXTRA_ORDERS).map((o, i) => ({ mw_flex: 0, ...o, request_seq: i }));
    ORDERS = seeded.concat(STORE.state.userOrders).map((o) => ({
      ...o, area_id: areaAt(o.lat, o.lon) || o.area_id, priority: PRIO[o.category] ?? 4,
      mine: o.mine || MINE.includes(o.id),
    }));
  }
  const orders = () => ORDERS;
  function addOrder(o) {
    const full = { ...o, area_id: areaAt(o.lat, o.lon), priority: PRIO[o.category] ?? 4, request_seq: 1000 + ORDERS.length, mine: true };
    ORDERS.push(full);
    STORE.state.userOrders.push(full);
    return full;
  }

  // ---------- queue simulation ----------
  function simulate(dec, opts = {}) {
    const used = {}, relief = {}, res = {};
    const slot = (o, aid, d) => (o[`${aid}|${d}`] ??= Array(END - START + 1).fill(0));
    const list = ORDERS.concat(dec.batteries || [], opts.extra ? [opts.extra] : [])
      .filter((o) => !(dec.cancelled || []).includes(o.id) && o.area_id)
      .sort((a, b) => a.priority - b.priority || a.request_seq - b.request_seq);
    for (const o of list) {
      const y0 = Math.max(o.year_needed, START);
      if (o.category === "battery") {
        for (const d of ["afname", "teruglevering"]) { const r = slot(relief, o.area_id, d); for (let y = y0; y <= END; y++) r[y - START] += o.mw_flex || oMW(o); }
        res[o.id] = { year: y0, status: "proceeds", wait: null };
        continue;
      }
      const d = oDir(o), m = opts.measure?.id === o.id ? MEASURE[opts.measure.type] : 1, mw = oMW(o) * m;
      const u = slot(used, o.area_id, d), r = slot(relief, o.area_id, d);
      let got = null;
      for (let y = y0; y <= END; y++) {
        if (capacity(o.area_id, d, y, dec) + r[y - START] - base(o.area_id, d, y) - u[y - START] >= mw) { got = y; break; }
      }
      if (got === null) { res[o.id] = { year: null, status: "not_possible", wait: null }; continue; }
      for (let y = got; y <= END; y++) u[y - START] += mw;
      const wait = got > y0 ? upgradesIn(o.area_id).find((x) => upYear(x, dec) === got) || null : null;
      res[o.id] = { year: got, status: got === y0 ? "proceeds" : "delayed", wait };
    }
    return { res, used, relief, dec };
  }
  function areaStatus(sim, aid, d, y) {
    const i = y - START;
    const load = base(aid, d, y) + (sim.used[`${aid}|${d}`]?.[i] || 0) - (sim.relief[`${aid}|${d}`]?.[i] || 0);
    const cap = capacity(aid, d, y, sim.dec), ratio = load / cap;
    return { load, cap, ratio, status: ratio < 0.8 ? "room" : ratio <= 1 ? "limited" : "bottleneck" };
  }
  function series(sim, aid, d) {
    const years = [], load = [], cap = [];
    for (let y = START; y <= END; y++) { const s = areaStatus(sim, aid, d, y); years.push(y); load.push(s.load); cap.push(s.cap); }
    return { years, load, cap };
  }
  function firstBottleneck(sim, aid, d) {
    for (let y = START; y <= END; y++) if (areaStatus(sim, aid, d, y).status === "bottleneck") return y;
    return null;
  }
  // grid fix chain: in service Y ← investment plan Jan (Y − lead) ← pMIEK Feb (Y − lead − 1)
  function deadline(sim, aid, d) {
    const first = firstBottleneck(sim, aid, d);
    if (first === null) return null;
    const lead = Math.max(4, ...upgradesIn(aid).map((u) => u.lead_years || 0));
    return { first, lead, ip: first - lead, pmiek: first - lead - 1, late: first - lead - 1 < 2027 };
  }
  function estRange(r) {
    if (!r || r.year === null) return t("not_possible");
    if (!r.wait) return `${r.year}`;
    const spread = Math.max(0, (r.wait.year_latest ?? r.wait.year_feasible) - r.wait.year_feasible);
    return spread ? `${r.year}–${r.year + spread}` : `${r.year}`;
  }
  const upStatus = (u, dec, year) => (upYear(u, dec) <= year ? "operational" : u.infra_status || "planned");
  const atRisk = (u, dec) => upYear(u, dec) - u.year_desired >= 2 || u.phase === "study";

  // what changed between two decision sets, with the reason per request
  function diff(a, b) {
    const ra = simulate(a).res, rb = simulate(b).res, out = [];
    for (const id of new Set([...Object.keys(ra), ...Object.keys(rb)])) {
      if (ra[id]?.year === rb[id]?.year && ra[id]?.status === rb[id]?.status) continue;
      const o = ORDERS.concat(b.batteries || []).find((x) => x.id === id);
      out.push({ id, o, from: ra[id], to: rb[id], reason: reason(o, a, b) });
    }
    const count = (res) => ["proceeds", "delayed", "not_possible"].map((k) => Object.values(res).filter((r) => r.status === k).length);
    return { out, before: count(ra), after: count(rb) };
  }
  function reason(o, a, b) {
    if (!o) return { type: "cancel" };
    const moved = upgradesIn(o.area_id).find((u) => upYear(u, a) !== upYear(u, b));
    if (moved) return { type: "upg", id: moved.id, year: upYear(moved, b) };
    if ((b.batteries || []).some((x) => x.area_id === o.area_id) && (b.batteries || []).length > (a.batteries || []).length) return { type: "bat" };
    if ((b.cancelled || []).length > (a.cancelled || []).length) return { type: "cancel" };
    return { type: "prio" };
  }

  // ---------- real capaciteitskaart ----------
  const ckCode = (p, d) => Math.max(p[`code_${d}`] ?? 0, p[`tennet_code_${d}`] ?? 0);
  function realStats() {
    const fs = D().realAreas?.features || [], seen = new Map();
    for (const f of fs) { const p = f.properties; if (!seen.has(p.name)) seen.set(p.name, p); }
    const uniq = [...seen.values()].filter((p) => inDrenthe(...centroid(fs.find((f) => f.properties.name === p.name).geometry)));
    const withQueue = uniq.filter((p) => (p.queue_afname_mw || 0) + (p.queue_teruglevering_mw || 0) > 0).length;
    const mw = uniq.reduce((s, p) => s + (p.queue_afname_mw || 0) + (p.queue_teruglevering_mw || 0), 0);
    const drenthe = fs.find((f) => f.properties.tennet_area === "Drenthe")?.properties;
    return { areas: uniq.length, withQueue, mw, solvedFeedIn: drenthe?.tennet_solved_teruglevering };
  }
  function centroid(g) {
    const ring = polys(g).sort((a, b) => b[0].length - a[0].length)[0][0];
    const [sx, sy] = ring.reduce(([x, y], [a, b]) => [x + a, y + b], [0, 0]);
    return [sy / ring.length, sx / ring.length];
  }

  return { START, END, MEASURE, init, orders, addOrder, area, areaAt, realAreaAt, inDrenthe, inGeom, simulate, areaStatus, series, firstBottleneck,
    deadline, estRange, upYear, upStatus, atRisk, upgradesIn, oDir, oMW, diff, ckCode, realStats, centroid };
})();
