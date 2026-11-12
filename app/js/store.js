// Data loading + shared state for the v2 app. Reads ../data/app/* (register, upgrades, demo areas) and ../data/real/* (real grid data).
// State that a user creates (new requests, recorded decisions, timeline events, language) is kept in localStorage so a refresh keeps it.

const STORE = {
  data: null,
  state: {
    lang: "nl", year: 2029, dir: "afname", view: "today",          // planner map: "today" (capaciteitskaart) | "proj" (register)
    layers: { areas: true, stations: true, upgrades: true, cables: true, projects: true },
    applied: { upgradeYears: {}, cancelled: [], batteries: [] },     // decisions in force
    draft: { upgradeYears: {}, cancelled: [], batteries: [] },       // simulator what-if
    userOrders: [], events: {}, simArea: null,
  },
  listeners: [],
  on(fn) { this.listeners.push(fn); },
  set(patch) { Object.assign(this.state, patch); this.save(); this.listeners.forEach((f) => f()); },
  save() {
    try {
      const { lang, applied, userOrders, events } = this.state;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ lang, applied, userOrders, events: serialEvents(events) }));
    } catch (_) { /* storage unavailable: keep in memory */ }
  },
  reset() { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} location.hash = "#/"; location.reload(); },
};
const TODAY = "12-11-2026";
const SAVE_KEY = "netwijzer-v3"; // new key: old saved demo state (with removed projects) is ignored
const serialEvents = (ev) => Object.fromEntries(Object.entries(ev).map(([k, list]) => [k, list.map((e) => ({ ...e }))]));

// Demo focus: the 2-minute story uses a few projects only, so the map stays readable.
// The full illustrative register stays in data/app/plans.json (the legacy app still uses all of it).
const DEMO_PLANS = ["p-001", "p-002", "p-005"]; // solar park + business park in Veenoord, electrolyser in Emmen

// Demo orders that show the ACM priority classes (all illustrative)
const EXTRA_ORDERS = [
  { id: "d-bat", title_nl: "Netbatterij", title_en: "Grid battery", category: "battery", mw_offtake: 0, mw_feed_in: 0, mw_flex: 15, lat: 52.70, lon: 6.84, year_needed: 2027, maturity: "permit", party: "Demo" },
  { id: "d-hos", title_nl: "Uitbreiding ziekenhuis", title_en: "Hospital expansion", category: "hospital", mw_offtake: 4, mw_feed_in: 0, lat: 52.78, lon: 6.89, year_needed: 2028, maturity: "permit", party: "Demo" },
];
const MINE = ["p-001", "p-005"]; // the demo customer's own projects (a developer: solar park + electrolyser)

async function loadData() {
  const get = (p) => fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [areas, upgrades, plans, lines, osm, realAreas, realLines, realStations, muni, outline, gaps] = await Promise.all([
    get("../data/app/areas.geojson"), get("../data/app/upgrades.json"), get("../data/app/plans.json"), get("../data/app/lines.json"),
    get("../data/drenthe-substations-osm.json"), get("../data/real/drenthe-supply-areas.geojson"),
    get("../data/real/drenthe-hv-lines.geojson"), get("../data/real/drenthe-hv-stations.geojson"), get("../data/drenthe-municipalities.geojson"),
    get("../data/app/drenthe-outline.geojson"), get("../data/real/drenthe-supply-gaps.geojson"),
  ]);
  if (!areas || !upgrades || !plans) throw new Error("data/app not found");
  const stations = (Array.isArray(osm) ? osm : Object.values(osm || {}).find(Array.isArray) || []);
  STORE.data = { areas, upgrades, plans: plans.filter((p) => DEMO_PLANS.includes(p.id)), lines: lines || [], stations, realAreas, realLines, realStations, muni, outline, gaps };

  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (saved) Object.assign(STORE.state, { lang: saved.lang || "nl", applied: saved.applied || STORE.state.applied, userOrders: saved.userOrders || [], events: saved.events || {} });
  } catch (_) { /* ignore */ }
  STORE.state.draft = JSON.parse(JSON.stringify(STORE.state.applied));
  ENGINE.init();
  for (const o of ENGINE.orders().filter((x) => x.mine)) if (!STORE.state.events[o.id]) seedEvents(o, true);
}

// timeline events are stored as plain data: { date, kind, key, vars }
function seedEvents(o, demoHistory = false) {
  const r = ENGINE.simulate(STORE.state.applied).res[o.id];
  const area = ENGINE.area(o.area_id)?.name || "";
  STORE.state.events[o.id] = [
    { date: demoHistory ? "03-03-2026" : TODAY, kind: "done", key: "ev_submitted" },
    { date: demoHistory ? "17-03-2026" : TODAY, kind: "done", key: "ev_queued", vars: { prio: o.priority, area } },
    { date: demoHistory ? "17-03-2026" : TODAY, kind: "now", key: "ev_estimate", vars: { est: ENGINE.estRange(r), wait: r?.wait?.id || "" } },
  ];
}
function eventText(e) {
  const v = e.vars || {};
  if (e.key === "ev_queued") return `${t("ev_queued")}: ${t("pr" + v.prio)}, ${v.area}`;
  if (e.key === "ev_estimate") {
    const u = v.wait && STORE.data.upgrades.find((x) => x.id === v.wait);
    return `${t("ev_estimate")}: ${v.est}${u ? `. ${t("waiting_for")} ${u[`title_${STORE.state.lang}`]}` : ""}`;
  }
  if (e.key === "ev_changed") return `${t("ev_changed")}: ${v.from} → ${v.to}, ${reasonText(v.reason)}`;
  if (e.key === "ev_option") return `${t("option_requested")} ${t("o_" + v.option).toLowerCase()}`;
  return t(e.key, v);
}
function reasonText(r) {
  if (!r) return "";
  if (r.type === "upg") { const u = STORE.data.upgrades.find((x) => x.id === r.id); return t("because_upg", { u: u ? u[`title_${STORE.state.lang}`] : "", y: r.year }); }
  return t({ bat: "because_bat", cancel: "because_cancel", prio: "because_prio" }[r.type]);
}
function toast(msg) {
  document.querySelector(".toast")?.remove();
  document.body.insertAdjacentHTML("beforeend", `<div class="toast" role="status">${icon("check")} ${msg}</div>`);
  setTimeout(() => document.querySelector(".toast")?.remove(), 3500);
}
