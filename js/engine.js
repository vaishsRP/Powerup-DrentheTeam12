// Calculation engine: pure functions, no DOM. Contract: docs/CONTRACT.md §3. Owner: Data & logic.
// All functions take (…, state) and read APP.data. Logic follows docs/PLAN.md §6.

const ENGINE = (() => {
  const START = 2026, END = 2040;
  const NEXT_PMIEK = 2027; // next pMIEK adoption (Feb 2027); anything earlier is too late
  const WEIGHTS = { idea: 0.25, planned: 0.5, permit: 0.75, contracted: 0.95 };
  const STATUS = (r) => (r < 0.8 ? "room" : r <= 1 ? "limited" : "bottleneck");

  // 24-hour shapes, peak = 1 (illustrative, docs/PLAN.md §6)
  const PROFILES = {
    evening_peak: [.35,.3,.28,.28,.3,.4,.55,.65,.6,.55,.5,.5,.5,.5,.55,.65,.8,.95,1,.95,.85,.7,.55,.45],
    daytime_solar: [0,0,0,0,0,0,.05,.15,.35,.55,.75,.9,1,.95,.85,.7,.5,.3,.12,.03,0,0,0,0],
    wind: Array(24).fill(0.6),
    flat: Array(24).fill(1),
    night: [.9,1,1,1,.9,.7,.4,.2,.1,.1,.1,.1,.1,.1,.1,.1,.2,.4,.6,.7,.8,.85,.9,.9],
    flexible: [1,1,1,1,1,1,.8,.5,.3,.3,.4,.6,.7,.6,.4,.3,.1,0,0,0,.2,.5,.8,1],
  };
  const BASE_SHAPE = { afname: PROFILES.evening_peak, teruglevering: PROFILES.daytime_solar };

  const key = (dir) => (dir === "teruglevering" ? "feed_in" : "offtake");
  const area = (id) => APP.data.areas.features.find((f) => f.properties.id === id)?.properties;
  const plansIn = (id) => APP.data.plans.filter((p) => p.area_id === id);
  const upgradesIn = (id) => APP.data.upgrades.filter((u) => u.area_id === id);
  const upgradeYear = (u, state) => state.upgradeYears[u.id] ?? u.year_feasible;

  function weight(plan, state) {
    if (state.scenario === "everything") return 1;
    if (state.scenario === "contracted") return plan.maturity === "contracted" ? 1 : 0;
    return WEIGHTS[plan.maturity] ?? 0.5;
  }

  function capacity(areaId, year, state, dir = state.direction) {
    const a = area(areaId), k = key(dir);
    const added = upgradesIn(areaId)
      .filter((u) => upgradeYear(u, state) <= year)
      .reduce((s, u) => s + (u[`mw_added_${k}`] || 0), 0);
    return a[`cap_${k}_mw`] + added;
  }

  function measureRelief(areaId, state, dir) {
    return state.measures
      .filter((m) => m.areaId === areaId && (m.direction ?? dir) === dir)
      .reduce((s, m) => s + (m.mw || 0), 0);
  }

  // peak load in an area in a year; opts.fullPlanId = count this plan at 100 % (for its own estimate)
  function load(areaId, year, state, dir = state.direction, opts = {}) {
    const a = area(areaId), k = key(dir);
    const base = a[`base_${k}_mw`] * Math.pow(1 + a[`growth_${k}`], year - START);
    const plans = plansIn(areaId)
      .filter((p) => p.year_needed <= year)
      .reduce((s, p) => s + p[`mw_${k}`] * (p.id === opts.fullPlanId ? 1 : weight(p, state)), 0);
    return Math.max(0, base + plans - measureRelief(areaId, state, dir));
  }

  function areaStatus(areaId, state, year = state.year, dir = state.direction) {
    const l = load(areaId, year, state, dir), c = capacity(areaId, year, state, dir);
    return { load: l, capacity: c, ratio: l / c, status: STATUS(l / c) };
  }

  function loadByYear(areaId, state, dir = state.direction, to = 2035) {
    const years = [], loads = [], caps = [];
    for (let y = START; y <= to; y++) {
      years.push(y);
      loads.push(load(areaId, y, state, dir));
      caps.push(capacity(areaId, y, state, dir));
    }
    return { years, load: loads, capacity: caps };
  }

  // 24 hourly values on the peak day of state.year; batteries clip the peak (simple model)
  function dayCurve(areaId, state, dir = state.direction) {
    const a = area(areaId), k = key(dir), y = state.year;
    const base = a[`base_${k}_mw`] * Math.pow(1 + a[`growth_${k}`], y - START);
    const hours = [...Array(24).keys()];
    let curve = hours.map((h) => base * BASE_SHAPE[dir][h]);
    for (const p of plansIn(areaId)) {
      if (p.year_needed > y || !p[`mw_${k}`]) continue;
      const shape = PROFILES[p.profile] || PROFILES.flat, w = weight(p, state);
      curve = curve.map((v, h) => v + p[`mw_${k}`] * w * shape[h]);
    }
    const relief = measureRelief(areaId, state, dir);
    if (relief > 0) {
      const peak = Math.max(...curve);
      curve = curve.map((v) => Math.min(v, peak - relief));
    }
    return { hours, load: curve, capacity: capacity(areaId, y, state, dir) };
  }

  // When can this plan connect? Earliest year >= year_needed where the area has room with this plan at 100 %.
  function connectionEstimate(planId, state) {
    const p = APP.data.plans.find((x) => x.id === planId);
    const dir = p.mw_feed_in > p.mw_offtake ? "teruglevering" : "afname";
    for (let y = Math.max(p.year_needed, START); y <= END; y++) {
      const l = load(p.area_id, y, state, dir, { fullPlanId: p.id });
      if (l <= capacity(p.area_id, y, state, dir)) {
        const blocking = upgradesIn(p.area_id).find((u) => upgradeYear(u, state) === y && y > p.year_needed);
        const band = blocking ? (blocking.years_verified ? 1 : 2) : 0; // uncertainty range in years
        return { planId, direction: dir, earliest: y, latest: y + band, onTime: y <= p.year_needed, blockingUpgradeId: blocking?.id ?? null };
      }
    }
    return { planId, direction: dir, earliest: null, latest: null, onTime: false, blockingUpgradeId: null, reason: "no_upgrade_planned" };
  }

  // Which pMIEK should a fix have been in? Investment plan (Jan Y-L) is based on the pMIEK of Feb (Y-L-1).
  function decisionDeadline(areaId, state, dir = state.direction) {
    let firstBottleneck = null;
    for (let y = START; y <= END; y++) {
      if (areaStatus(areaId, state, y, dir).status === "bottleneck") { firstBottleneck = y; break; }
    }
    if (firstBottleneck === null) return { needed: false };
    const u = upgradesIn(areaId)[0];
    const lead = u?.lead_years ?? 4; // default: station extension ≈ 4 yrs (Enexis IP2026)
    const pmiekYear = firstBottleneck - lead - 1;
    return { needed: true, firstBottleneck, leadYears: lead, investmentPlanYear: firstBottleneck - lead, pmiekYear, tooLate: pmiekYear < NEXT_PMIEK };
  }

  // red/orange flags for delayed upgrades (the province's request, RESEARCH.md §9)
  function delayFlags(state) {
    return APP.data.upgrades.map((u) => {
      const delay = upgradeYear(u, state) - u.year_desired;
      return { upgradeId: u.id, areaId: u.area_id, delay, flag: delay >= 2 ? "red" : delay === 1 ? "orange" : "none" };
    });
  }

  return { areaStatus, loadByYear, dayCurve, connectionEstimate, decisionDeadline, delayFlags, upgradeYear, plansIn, upgradesIn, area };
})();
