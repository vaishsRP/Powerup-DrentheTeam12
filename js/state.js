// Shared state + data loading. Contract: docs/CONTRACT.md §2. Owner: Dev (Teammate A).
// Every view listens for "dataready" (once) and "statechange" (every change) and redraws itself.
// Nobody calls another person's functions directly; change things only through APP.setState().

window.APP = {
  data: null, // { areas, upgrades, plans, stations, cables, construction }
  state: {
    year: 2026,              // year shown on the map (slider)
    direction: "afname",     // "afname" (offtake) | "teruglevering" (feed-in)
    scenario: "expected",    // "contracted" | "expected" | "everything"
    lang: "nl",              // "nl" | "en"
    upgradeYears: {},        // overrides of upgrade in-service years, e.g. { "veenoord-boerdijk": 2031 } (delay ripple)
    measures: [],            // e.g. [{ type: "battery", areaId: "veenoord", mw: 10 }]
    layers: { substations: true, cables: true, upgrades: true, plans: true },
    selectedAreaId: null,
    selectedPlanId: null,
    tab: "location",         // "location" | "plans" | "load" | "scenarios"
  },
  setState(patch) {
    Object.assign(this.state, patch);
    document.dispatchEvent(new CustomEvent("statechange", { detail: patch }));
  },
};

(async function loadData() {
  const get = (p) => fetch(p).then((r) => {
    if (!r.ok) throw new Error(`${p}: ${r.status}`);
    return r.json();
  });
  const optional = (p) => fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  try {
    const [areas, upgrades, plans, stationRaw, cables, construction] = await Promise.all([
      get("data/app/areas.geojson"),
      get("data/app/upgrades.json"),
      get("data/app/plans.json"),
      get("data/drenthe-substations-osm.json"),
      optional("data/real/tennet-cables.geojson"),
      optional("data/real/osm-construction.geojson"),
    ]);
    const stations = Array.isArray(stationRaw) ? stationRaw : (stationRaw.stations || []);
    APP.data = { areas, upgrades, plans, stations, cables, construction };
    document.dispatchEvent(new Event("dataready"));
    APP.setState({}); // first render
  } catch (e) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<pre style="color:#c00;padding:8px">Could not load data (${e.message}). ` +
        `Open via a local server: python -m http.server, then http://localhost:8000</pre>`
    );
  }
})();
