// Map. Owner: map (Data & logic). Two modes, following the panel tab:
//   CUSTOMER (tabs Locatiecheck / Plannen): subtle colour zones, the selected project highlighted, and only the
//     infrastructure relevant to that project (station, grid upgrade, cable) with its status and relevance.
//   PLANNER (tabs Belasting / Scenario's): strong congestion colours + layers Substations / Cables / Projects to toggle.
// Zooming in adds finer detail: the REAL capaciteitskaart supply areas (data/real/drenthe-supply-areas.geojson, zoom >= 10)
// when present, otherwise a fine demo grid (zoom >= 11). Real TenneT lines/cables/stations are used when present too.
// Also owns the header controls, tab switching and the legend. Reads ENGINE.* and APP.state; changes only via APP.setState().
// Styles are injected below so no shared file is touched. Text: local dictionary (NL? = proofread, then move to i18n.js).

(() => {
  // ---------------------------------------------------------------- text
  const TXT = {
    nl: {
      mode_customer: "Klant", mode_planner: "Planner", // NL?
      congestion: "Netcongestie", infrastructure: "Infrastructuur",
      room: "Ruimte", limited: "Beperkt", solved_planned: "Knelpunt, oplossing gepland", no_solution: "Knelpunt, geen oplossing gepland", // NL?
      l_substations: "Onderstations", l_cables: "Kabels en verbindingen", l_projects: "Projecten", // NL?
      operational: "In bedrijf", under_construction: "In aanbouw", planned: "Gepland", underground: "Ondergronds aangelegd", // NL?
      overhead: "Bovengrondse lijn", planned_cable: "Gepland, ondergrondse kabel", // NL?
      affects: "Bepaalt uw aansluiting", tbc: "Te bevestigen door de netbeheerder", // NL?
      your_station: "Voedend station (benadering)", your_project: "Uw project", // NL?
      pick_project: "Klik op uw project om de relevante infrastructuur te zien.", // NL?
      relevance_note: "Bij twijfel over de invloed op uw aanvraag staat er: te bevestigen door de netbeheerder.", // NL?
      area: "Gebied", load: "Piekbelasting", capacity: "Capaciteit", status: "Status",
      upgrade: "Netuitbreiding", phase: "Fase", commissioned: "In opdracht", study: "In studie", // NL?
      desired: "Gewenst", feasible: "Haalbaar", likely_range: "Verwachte oplevering", delay: "Vertraging", years: "jaar", // NL?
      space: "Ruimte / vergunning", risk: "Risico", added: "Extra capaciteit", approx: "locatie bij benadering", // NL?
      previously: "Eerder gepland", schematic: "schematisch tracé", delayed: "vertraagd", // NL?
      no_upgrade: "Geen netuitbreiding gepland", demo: "MW: demo · fictieve gegevens", // NL?
      sources: "Jaartallen: Enexis IP2026 / TenneT IP2026",
      zoom_hint: "Zoom in voor meer detail", // NL?
      detail_real: "Detail: regionale voedingsgebieden (capaciteitskaart)", // NL?
      detail_grid: "Detail (demo): kleur = status netgebied, donkerder = meer geregistreerde vraag dichtbij", // NL?
      connect: "aansluiting", on_time: "op tijd", line: "Hoogspanningsverbinding", // NL?
      cap0: "Capaciteit beschikbaar", cap1: "Beperkt beschikbaar, zonder wachtrij", cap2: "In onderzoek, met wachtrij", cap3: "Tekort, met wachtrij", // capaciteitskaart wording
      cap_title: "Capaciteitskaart (echt, totaal)", regional: "Regionaal net", tennet_grid: "TenneT-net", queue: "Wachtrij", requests: "verzoeken", // NL?
      solved: "Verwacht opgelost", source_ck: "Bron: Capaciteitskaart, Netbeheer Nederland · stand 12-11-2026", // NL?
      your_location: "Uw locatie op de capaciteitskaart", tennet_station: "TenneT-station", source_tennet: "Bron: TenneT", // NL?
    },
    en: {
      mode_customer: "Customer", mode_planner: "Planner",
      congestion: "Grid congestion", infrastructure: "Infrastructure",
      room: "Room", limited: "Limited", solved_planned: "Bottleneck, solution planned", no_solution: "Bottleneck, no solution planned",
      l_substations: "Substations", l_cables: "Cables and lines", l_projects: "Projects",
      operational: "Operational", under_construction: "Under construction", planned: "Planned", underground: "Installed underground",
      overhead: "Overhead line", planned_cable: "Planned, underground cable",
      affects: "Determines your connection", tbc: "To be confirmed by the grid operator",
      your_station: "Supplying station (approximation)", your_project: "Your project",
      pick_project: "Click your project to see the infrastructure that matters for it.",
      relevance_note: "Where it's unclear whether something affects your request, it says: to be confirmed by the grid operator.",
      area: "Area", load: "Peak load", capacity: "Capacity", status: "Status",
      upgrade: "Grid upgrade", phase: "Phase", commissioned: "Commissioned", study: "In study",
      desired: "Desired", feasible: "Feasible", likely_range: "Expected delivery", delay: "Delay", years: "yr",
      space: "Space / permit", risk: "Risk", added: "Added capacity", approx: "approximate location",
      previously: "Previously planned", schematic: "schematic route", delayed: "delayed",
      no_upgrade: "No grid upgrade planned", demo: "MW: demo · illustrative data",
      sources: "Years: Enexis IP2026 / TenneT IP2026",
      zoom_hint: "Zoom in for more detail",
      detail_real: "Detail: regional supply areas (capaciteitskaart)",
      detail_grid: "Detail (demo): colour = grid area status, darker = more registered demand nearby",
      connect: "connection", on_time: "on time", line: "High-voltage line",
      cap0: "Capacity available", cap1: "Limited, no queue", cap2: "Under investigation, with queue", cap3: "Shortage, with queue",
      cap_title: "Capacity map (real, total)", regional: "Regional grid", tennet_grid: "TenneT grid", queue: "Queue", requests: "requests",
      solved: "Expected solved", source_ck: "Source: Capaciteitskaart, Netbeheer Nederland · as of 12-11-2026",
      your_location: "Your location on the capacity map", tennet_station: "TenneT station", source_tennet: "Source: TenneT",
    },
  };
  const tm = (k) => TXT[APP.state.lang]?.[k] ?? TXT.nl[k] ?? k;
  const tt = (k) => (typeof t === "function" ? t(k) : k); // shared i18n.js keys

  // ---------------------------------------------------------------- style
  const C = { room: "#33A92F", limited: "#FAC850", solved_planned: "#FF6428", no_solution: "#C8102E",
              navy: "#003584", blue: "#3C8CFA", grey: "#6b6b6b", brown: "#7a5230" };
  const Z_STATIONS = 10, Z_DETAILS = 11;

  document.head.insertAdjacentHTML("beforeend", `<style>
    .mk-label, .st-label, .pl-label, .area-label, .near-label { font: 11px Arial, sans-serif; box-shadow: none; }
    .mk-label::before, .st-label::before, .pl-label::before, .area-label::before, .near-label::before { display: none; }
    .mk-label { background: #fff; border: 1px solid ${C.blue}; color: ${C.navy}; padding: 0 4px; border-radius: 3px; }
    .mk-label.risk { border-color: ${C.no_solution}; color: ${C.no_solution}; }
    .st-label { background: transparent; border: 0; color: ${C.navy}; font-weight: bold; text-shadow: 0 0 3px #fff, 0 0 3px #fff; padding: 0; }
    .pl-label { background: #fff; border: 1px solid ${C.navy}; color: ${C.navy}; padding: 1px 4px; }
    .area-label { background: rgba(255,255,255,.85); border: 0; color: ${C.navy}; padding: 1px 4px; text-align: center; }
    .near-label { background: #fff; border: 1px solid #bbb; border-left: 4px solid ${C.navy}; color: #1a1a1a; padding: 3px 6px; line-height: 1.35; white-space: nowrap; }
    .near-label b { color: ${C.navy}; } .near-label .ok { color: ${C.room}; } .near-label .tbc { color: #8a6d00; } .near-label .key { color: ${C.no_solution}; font-weight: bold; }
    .sel-pin { position: relative; }
    .sel-pin span { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; background: ${C.blue}; border: 3px solid #fff; box-shadow: 0 0 0 2px ${C.navy}; box-sizing: border-box; }
    .sel-pin i { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%; border: 3px solid ${C.blue}; box-sizing: border-box; animation: selpulse 1.8s ease-out infinite; }
    @keyframes selpulse { 0% { transform: scale(.4); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
    .mode-ctl { display: flex; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.25); overflow: hidden; }
    .mode-ctl button { border: 0; background: #fff; color: ${C.navy}; padding: 6px 12px; font: 13px Arial, sans-serif; cursor: pointer; }
    .mode-ctl button.active { background: ${C.navy}; color: #fff; }
    .leaflet-popup-content { font: 13px Arial, sans-serif; min-width: 220px; }
    .leaflet-popup-content h4 { margin: 0 0 6px; color: ${C.navy}; font-size: 14px; }
    .leaflet-popup-content table { border-collapse: collapse; width: 100%; }
    .leaflet-popup-content td { padding: 2px 0; vertical-align: top; }
    .leaflet-popup-content td:first-child { color: #666; padding-right: 10px; white-space: nowrap; }
    .leaflet-popup-content .note { color: #888; font-size: 11px; margin-top: 6px; }
    #legend b { display: block; margin: 4px 0 2px; color: ${C.navy}; }
    #legend .row { display: flex; align-items: center; gap: 6px; margin: 2px 0; white-space: nowrap; }
    #legend .sw { width: 14px; height: 12px; border-radius: 2px; display: inline-block; flex: none; }
    #legend .pt { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex: none; box-sizing: border-box; }
    #legend .ln { width: 18px; height: 0; display: inline-block; flex: none; border-top-width: 3px; }
    #legend .hint { color: #666; font-size: 11px; margin-top: 6px; max-width: 240px; white-space: normal; }
  </style>`);

  // ---------------------------------------------------------------- state
  let map, areaLayer, detailLayer, areaLabelLayer, nearLayer, substationsG, cablesG, projectsG, layerCtl, modeCtl;
  let stations = [], lines = [], realLines = null, realAreas = null, realStations = null, lastMode = null, lastPlan = null;
  const fmt = (v) => Math.round(v);
  const mode = () => (["load", "scenarios"].includes(APP.state.tab) ? "planner" : "customer");
  const zoom = () => (map ? map.getZoom() : 9);
  const slug = (name) => name.replace(/^\d+ kV /, "").toLowerCase().replace(/ /g, "-");
  const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
  const getJSON = (p) => fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const pin = () => L.divIcon({ className: "", iconSize: [0, 0] });

  // ---------------------------------------------------------------- logic helpers
  function areaClass(id, s) {
    const st = ENGINE.areaStatus(id, s);
    if (st.status !== "bottleneck") return { key: st.status, st };
    const future = ENGINE.upgradesIn(id).some((u) => ENGINE.upgradeYear(u, s) > s.year);
    return { key: future ? "solved_planned" : "no_solution", st };
  }
  // physical status of an upgrade in the selected year
  const upStatus = (u, s) => (ENGINE.upgradeYear(u, s) <= s.year ? "operational" : u.infra_status || "planned");
  const atRisk = (u, s) => ENGINE.upgradeYear(u, s) > s.year && (ENGINE.upgradeYear(u, s) - u.year_desired >= 2 || u.phase === "study");
  function range(u, s) {
    const y = ENGINE.upgradeYear(u, s), latest = Math.max(u.year_latest ?? y, y + ((u.year_latest ?? y) - u.year_feasible));
    return latest > y ? `${y}–${latest}` : `${y}`;
  }
  const lineStatus = (l, s) => (l.year_feasible <= s.year ? (l.cable ? "underground" : "operational") : l.cable ? "planned_cable" : l.infra_status || "planned");
  const LINE_STYLE = {
    operational: { color: C.grey, weight: 3, dashArray: null },
    underground: { color: C.brown, weight: 3, dashArray: "2 5" },
    under_construction: { color: C.solved_planned, weight: 3, dashArray: "8 5" },
    planned: { color: C.blue, weight: 3, dashArray: "10 7" },
    planned_cable: { color: C.blue, weight: 3, dashArray: "2 6" },
  };
  const realLineStatus = (p) => (p.kind === "cable" ? "underground" : "operational");

  // real capaciteitskaart codes: 0 available · 1 limited, no queue · 2 under investigation, with queue · 3 shortage, with queue
  const CODE_COLOR = [C.room, C.limited, C.solved_planned, C.no_solution];
  const ckCode = (p, dir) => Math.max(p[`code_${dir}`] ?? 0, p[`tennet_code_${dir}`] ?? 0); // "total" = regional and TenneT combined
  const capText = (c) => (c == null ? "–" : tm(`cap${c}`));
  function realAreaAt(lat, lon) {
    if (!realAreas) return null;
    return realAreas.features.find((f) => {
      const g = f.geometry, polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      return polys.some((pl) => inRing(lon, lat, pl[0]) && !pl.slice(1).some((h) => inRing(lon, lat, h)));
    }) || null;
  }
  function realAreaPopup(p, s) {
    const mw = (v) => (v == null ? "–" : `${(+v).toFixed(1)} MW`);
    return `<h4>${p.name}${p.operator ? ` · ${p.operator}` : ""}</h4><table>
      ${row(`<b>${tm("regional")}</b>`, "")}
      ${row(tt("offtake"), capText(p.code_afname))}${row(tt("feed_in"), capText(p.code_teruglevering))}
      ${row(`${tm("queue")} ${tt("offtake").toLowerCase()}`, `${mw(p.queue_afname_mw)} (${p.requests_afname ?? 0} ${tm("requests")})`)}
      ${row(`${tm("queue")} ${tt("feed_in").toLowerCase()}`, `${mw(p.queue_teruglevering_mw)} (${p.requests_teruglevering ?? 0} ${tm("requests")})`)}
      ${p.tennet_area ? row(`<b>${tm("tennet_grid")}</b>`, p.tennet_area) : ""}
      ${p.tennet_area ? row(tt("offtake"), capText(p.tennet_code_afname) + (p.tennet_solved_afname ? ` · ${tm("solved").toLowerCase()} ${p.tennet_solved_afname}` : "")) : ""}
      ${p.tennet_area ? row(tt("feed_in"), capText(p.tennet_code_teruglevering) + (p.tennet_solved_teruglevering ? ` · ${tm("solved").toLowerCase()} ${p.tennet_solved_teruglevering}` : "")) : ""}
      </table><div class="note">${tm("source_ck")}</div>`;
  }

  // ---------------------------------------------------------------- popups
  function areaPopup(id, s) {
    const a = ENGINE.area(id), { key, st } = areaClass(id, s);
    const ups = ENGINE.upgradesIn(id).map((u) => `${u[`title_${s.lang}`]} (${ENGINE.upgradeYear(u, s)})`).join("<br>");
    return `<h4>${a.name} · ${s.year}</h4><table>
      ${row(tm("status"), `<b style="color:${C[key]}">${tm(key)}</b>`)}
      ${row(tm("load"), `${fmt(st.load)} MW`)}${row(tm("capacity"), `${fmt(st.capacity)} MW`)}
      ${row(tm("upgrade"), ups || tm("no_upgrade"))}</table><div class="note">${tm("demo")}</div>`;
  }
  function upgradePopup(u, s) {
    const y = ENGINE.upgradeYear(u, s), delay = y - u.year_desired;
    return `<h4>${u[`title_${s.lang}`]}</h4><table>
      ${row(tm("status"), tm(upStatus(u, s)))}${row(tm("phase"), tm(u.phase))}
      ${row(tm("desired"), u.year_desired)}${row(tm("feasible"), y)}${row(tm("likely_range"), range(u, s))}
      ${delay > 0 ? row(tm("delay"), `<b style="color:${delay >= 2 ? C.no_solution : C.solved_planned}">+${delay} ${tm("years")}</b>`) : ""}
      ${row(tm("space"), u[`space_${s.lang}`] || "–")}${u[`risk_${s.lang}`] ? row(tm("risk"), u[`risk_${s.lang}`]) : ""}
      ${row(tm("added"), `${u.mw_added_offtake} MW`)}</table>
      <div class="note">${tm("sources")}${u.years_verified ? " ✓" : " 🔎"}${u.location_approx ? ` · ${tm("approx")}` : ""} · ${tm("demo")}</div>`;
  }
  function linePopup(l, s) {
    return `<h4>${l[`title_${s.lang}`]}</h4><table>
      ${row(tm("status"), tm(lineStatus(l, s)))}
      ${row(tm("likely_range"), l.year_latest > l.year_feasible ? `${l.year_feasible}–${l.year_latest}` : l.year_feasible)}
      ${l.year_previous ? row(tm("previously"), l.year_previous) : ""}</table>
      <div class="note">${l.source} · ${tm("schematic")}</div>`;
  }
  function stationPopup(st, s) {
    return `<h4>${st.name.replace(/^\d+ kV /, "")}</h4><table>${row("kV", st.voltages_kv.join(" / "))}
      ${row(tm("status"), tm("operational"))}</table>${st._area ? areaPopup(st._area, s).replace(/<h4>.*?<\/h4>/, "") : ""}`;
  }

  // ---------------------------------------------------------------- init
  document.addEventListener("dataready", async () => {
    map = L.map("map", { zoomControl: true }).setView([52.85, 6.6], 9);
    L.tileLayer("https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png", {
      attribution: 'Kaart: <a href="https://www.pdok.nl">PDOK</a> · Grenzen: CBS/PDOK · Stations: © OpenStreetMap contributors · Netdata: TenneT, Enexis, Netbeheer Nederland',
      maxZoom: 15,
    }).addTo(map);
    map.createPane("detail").style.zIndex = 405;
    map.createPane("lines").style.zIndex = 430;
    map.createPane("points").style.zIndex = 640;

    areaLayer = L.geoJSON(APP.data.areas, {
      style: () => ({ weight: 1, color: C.navy, fillOpacity: 0.5 }),
      onEachFeature: (f, l) => l.on("click", (e) => {
        if (mode() === "planner") {
          APP.setState({ selectedAreaId: f.properties.id, selectedPlanId: null });
          L.popup().setLatLng(e.latlng).setContent(areaPopup(f.properties.id, APP.state)).openOn(map);
        } else APP.setState({ selectedAreaId: f.properties.id });
      }),
    }).addTo(map);
    map.fitBounds(areaLayer.getBounds(), { padding: [20, 20] });

    detailLayer = L.layerGroup().addTo(map);
    areaLabelLayer = L.layerGroup().addTo(map);
    nearLayer = L.layerGroup();
    substationsG = L.layerGroup().addTo(map);
    cablesG = L.layerGroup().addTo(map);
    projectsG = L.layerGroup().addTo(map);

    // data: real stations (OSM), schematic line works, optional real layers from data/real/
    const raw = await getJSON("data/drenthe-substations-osm.json");
    stations = (Array.isArray(raw) ? raw : Object.values(raw).find(Array.isArray))
      .map((st) => ({ ...st, _area: ENGINE.area(slug(st.name)) ? slug(st.name) : null }));
    lines = (await getJSON("data/app/lines.json")) || [];
    realLines = await getJSON("data/real/drenthe-hv-lines.geojson");
    realStations = await getJSON("data/real/drenthe-hv-stations.geojson");
    realAreas = await getJSON("data/real/drenthe-supply-areas.geojson");

    // mode switch on the map (drives the panel tab, so map and panel stay in sync)
    modeCtl = L.control({ position: "topright" });
    modeCtl.onAdd = () => {
      const d = L.DomUtil.create("div", "mode-ctl");
      L.DomEvent.disableClickPropagation(d);
      d.innerHTML = `<button data-m="customer"></button><button data-m="planner"></button>`;
      d.querySelector('[data-m="customer"]').onclick = () => APP.setState({ tab: "location" });
      d.querySelector('[data-m="planner"]').onclick = () => APP.setState({ tab: "load" });
      return d;
    };
    modeCtl.addTo(map);

    map.on("zoomend", () => APP.setState({}));
    document.getElementById("year").addEventListener("input", (e) => APP.setState({ year: +e.target.value }));
    document.querySelectorAll("#direction button").forEach((b) => b.addEventListener("click", () => APP.setState({ direction: b.dataset.dir })));
    document.querySelectorAll("#lang button").forEach((b) => b.addEventListener("click", () => APP.setState({ lang: b.dataset.lang })));
    document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => APP.setState({ tab: b.dataset.tab })));
    APP.setState({});
  });

  // ---------------------------------------------------------------- layer control (planner only)
  function syncLayerControl(m) {
    if (layerCtl) { layerCtl.remove(); layerCtl = null; }
    if (m === "planner") {
      nearLayer.remove();
      for (const g of [substationsG, cablesG, projectsG]) if (!map.hasLayer(g)) g.addTo(map);
      layerCtl = L.control.layers(null, { [tm("l_substations")]: substationsG, [tm("l_cables")]: cablesG, [tm("l_projects")]: projectsG },
        { collapsed: false, position: "topright" }).addTo(map);
    } else {
      substationsG.remove(); cablesG.remove();
      if (!map.hasLayer(projectsG)) projectsG.addTo(map);
      nearLayer.addTo(map);
    }
  }

  // ---------------------------------------------------------------- zoom detail
  // Real regional supply areas (capaciteitskaart) if present; otherwise a fine hexagon grid derived from the register.
  function realStatusKey(p, dir) {
    const keys = Object.keys(p);
    const k = keys.find((x) => (dir === "afname" ? /afname/i : /opwek|invoed|teruglever/i).test(x) && /status/i.test(x)) || keys.find((x) => /status/i.test(x));
    const v = String(p[k] ?? "").toLowerCase();
    if (/zonder wachtrij/.test(v) && /beperkt/.test(v)) return "limited";
    if (/beschikbaar/.test(v) && !/tekort|beperkt/.test(v)) return "room";
    if (/onderzoek/.test(v)) return "solved_planned";
    if (/tekort|wachtrij/.test(v)) return "no_solution";
    return null;
  }
  function inRing(x, y, ring) {
    let ins = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  }
  let polysCache = null;
  const areaPolys = () => (polysCache ??= APP.data.areas.features.map((f) => ({ id: f.properties.id,
    polys: f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates })));
  function areaAt(lat, lon) {
    for (const a of areaPolys()) if (a.polys.some((p) => inRing(lon, lat, p[0]))) return a.id;
    return null;
  }

  function drawDetail(s, m) {
    detailLayer.clearLayers();
    const subtle = m === "customer";
    if (realAreas?.features?.length) {
      if (zoom() < Z_STATIONS) return "none";
      L.geoJSON(realAreas, { pane: "detail", style: (f) => ({ weight: 0.8, color: "#ffffff",
          fillColor: CODE_COLOR[ckCode(f.properties, s.direction)], fillOpacity: subtle ? 0.22 : 0.55 }),
        onEachFeature: (f, l) => {
          l.bindTooltip(`${f.properties.name}: ${capText(ckCode(f.properties, s.direction))}`);
          l.on("click", (e) => { L.DomEvent.stopPropagation(e); L.popup().setLatLng(e.latlng).setContent(realAreaPopup(f.properties, APP.state)).openOn(map); });
        } }).addTo(detailLayer);
      return "real";
    }
    if (zoom() < Z_DETAILS) return "none";
    // fine grid: hexagons ≈1.2 km at zoom 11, halving per extra zoom level
    const b = map.getBounds().pad(0.05), size = 0.011 * Math.pow(2, 11 - zoom());
    const cosLat = Math.cos((b.getCenter().lat * Math.PI) / 180);
    const dx = (size * 0.75) / cosLat, dy = (size * Math.sqrt(3)) / 2;
    const cls = {}, k = s.direction === "teruglevering" ? "mw_feed_in" : "mw_offtake";
    const plans = APP.data.plans.filter((p) => p.year_needed <= s.year && p[k] > 0);
    const r = size / 2;
    for (let col = 0, x = b.getWest(); x < b.getEast(); x += dx, col++) {
      for (let y = b.getSouth() + (col % 2 ? dy / 2 : 0); y < b.getNorth(); y += dy) {
        const aid = areaAt(y, x);
        if (!aid) continue;
        const key = (cls[aid] ??= areaClass(aid, s).key);
        let local = 0; // registered demand near this cell (MW), ~3 km fall-off
        for (const p of plans) local += p[k] * Math.exp(-(((p.lat - y) * 111) ** 2 + ((p.lon - x) * 111 * cosLat) ** 2) / 9);
        const shade = Math.min(1, local / 15), hx = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          hx.push([y + r * Math.sin(a) * (Math.sqrt(3) / 2), x + (r * Math.cos(a)) / cosLat]);
        }
        L.polygon(hx, { pane: "detail", interactive: false, weight: 0.5, color: "#ffffff",
          fillColor: C[key], fillOpacity: (subtle ? 0.14 : 0.3) + shade * (subtle ? 0.3 : 0.45) }).addTo(detailLayer);
      }
    }
    return "grid";
  }

  // ---------------------------------------------------------------- planner layers
  function estimateText(p, s) {
    const e = ENGINE.connectionEstimate(p.id, s);
    return e.earliest === null ? tm("no_upgrade") : e.onTime ? `${tm("on_time")} ${e.earliest}` : e.earliest === e.latest ? `${e.earliest}` : `${e.earliest}–${e.latest}`;
  }
  function drawProjectDots(s, labels, faint = false) {
    for (const p of APP.data.plans) {
      if (faint && p.id === s.selectedPlanId) continue; // customer view draws it as the highlighted pin
      const dot = L.circleMarker([p.lat, p.lon], { pane: "points", radius: faint ? 5 : 6, weight: 2, color: C.navy,
        opacity: faint ? 0.55 : 1, fillColor: "#fff", fillOpacity: faint ? 0.7 : 1 })
        .on("click", () => APP.setState({ selectedAreaId: p.area_id, selectedPlanId: p.id }))
        .addTo(projectsG);
      const label = `${p[`title_${s.lang}`]} · ${p.mw_offtake || p.mw_feed_in} MW · ${tm("connect")} ${estimateText(p, s)}`;
      if (labels) dot.bindTooltip(label, { permanent: true, direction: "right", offset: [8, 0], className: "pl-label" });
      else dot.bindTooltip(label);
    }
  }

  function drawPlanner(s) {
    substationsG.clearLayers(); cablesG.clearLayers(); projectsG.clearLayers(); areaLabelLayer.clearLayers();
    const z = zoom();
    for (const st of stations) {
      const full = st._area && ENGINE.areaStatus(st._area, s).status === "bottleneck";
      const mk = L.circleMarker([st.lat, st.lon], { pane: "points", radius: z >= Z_STATIONS ? 8 : 5, weight: 3,
        color: full ? C.solved_planned : C.navy, fillColor: C.navy, fillOpacity: 1 });
      if (z >= Z_STATIONS) mk.bindTooltip(st.name.replace(/^\d+ kV /, ""), { permanent: true, direction: "left", offset: [-8, 0], className: "st-label" });
      else mk.bindTooltip(st.name);
      mk.on("click", (e) => { if (st._area) APP.setState({ selectedAreaId: st._area }); L.popup().setLatLng(e.latlng).setContent(stationPopup(st, APP.state)).openOn(map); })
        .addTo(substationsG);
    }
    for (const u of APP.data.upgrades) {
      if (u.lat == null) continue;
      const stt = upStatus(u, s), risk = atRisk(u, s);
      const style = stt === "operational" ? { radius: 10, color: C.room, weight: 3, fillOpacity: 0 }
        : stt === "under_construction" ? { radius: 11, color: C.solved_planned, weight: 3, fillColor: "#fff", fillOpacity: 0.6, dashArray: "6 3" }
        : { radius: 11, color: risk ? C.no_solution : C.blue, weight: 3, fillColor: "#fff", fillOpacity: 0.6, dashArray: "4 3" };
      const mk = L.circleMarker([u.lat, u.lon], { pane: "points", ...style })
        .on("click", (e) => { APP.setState({ selectedAreaId: u.area_id }); L.popup().setLatLng(e.latlng).setContent(upgradePopup(u, APP.state)).openOn(map); })
        .addTo(substationsG);
      if (stt !== "operational") mk.bindTooltip(z >= Z_STATIONS ? range(u, s) : `${u[`title_${s.lang}`]}: ${range(u, s)}`,
        z >= Z_STATIONS ? { permanent: true, direction: "right", offset: [10, 0], className: `mk-label${risk ? " risk" : ""}` } : {});
    }
    if (realLines?.features?.length) {
      L.geoJSON(realLines, { pane: "lines", style: (f) => ({ ...LINE_STYLE[realLineStatus(f.properties)], weight: 2, opacity: 0.8 }),
        onEachFeature: (f, l) => l.bindTooltip(`${tm("line")} · ${tm(realLineStatus(f.properties))} · ${tm("source_tennet")}`) }).addTo(cablesG);
    }
    if (realStations?.features?.length && z >= Z_STATIONS) {
      for (const f of realStations.features) {
        const [lon, lat] = f.geometry.coordinates;
        L.circleMarker([lat, lon], { pane: "points", radius: 3, weight: 1, color: C.grey, fillColor: "#fff", fillOpacity: 1 })
          .bindTooltip(`${tm("tennet_station")}: ${f.properties.name || ""} · ${tm("operational")}${f.properties.built ? ` (${f.properties.built})` : ""} · ${tm("source_tennet")}`)
          .addTo(substationsG);
      }
    }
    for (const l of lines) {
      L.polyline(l.route.map((p) => [p.lat, p.lon]), { pane: "lines", ...LINE_STYLE[lineStatus(l, s)], opacity: 0.9 })
        .bindTooltip(`${l[`title_${s.lang}`]} · ${tm(lineStatus(l, s))}`)
        .on("click", (e) => L.popup().setLatLng(e.latlng).setContent(linePopup(l, APP.state)).openOn(map))
        .addTo(cablesG);
    }
    if (z >= Z_STATIONS) drawProjectDots(s, z >= Z_DETAILS);
    if (z >= Z_DETAILS) {
      areaLayer.eachLayer((l) => {
        const st = ENGINE.areaStatus(l.feature.properties.id, s);
        L.marker(l.getBounds().getCenter(), { interactive: false, keyboard: false, icon: pin() })
          .bindTooltip(`<b>${l.feature.properties.name}</b><br>${fmt(st.load)} / ${fmt(st.capacity)} MW (${Math.round(st.ratio * 100)}%)`,
            { permanent: true, direction: "center", className: "area-label" }).addTo(areaLabelLayer);
      });
    }
  }

  // ---------------------------------------------------------------- customer view
  function drawCustomer(s) {
    projectsG.clearLayers(); nearLayer.clearLayers(); areaLabelLayer.clearLayers();
    drawProjectDots(s, false, true);
    const p = s.selectedPlanId && APP.data.plans.find((x) => x.id === s.selectedPlanId);
    if (!p) return;

    // the selected project: pulsing pin + label (with the REAL capacity-map status of its location, when loaded)
    let locHtml = "";
    const ra = realAreaAt(p.lat, p.lon);
    if (ra) {
      const q = ra.properties, d = s.direction, c = ckCode(q, d), solved = q[`tennet_solved_${d}`], queue = q[`queue_${d}_mw`];
      locHtml = `<br><span style="color:#555">${tm("your_location")}:</span> ${q.name}${q.operator ? ` · ${q.operator}` : ""}<br>` +
        `<span style="color:${CODE_COLOR[c]};font-weight:bold">${capText(c)}</span>` + (queue != null ? ` · ${tm("queue")} ${(+queue).toFixed(1)} MW` : "") +
        (solved ? `<br>${tm("tennet_grid")} ${q.tennet_area}: ${tm("solved").toLowerCase()} ${solved}` : "") +
        `<br><span style="color:#888;font-size:10px">${tm("source_ck")}</span>`;
    }
    L.marker([p.lat, p.lon], { pane: "points", zIndexOffset: 1000, icon: L.divIcon({ className: "sel-pin", html: "<i></i><span></span>", iconSize: [0, 0] }) })
      .bindTooltip(`<b>${tm("your_project")}</b>: ${p[`title_${s.lang}`]} · ${p.mw_offtake || p.mw_feed_in} MW${locHtml}`,
        { permanent: true, direction: "top", offset: [0, -16], className: "near-label" })
      .addTo(nearLayer);

    const est = ENGINE.connectionEstimate(p.id, s);
    const tag = (affects) => (affects ? `<span class="key">${tm("affects")}</span>` : `<span class="tbc">${tm("tbc")}</span>`);
    const box = (title, status, extra, affects) => `<b>${title}</b><br>${status}${extra ? ` · ${extra}` : ""}<br>${tag(affects)}`;
    const label = (lat, lon, html, dir, off) => L.marker([lat, lon], { interactive: false, icon: pin() })
      .bindTooltip(html, { permanent: true, direction: dir, offset: off, className: "near-label" }).addTo(nearLayer);

    // 1. supplying station: the area is an approximation, so its role is always "to be confirmed"
    const st = stations.find((x) => x._area === p.area_id);
    if (st) {
      L.circleMarker([st.lat, st.lon], { pane: "points", radius: 8, weight: 3, color: C.navy, fillColor: C.navy, fillOpacity: 1 })
        .on("click", (e) => L.popup().setLatLng(e.latlng).setContent(stationPopup(st, APP.state)).openOn(map)).addTo(nearLayer);
      L.polyline([[p.lat, p.lon], [st.lat, st.lon]], { pane: "lines", color: C.navy, weight: 1.5, dashArray: "1 6", opacity: 0.8, interactive: false }).addTo(nearLayer);
      label(st.lat, st.lon, box(`${tm("your_station")}: ${st.name.replace(/^\d+ kV /, "")}`, `<span class="ok">${tm("operational")}</span>`, `${st.voltages_kv.join("/")} kV`, false), "left", [-12, 0]);
    }
    // 2. grid upgrades in this area: the one the estimate waits for "determines your connection"; others to be confirmed
    for (const u of ENGINE.upgradesIn(p.area_id)) {
      if (u.lat == null) continue;
      const stt = upStatus(u, s), affects = est.blockingUpgradeId === u.id;
      L.circleMarker([u.lat, u.lon], { pane: "points", radius: 12, weight: 3, fillColor: "#fff", fillOpacity: 0.7,
        color: stt === "operational" ? C.room : stt === "under_construction" ? C.solved_planned : C.blue, dashArray: stt === "operational" ? null : "4 3" })
        .on("click", (e) => L.popup().setLatLng(e.latlng).setContent(upgradePopup(u, APP.state)).openOn(map)).addTo(nearLayer);
      label(u.lat, u.lon, box(u[`title_${s.lang}`], tm(stt), stt === "operational" ? "" : range(u, s), affects), "right", [14, 0]);
    }
    // 3. cables / lines at this project's station (schematic works; real lines near the station when loaded)
    for (const l of lines.filter((x) => x.station_ids.includes(p.area_id))) {
      const ls = lineStatus(l, s), mid = l.route[Math.floor(l.route.length / 2)];
      L.polyline(l.route.map((q) => [q.lat, q.lon]), { pane: "lines", ...LINE_STYLE[ls] })
        .on("click", (e) => L.popup().setLatLng(e.latlng).setContent(linePopup(l, APP.state)).openOn(map)).addTo(nearLayer);
      label(mid.lat, mid.lon, box(l[`title_${s.lang}`], tm(ls), `${l.year_feasible}–${l.year_latest}`, false), "right", [8, 0]);
    }
    if (realLines?.features?.length && st) {
      // real TenneT lines/cables within ~6 km of the supplying station
      const nearParts = [];
      for (const f of realLines.features) {
        const parts = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
        for (const part of parts) if (part.some(([x, y]) => Math.abs(y - st.lat) < 0.055 && Math.abs(x - st.lon) < 0.085))
          nearParts.push({ type: "Feature", properties: f.properties, geometry: { type: "LineString", coordinates: part } });
      }
      L.geoJSON({ type: "FeatureCollection", features: nearParts }, { pane: "lines", style: (f) => ({ ...LINE_STYLE[realLineStatus(f.properties)], weight: 2.5 }),
        onEachFeature: (f, l) => l.bindTooltip(`${tm("line")} · ${tm(realLineStatus(f.properties))} · ${tm("tbc")} · ${tm("source_tennet")}`) }).addTo(nearLayer);
    }
    // bring the selected project and its infrastructure into view when the selection changes
    if (lastPlan !== p.id) {
      const pts = [[p.lat, p.lon]].concat(st ? [[st.lat, st.lon]] : [], ENGINE.upgradesIn(p.area_id).filter((u) => u.lat != null).map((u) => [u.lat, u.lon]));
      map.flyToBounds(L.latLngBounds(pts).pad(0.8), { maxZoom: 12, duration: 0.8 });
    }
  }

  // ---------------------------------------------------------------- legend
  function drawLegend(m, detail) {
    const sw = (k, op) => `<div class="row"><span class="sw" style="background:${C[k]};opacity:${op}"></span>${tm(k)}</div>`;
    const pt = (style, text) => `<div class="row"><span class="pt" style="${style}"></span>${text}</div>`;
    const ln = (k, text) => `<div class="row"><span class="ln" style="border-top-style:${LINE_STYLE[k].dashArray ? "dashed" : "solid"};border-color:${LINE_STYLE[k].color}"></span>${text}</div>`;
    let h = `<b>${tm("congestion")}</b>` + ["room", "limited", "solved_planned", "no_solution"].map((k) => sw(k, m === "customer" ? 0.35 : 0.75)).join("");
    h += `<b>${tm("infrastructure")}</b>`;
    if (m === "planner") {
      h += pt(`background:${C.navy};border:3px solid ${C.navy}`, `${tm("l_substations")} · ${tm("operational")}`) +
        pt(`border:3px dashed ${C.solved_planned};background:#fff`, tm("under_construction")) +
        pt(`border:3px dashed ${C.blue};background:#fff`, tm("planned")) +
        pt(`border:3px dashed ${C.no_solution};background:#fff`, `${tm("planned")}, ${tm("delayed")}`) +
        ln("planned", `${tm("l_cables")} · ${tm("planned")}`) + ln("planned_cable", tm("planned_cable")) + ln("underground", tm("underground"));
    } else {
      h += pt(`background:${C.blue};border:3px solid #fff;box-shadow:0 0 0 2px ${C.navy}`, tm("your_project")) +
        pt(`background:${C.navy};border:3px solid ${C.navy}`, tm("your_station")) +
        pt(`border:3px dashed ${C.solved_planned};background:#fff`, tm("under_construction")) +
        pt(`border:3px dashed ${C.blue};background:#fff`, tm("planned")) +
        `<div class="hint">${APP.state.selectedPlanId ? tm("relevance_note") : tm("pick_project")}</div>`;
    }
    if (detail === "real") h += `<b>${tm("cap_title")}</b>` + [0, 1, 2, 3].map((c) => `<div class="row"><span class="sw" style="background:${CODE_COLOR[c]};opacity:${m === "customer" ? 0.45 : 0.75}"></span>${tm("cap" + c)}</div>`).join("");
    h += `<div class="hint">${detail === "real" ? tm("source_ck") : detail === "grid" ? tm("detail_grid") : tm("zoom_hint")}</div>`;
    document.getElementById("legend").innerHTML = h;
  }

  // ---------------------------------------------------------------- render
  document.addEventListener("statechange", () => {
    if (!areaLayer || !substationsG) return;
    const s = APP.state, m = mode();
    if (m !== lastMode) { syncLayerControl(m); lastMode = m; }

    const detailOn = zoom() >= (realAreas?.features?.length ? Z_STATIONS : Z_DETAILS);
    areaLayer.eachLayer((l) => {
      const id = l.feature.properties.id, { key, st } = areaClass(id, s), subtle = m === "customer";
      l.setStyle({ fillColor: C[key], fillOpacity: detailOn ? 0.03 : subtle ? 0.22 : 0.5,
        color: subtle ? "#7a8bb0" : C.navy, weight: id === s.selectedAreaId ? 2.5 : subtle ? 0.6 : 1 });
      l.bindTooltip(`${l.feature.properties.name}: ${tm(key)} (${Math.round(st.ratio * 100)}%)`);
    });
    const detail = drawDetail(s, m);
    if (m === "planner") drawPlanner(s); else drawCustomer(s);
    lastPlan = s.selectedPlanId;
    drawLegend(m, detail);

    modeCtl?.getContainer().querySelectorAll("button").forEach((b) => {
      b.textContent = tm(`mode_${b.dataset.m}`);
      b.classList.toggle("active", b.dataset.m === m);
    });
    document.getElementById("title").textContent = tt("title");
    document.getElementById("demo-badge").textContent = tt("demo_badge");
    document.getElementById("year-label").textContent = tt("year");
    document.getElementById("year-value").textContent = s.year;
    document.getElementById("year").value = s.year;
    document.querySelector('[data-dir="afname"]').textContent = tt("offtake");
    document.querySelector('[data-dir="teruglevering"]').textContent = tt("feed_in");
    document.querySelectorAll("#direction button").forEach((b) => b.classList.toggle("active", b.dataset.dir === s.direction));
    document.querySelectorAll("#lang button").forEach((b) => b.classList.toggle("active", b.dataset.lang === s.lang));
    document.querySelectorAll("#tabs button").forEach((b) => {
      b.textContent = tt(`tab_${b.dataset.tab}`);
      b.classList.toggle("active", b.dataset.tab === s.tab);
    });
    document.querySelectorAll(".tab").forEach((el) => el.classList.toggle("active", el.id === `tab-${s.tab}`));
  });
})();
