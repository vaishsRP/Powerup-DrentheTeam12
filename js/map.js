// Map: congestion per area + grid infrastructure (existing / planned / at risk / nothing planned),
// plus header controls, tabs and legend. Owner: map (Data & logic).
// Reads ENGINE.* and APP.state; changes things only via APP.setState(). Styles are injected below so no other file is touched.
// Optional real layers, used automatically when present (scripts/fetch_grid_infrastructure.py):
//   data/real/tennet-lines.geojson, data/real/osm-construction.geojson

(() => {
  // ---------- text (NL default; Dutch strings marked NL? need proofreading → move to i18n.js later) ----------
  const TXT = {
    nl: {
      congestion: "Netcongestie", infrastructure: "Infrastructuur",
      room: "Ruimte", limited: "Beperkt", solved_planned: "Knelpunt, oplossing gepland", no_solution: "Knelpunt, geen oplossing gepland", // NL?
      existing_ok: "Station, beschikbaar", existing_full: "Station, vol", planned: "Gepland (jaartal)", at_risk: "Gepland, vertraagd of onzeker", // NL?
      in_service: "In gebruik vanaf", line: "Hoogspanningsverbinding", // NL?
      area: "Gebied", load: "Piekbelasting", capacity: "Capaciteit", status: "Status",
      upgrade: "Netuitbreiding", phase: "Fase", commissioned: "In opdracht", study: "In studie", // NL?
      desired: "Gewenst", feasible: "Haalbaar", likely_range: "Verwachte oplevering", delay: "Vertraging", years: "jaar", // NL?
      space: "Ruimte / vergunning", risk: "Risico", added: "Extra capaciteit", approx: "Locatie bij benadering", // NL?
      no_upgrade: "Geen netuitbreiding gepland", plans: "Projecten", demo: "MW: demo · fictieve gegevens", // NL?
      sources: "Jaartallen: Enexis IP2026 / TenneT IP2026",
      zoom_hint: "Zoom in voor stations, projecten en MW per gebied", connect: "aansluiting", on_time: "op tijd", // NL?
      cable: "Hoogspanningskabel", cable_id: "Kabel-ID", installed_underground: "Ondergronds geïnstalleerd", // NL?
      operational: "Operationeel", year: "Jaar", tbc_grid_operator: "Te bevestigen door de netbeheerder.", // NL?
    },
    en: {
      congestion: "Grid congestion", infrastructure: "Infrastructure",
      room: "Room", limited: "Limited", solved_planned: "Bottleneck, solution planned", no_solution: "Bottleneck, no solution planned",
      existing_ok: "Station, available", existing_full: "Station, full", planned: "Planned (year)", at_risk: "Planned, delayed or uncertain",
      in_service: "In service from", line: "High-voltage line",
      area: "Area", load: "Peak load", capacity: "Capacity", status: "Status",
      upgrade: "Grid upgrade", phase: "Phase", commissioned: "Commissioned", study: "In study",
      desired: "Desired", feasible: "Feasible", likely_range: "Expected delivery", delay: "Delay", years: "yr",
      space: "Space / permit", risk: "Risk", added: "Added capacity", approx: "Approximate location",
      no_upgrade: "No grid upgrade planned", plans: "Projects", demo: "MW: demo · illustrative data",
      sources: "Years: Enexis IP2026 / TenneT IP2026",
      zoom_hint: "Zoom in for stations, projects and MW per area", connect: "connection", on_time: "on time",
      cable: "High-voltage cable", cable_id: "Cable ID", installed_underground: "Installed underground",
      operational: "Operational", year: "Year", tbc_grid_operator: "To be confirmed by the grid operator.",
    },
  };
  const tm = (k) => TXT[APP.state.lang]?.[k] ?? TXT.nl[k] ?? k;
  const tt = (k) => (typeof t === "function" ? t(k) : k); // shared i18n for keys that already exist there

  // ---------- colours (TenneT palette) ----------
  const C = { room: "#33A92F", limited: "#FAC850", solved_planned: "#FF6428", no_solution: "#C8102E",
              navy: "#003584", blue: "#3C8CFA", grey: "#8A8A8A" };

  document.head.insertAdjacentHTML("beforeend", `<style>
    .mk-label { background: #fff; border: 1px solid ${C.blue}; color: ${C.navy}; font: 11px Arial, sans-serif; padding: 0 4px; border-radius: 3px; box-shadow: none; }
    .mk-label.risk { border-color: ${C.no_solution}; color: ${C.no_solution}; }
    .mk-label::before { display: none; }
    .leaflet-popup-content { font: 13px Arial, sans-serif; min-width: 220px; }
    .leaflet-popup-content h4 { margin: 0 0 6px; color: ${C.navy}; font-size: 14px; }
    .leaflet-popup-content table { border-collapse: collapse; width: 100%; }
    .leaflet-popup-content td { padding: 2px 0; vertical-align: top; }
    .leaflet-popup-content td:first-child { color: #666; padding-right: 10px; white-space: nowrap; }
    .leaflet-popup-content .note { color: #888; font-size: 11px; margin-top: 6px; }
    #legend b { display: block; margin: 4px 0 2px; color: ${C.navy}; }
    #legend .row { display: flex; align-items: center; gap: 6px; margin: 2px 0; white-space: nowrap; }
    #legend .sw { width: 14px; height: 12px; border-radius: 2px; display: inline-block; flex: none; }
    .area-label { background: rgba(255,255,255,.85); border: 0; box-shadow: none; color: ${C.navy}; font: 11px Arial, sans-serif; padding: 1px 4px; text-align: center; }
    .area-label::before, .st-label::before, .pl-label::before { display: none; }
    .st-label { background: transparent; border: 0; box-shadow: none; color: ${C.navy}; font: bold 11px Arial, sans-serif; text-shadow: 0 0 3px #fff, 0 0 3px #fff; padding: 0; }
    .pl-label { background: #fff; border: 1px solid ${C.navy}; color: ${C.navy}; font: 11px Arial, sans-serif; padding: 1px 4px; box-shadow: none; }
    #legend .hint { color: #666; font-size: 11px; margin-top: 6px; max-width: 220px; white-space: normal; }
    #legend .pt { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex: none; box-sizing: border-box; }
  </style>`);

  let map, areaLayer, stationLayer, upgradeLayer, lineLayer, planLayer, areaLabelLayer, highlightLayer;
  let lastSelectedPlanId = null;
  let cablesDrawn = false;
  const clean = (value) => String(value ?? "").replace(/🔎/g, "").trim();
  // Zoom-dependent detail: overview (province) → stations (region) → details (area)
  const Z_STATIONS = 10; // station names, upgrade year labels, customer projects
  const Z_DETAILS = 11;  // MW per area, project names + connection estimate
  const zoom = () => (map ? map.getZoom() : 9);
  let stations = [];
  const fmt = (v) => Math.round(v);

  // area colour: 4 states, separating "solved by a planned upgrade" from "nothing planned"
  function areaClass(id, s) {
    const st = ENGINE.areaStatus(id, s);
    if (st.status !== "bottleneck") return { key: st.status, st };
    const future = ENGINE.upgradesIn(id).some((u) => ENGINE.upgradeYear(u, s) > s.year);
    return { key: future ? "solved_planned" : "no_solution", st };
  }

  // upgrade state: in service / planned / at risk (delayed ≥ 2 yrs, or still in study)
  function upgradeState(u, s) {
    const y = ENGINE.upgradeYear(u, s);
    if (y <= s.year) return "in_service";
    const delay = y - u.year_desired;
    return delay >= 2 || u.phase === "study" ? "at_risk" : "planned";
  }

  const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;

  function areaPopup(id, s) {
    const a = ENGINE.area(id), { key, st } = areaClass(id, s);
    const ups = ENGINE.upgradesIn(id).map((u) => `${u[`title_${s.lang}`]} (${ENGINE.upgradeYear(u, s)})`).join("<br>");
    return `<h4>${a.name} · ${s.year}</h4><table>
      ${row(tm("status"), `<b style="color:${C[key]}">${tm(key)}</b>`)}
      ${row(tm("load"), `${fmt(st.load)} MW`)}${row(tm("capacity"), `${fmt(st.capacity)} MW`)}
      ${row(tm("upgrade"), ups || tm("no_upgrade"))}</table><div class="note">${tm("demo")}</div>`;
  }

  function upgradePopup(u, s) {
    const y = ENGINE.upgradeYear(u, s), latest = Math.max(u.year_latest ?? y, y), delay = y - u.year_desired;
    return `<h4>${u[`title_${s.lang}`]}</h4><table>
      ${row(tm("phase"), tm(u.phase))}
      ${row(tm("desired"), u.year_desired)}${row(tm("feasible"), y)}
      ${row(tm("likely_range"), y === latest ? y : `${y}–${latest}`)}
      ${delay > 0 ? row(tm("delay"), `<b style="color:${delay >= 2 ? C.no_solution : C.solved_planned}">+${delay} ${tm("years")}</b>`) : ""}
      ${row(tm("space"), clean(u[`space_${s.lang}`]) || "–")}
      ${u[`risk_${s.lang}`] ? row(tm("risk"), clean(u[`risk_${s.lang}`])) : ""}
      ${row(tm("added"), `${u.mw_added_offtake} MW`)}</table>
      <div class="note">${tm("sources")}${u.years_verified ? " ✓" : " 🔎"}${u.location_approx ? ` · ${tm("approx")}` : ""} · ${tm("demo")}</div>`;
  }

  function stationPopup(st, s) {
    const id = st._area;
    return `<h4>${st.name.replace(/^\d+ kV /, "")}</h4><table>
      ${row("kV", st.voltages_kv.join(" / "))}
      ${row(tm("status"), tm("operational"))}
      ${id ? row(tm("area"), ENGINE.area(id).name) : ""}</table>${id ? areaPopup(id, s).replace(/<h4>.*?<\/h4>/, "") : ""}`;
  }

  function cablePopup(feature) {
    const p = feature.properties || {};
    const year = p.AANLEGJAAR ? new Date(p.AANLEGJAAR).getFullYear() : "—";
    const status = p.STATUS === "In service" ? tm("operational") : (p.STATUS || "—");
    return `<h4>${tm("cable")}</h4><table>
      ${row(tm("status"), `${tm("installed_underground")} · ${status}`)}
      ${row("kV", p.SPANNINGSNIVEAU || "—")}
      ${row(tm("cable_id"), p.NETSCHAKELID || "—")}
      ${row(tm("year"), year)}
    </table><div class="note">${tm("tbc_grid_operator")}</div>`;
  }

  const slug = (name) => name.replace(/^\d+ kV /, "").toLowerCase().replace(/ /g, "-");

  document.addEventListener("dataready", () => {
    map = L.map("map", { zoomControl: true }).setView([52.85, 6.6], 9);
    L.tileLayer("https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png", {
      attribution: 'Kaart: <a href="https://www.pdok.nl">PDOK</a> (BRT Achtergrondkaart) · Grenzen: CBS/PDOK · Stations: © OpenStreetMap contributors · Netdata: TenneT, Enexis',
      maxZoom: 14,
    }).addTo(map);
    map.createPane("lines").style.zIndex = 420;
    map.createPane("points").style.zIndex = 640;

    // congestion areas
    areaLayer = L.geoJSON(APP.data.areas, {
      style: () => ({ weight: 1, color: C.navy, fillOpacity: 0.28 }),
      onEachFeature: (f, l) => l.on("click", (e) => {
        APP.setState({ selectedAreaId: f.properties.id, selectedPlanId: null });
        L.popup().setLatLng(e.latlng).setContent(areaPopup(f.properties.id, APP.state)).openOn(map);
      }),
    }).addTo(map);
    map.fitBounds(areaLayer.getBounds(), { padding: [20, 20] });

    // Cables and stations are loaded once by state.js; the map only renders the layers.
    lineLayer = L.layerGroup().addTo(map);
    stations = (APP.data.stations || [])
      .map((st) => ({ ...st, _area: ENGINE.area(slug(st.name)) ? slug(st.name) : null }));
    stationLayer = L.layerGroup().addTo(map);
    upgradeLayer = L.layerGroup().addTo(map);

    // customer projects + area MW labels (drawn per state/zoom in drawInfrastructure)
    planLayer = L.layerGroup().addTo(map);
    areaLabelLayer = L.layerGroup().addTo(map);
    highlightLayer = L.layerGroup().addTo(map);
    map.on("zoomend", () => APP.setState({})); // redraw labels for the new zoom level

    // header controls
    document.getElementById("year").addEventListener("input", (e) => APP.setState({ year: +e.target.value }));
    document.querySelectorAll("#direction button").forEach((b) => b.addEventListener("click", () => APP.setState({ direction: b.dataset.dir })));
    document.querySelectorAll("#lang button").forEach((b) => b.addEventListener("click", () => APP.setState({ lang: b.dataset.lang })));
    document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => APP.setState({ tab: b.dataset.tab })));
    APP.setState({});
  });

  function drawInfrastructure(s) {
    stationLayer.clearLayers();
    upgradeLayer.clearLayers();
    planLayer.clearLayers();
    areaLabelLayer.clearLayers();
    highlightLayer.clearLayers();
    const z = zoom();
    const layers = s.layers || {};

    if (layers.substations !== false) for (const st of stations) {
      const full = st._area && ENGINE.areaStatus(st._area, s).status === "bottleneck";
      const mk = L.circleMarker([st.lat, st.lon], { pane: "points", radius: z >= Z_STATIONS ? 8 : 5, weight: 3,
        color: full ? C.solved_planned : C.navy, fillColor: C.navy, fillOpacity: 1 });
      if (z >= Z_STATIONS) mk.bindTooltip(st.name.replace(/^\d+ kV /, ""), { permanent: true, direction: "left", offset: [-8, 0], className: "st-label" });
      else mk.bindTooltip(st.name);
      mk.on("click", (e) => {
          if (st._area) APP.setState({ selectedAreaId: st._area, selectedPlanId: null });
          L.popup().setLatLng(e.latlng).setContent(stationPopup(st, APP.state)).openOn(map);
        })
        .addTo(stationLayer);
    }

    if (layers.upgrades !== false) for (const u of APP.data.upgrades) {
      if (u.lat == null) continue;
      const state = upgradeState(u, s), y = ENGINE.upgradeYear(u, s);
      const latest = Math.max(u.year_latest ?? y, y);
      const style = state === "in_service"
        ? { radius: 10, color: C.room, weight: 3, fillOpacity: 0, dashArray: null }
        : { radius: 11, color: state === "at_risk" ? C.no_solution : C.blue, weight: 3, fillColor: "#fff", fillOpacity: 0.6, dashArray: "4 3" };
      const m = L.circleMarker([u.lat, u.lon], { pane: "points", ...style })
        .on("click", (e) => {
          APP.setState({ selectedAreaId: u.area_id, selectedPlanId: null, tab: "load" });
          L.popup().setLatLng(e.latlng).setContent(upgradePopup(u, APP.state)).openOn(map);
        })
        .addTo(upgradeLayer);
      if (state !== "in_service" && z < Z_STATIONS) m.bindTooltip(`${u[`title_${s.lang}`]}: ${y === latest ? y : `${y}–${latest}`}`);
      if (state !== "in_service" && z >= Z_STATIONS) {
        m.bindTooltip(y === latest ? `${y}` : `${y}–${latest}`, {
          permanent: true, direction: "right", offset: [10, 0], className: `mk-label${state === "at_risk" ? " risk" : ""}` });
      }
    }

    // underground high-voltage cables (real TenneT asset data). Redraw only when toggled on.
    if (layers.cables === false) {
      if (cablesDrawn) {
        lineLayer.clearLayers();
        cablesDrawn = false;
      }
    } else if (!cablesDrawn && APP.data.cables?.features?.length) {
      L.geoJSON(APP.data.cables, {
        pane: "lines",
        style: { color: "#1f6f8b", weight: 1.5, opacity: 0.72 },
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(tm("cable"));
          layer.on("click", (event) => {
            L.popup().setLatLng(event.latlng).setContent(cablePopup(feature)).openOn(map);
          });
        },
      }).addTo(lineLayer);
      cablesDrawn = true;
    }

    // customer projects: hidden at province level, dots at region level, name + estimate at area level
    if (layers.plans !== false && z >= Z_STATIONS) {
      for (const p of APP.data.plans) {
        const e = ENGINE.connectionEstimate(p.id, s);
        const est = e.earliest === null ? tm("no_upgrade") : e.onTime ? `${tm("on_time")} ${e.earliest}` : (e.earliest === e.latest ? `${e.earliest}` : `${e.earliest}–${e.latest}`);
        const dot = L.circleMarker([p.lat, p.lon], { pane: "points", radius: 6, weight: 2, color: C.navy,
          fillColor: p.id === s.selectedPlanId ? C.blue : "#fff", fillOpacity: 1 })
          .on("click", () => APP.setState({ selectedAreaId: p.area_id, selectedPlanId: p.id, tab: "location" }))
          .addTo(planLayer);
        const label = `${p[`title_${s.lang}`]} · ${p.mw_offtake || p.mw_feed_in} MW · ${tm("connect")} ${est}`;
        if (z >= Z_DETAILS) dot.bindTooltip(label, { permanent: true, direction: "right", offset: [8, 0], className: "pl-label" });
        else dot.bindTooltip(label);
      }
    }

    // area MW labels at the detail level
    if (z >= Z_DETAILS) {
      areaLayer.eachLayer((l) => {
        const id = l.feature.properties.id, st = ENGINE.areaStatus(id, s);
        L.marker(l.getBounds().getCenter(), { opacity: 0, interactive: false, keyboard: false, icon: L.divIcon({ className: "", iconSize: [0, 0] }) })
          .bindTooltip(`<b>${l.feature.properties.name}</b><br>${fmt(st.load)} / ${fmt(st.capacity)} MW (${Math.round(st.ratio * 100)}%)`,
            { permanent: true, direction: "center", className: "area-label" })
          .addTo(areaLabelLayer);
      });
    }

    // selected project: always show a halo, even at province level
    const selectedPlan = s.selectedPlanId ? APP.data.plans.find((p) => p.id === s.selectedPlanId) : null;
    if (selectedPlan) {
      L.circleMarker([selectedPlan.lat, selectedPlan.lon], {
        pane: "points", radius: 18, color: C.blue, weight: 2, fillColor: C.blue,
        fillOpacity: 0.12, dashArray: "2 4",
      }).addTo(highlightLayer);
      const marker = L.circleMarker([selectedPlan.lat, selectedPlan.lon], {
        pane: "points", radius: 7, color: C.navy, weight: 3, fillColor: C.blue, fillOpacity: 1,
      }).addTo(highlightLayer);
      if (z >= Z_STATIONS) {
        marker.bindTooltip(
          `${selectedPlan[`title_${s.lang}`]} · ${selectedPlan.mw_offtake || selectedPlan.mw_feed_in} MW`,
          { permanent: true, direction: "top", offset: [0, -10], className: "pl-label" }
        );
      }
      if (lastSelectedPlanId !== selectedPlan.id) {
        map.panTo([selectedPlan.lat, selectedPlan.lon]);
        lastSelectedPlanId = selectedPlan.id;
      }
    } else {
      lastSelectedPlanId = null;
    }
  }

  function drawLegend() {
    const sw = (k) => `<div class="row"><span class="sw" style="background:${C[k]};opacity:.75"></span>${tm(k)}</div>`;
    const pt = (style, label) => `<div class="row"><span class="pt" style="${style}"></span>${label}</div>`;
    document.getElementById("legend").innerHTML =
      `<b>${tm("congestion")}</b>${["room", "limited", "solved_planned", "no_solution"].map(sw).join("")}` +
      `<b>${tm("infrastructure")}</b>` +
      pt(`background:${C.navy};border:3px solid ${C.navy}`, tm("existing_ok")) +
      pt(`background:${C.navy};border:3px solid ${C.solved_planned}`, tm("existing_full")) +
      pt(`border:3px dashed ${C.blue};background:#fff`, tm("planned")) +
      pt(`border:3px dashed ${C.no_solution};background:#fff`, tm("at_risk")) +
      pt(`border:3px solid ${C.room}`, tm("in_service")) +
      (APP.state.layers?.cables !== false ? pt(`border:2px solid #1f6f8b`, tm("cable")) : "") +
      (zoom() < Z_DETAILS ? `<div class="hint">${tm("zoom_hint")}</div>` : "");
  }

  document.addEventListener("statechange", () => {
    if (!areaLayer || !stationLayer) return;
    const s = APP.state;

    areaLayer.eachLayer((l) => {
      const id = l.feature.properties.id, { key, st } = areaClass(id, s);
      l.setStyle({ fillColor: C[key], fillOpacity: id === s.selectedAreaId ? 0.42 : 0.28, weight: id === s.selectedAreaId ? 3 : 1 });
      l.bindTooltip(`${l.feature.properties.name}: ${tm(key)} (${Math.round(st.ratio * 100)}%)`);
    });
    drawInfrastructure(s);
    drawLegend();

    // header text + active states
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
