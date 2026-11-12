// Map building blocks shared by all pages (Leaflet). Each draw* function fills a LayerGroup.
const MAPKIT = (() => {
  const COL = { room: "#33A92F", limited: "#FAC850", bottleneck: "#FF6428", investigate: "#FF6428", shortage: "#C8102E",
    proceeds: "#33A92F", delayed: "#FF6428", not_possible: "#C8102E", navy: "#003584", blue: "#3C8CFA", grey: "#6b6b6b", brown: "#7a5230" };
  const CODE = [COL.room, COL.limited, COL.investigate, COL.shortage];
  const LINE = {
    operational: { color: COL.grey, weight: 2.5, dashArray: null }, overhead: { color: COL.grey, weight: 2.5, dashArray: null },
    underground: { color: COL.brown, weight: 3, dashArray: "2 5" }, under_construction: { color: COL.investigate, weight: 3, dashArray: "8 5" },
    planned: { color: COL.blue, weight: 3, dashArray: "10 7" }, planned_cable: { color: COL.blue, weight: 3, dashArray: "2 6" },
  };
  const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
  const L_ = () => STORE.state.lang;
  const noIcon = () => L.divIcon({ className: "", iconSize: [0, 0] });

  function create(el, opts = {}) {
    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: opts.scroll ?? true,
      // Avoid zoom-transition callbacks firing after a page has been replaced.
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(opts.center || [52.84, 6.6], opts.zoom || 9);
    L.tileLayer("https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png", {
      attribution: 'Kaart <a href="https://www.pdok.nl">PDOK</a> · CBS/PDOK · Capaciteitskaart Netbeheer Nederland · TenneT · Enexis IP2026 · © OpenStreetMap', maxZoom: 15,
    }).addTo(map);
    map.createPane("areas").style.zIndex = 400;
    map.createPane("lines").style.zIndex = 430;
    map.createPane("points").style.zIndex = 640;
    return map;
  }

  // ---------- real capaciteitskaart areas ----------
  function realPopup(p) {
    const mw = (v) => (v == null ? "–" : `${(+v).toFixed(1)} MW`);
    const tn = (d) => `${t("cap" + (p[`tennet_code_${d}`] ?? 0))}${p[`tennet_solved_${d}`] ? `, ${t("tennet_solved").toLowerCase()} ${p[`tennet_solved_${d}`]}` : ""}`;
    return `<h4>${p.name}</h4><table>
      ${row(t("afname"), `${t("cap" + (p.code_afname ?? 0))}<br>${t("queue")} ${mw(p.queue_afname_mw)}, ${p.requests_afname ?? 0} ${t("requests")}`)}
      ${row(t("teruglevering"), `${t("cap" + (p.code_teruglevering ?? 0))}<br>${t("queue")} ${mw(p.queue_teruglevering_mw)}, ${p.requests_teruglevering ?? 0} ${t("requests")}`)}
      ${p.tennet_area ? row("TenneT", `${p.tennet_area}<br>${t("afname")}: ${tn("afname")}<br>${t("teruglevering")}: ${tn("teruglevering")}`) : ""}
      ${p.operator ? row("", p.operator) : ""}</table>`;
  }
  function drawRealAreas(g, dir, opts = {}) {
    const fc = STORE.data.realAreas;
    if (!fc) return false;
    L.geoJSON(fc, { pane: "areas", style: (f) => ({ weight: 0.8, color: "#fff", fillColor: CODE[ENGINE.ckCode(f.properties, dir)], fillOpacity: opts.subtle ? 0.28 : 0.6 }),
      onEachFeature: (f, l) => { l.bindTooltip(`${f.properties.name}: ${t("cap" + ENGINE.ckCode(f.properties, dir))}`, { sticky: true }); l.bindPopup(realPopup(f.properties)); } }).addTo(g);
    return true;
  }

  // ---------- projected areas (register) ----------
  function drawProjAreas(g, sim, dir, year, opts = {}) {
    L.geoJSON(STORE.data.areas, { pane: "areas", style: (f) => {
        const s = ENGINE.areaStatus(sim, f.properties.id, dir, year);
        return { weight: f.properties.id === opts.selected ? 3 : 1, color: COL.navy, fillColor: COL[s.status], fillOpacity: opts.subtle ? 0.25 : 0.55 };
      },
      onEachFeature: (f, l) => {
        const s = ENGINE.areaStatus(sim, f.properties.id, dir, year);
        l.bindTooltip(`${f.properties.name}: ${t(s.status)}, ${Math.round(s.load)} / ${Math.round(s.cap)} MW`, { sticky: true });
        if (opts.onClick) l.on("click", () => opts.onClick(f.properties.id));
      } }).addTo(g);
  }

  // ---------- infrastructure ----------
  function drawStations(g) {
    for (const st of STORE.data.stations) {
      L.circleMarker([st.lat, st.lon], { pane: "points", radius: 6, weight: 2, color: "#fff", fillColor: COL.navy, fillOpacity: 1 })
        .bindTooltip(`${st.name.replace(/^\d+ kV /, "")}, ${st.voltages_kv.join("/")} kV, ${t("operational").toLowerCase()}`).addTo(g);
    }
    for (const f of STORE.data.realStations?.features || []) {
      const [lon, lat] = f.geometry.coordinates;
      L.circleMarker([lat, lon], { pane: "points", radius: 3, weight: 1, color: COL.grey, fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(`${f.properties.name}, TenneT`).addTo(g);
    }
  }
  function upgradePopup(u, dec, year) {
    const y = ENGINE.upYear(u, dec), latest = y + Math.max(0, (u.year_latest ?? u.year_feasible) - u.year_feasible), delay = y - u.year_desired;
    return `<h4>${u[`title_${L_()}`]}</h4><table>
      ${row("Status", t(ENGINE.upStatus(u, dec, year)))}
      ${row(t("desired"), u.year_desired)}${row(t("feasible"), latest > y ? `${y}–${latest}` : y)}
      ${delay > 0 ? row("", `<b style="color:${COL.shortage}">${t("delay_y", { n: delay })}</b>`) : ""}
      ${u[`space_${L_()}`] ? row("", u[`space_${L_()}`]) : ""}${u[`risk_${L_()}`] ? row("", u[`risk_${L_()}`]) : ""}</table>`;
  }
  function drawUpgrades(g, dec, year, opts = {}) {
    for (const u of STORE.data.upgrades) {
      if (u.lat == null || (opts.only && !opts.only.includes(u.id))) continue;
      const st = ENGINE.upStatus(u, dec, year), risk = st !== "operational" && ENGINE.atRisk(u, dec);
      const color = st === "operational" ? COL.room : st === "under_construction" ? COL.investigate : risk ? COL.shortage : COL.blue;
      const y = ENGINE.upYear(u, dec), latest = y + Math.max(0, (u.year_latest ?? u.year_feasible) - u.year_feasible);
      const m = L.circleMarker([u.lat, u.lon], { pane: "points", radius: 11, weight: 3, color, dashArray: st === "operational" ? null : "4 3", fillColor: "#fff", fillOpacity: 0.7 })
        .bindPopup(upgradePopup(u, dec, year)).addTo(g);
      if (opts.labels !== false && st !== "operational")
        m.bindTooltip(latest > y ? `${y}–${latest}` : `${y}`, { permanent: true, direction: "right", offset: [11, 0], className: `yr${risk ? " risk" : ""}` });
    }
  }
  const lineStatus = (l, year) => (l.year_feasible <= year ? (l.cable ? "underground" : "operational") : l.cable ? "planned_cable" : l.infra_status || "planned");
  function drawLines(g, year, opts = {}) {
    for (const f of STORE.data.realLines?.features || []) {
      if (opts.near) {
        const parts = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
        const near = parts.filter((p) => p.some(([x, y]) => Math.abs(y - opts.near[0]) < 0.055 && Math.abs(x - opts.near[1]) < 0.085));
        if (near.length) L.geoJSON({ type: "MultiLineString", coordinates: near }, { pane: "lines", style: { ...LINE[f.properties.kind === "cable" ? "underground" : "overhead"], opacity: 0.9 } })
          .bindTooltip(`${t(f.properties.kind === "cable" ? "underground" : "overhead")}, TenneT`).addTo(g);
        continue;
      }
      L.geoJSON(f, { pane: "lines", style: { ...LINE[f.properties.kind === "cable" ? "underground" : "overhead"], weight: 2, opacity: 0.75 } })
        .bindTooltip(`${t(f.properties.kind === "cable" ? "underground" : "overhead")}, TenneT`, { sticky: true }).addTo(g);
    }
    for (const l of STORE.data.lines) {
      if (opts.stationIds && !l.station_ids.some((id) => opts.stationIds.includes(id))) continue;
      const st = lineStatus(l, year);
      L.polyline(l.route.map((p) => [p.lat, p.lon]), { pane: "lines", ...LINE[st] })
        .bindPopup(`<h4>${l[`title_${L_()}`]}</h4><table>${row("Status", t(st))}${row(t("feasible"), `${l.year_feasible}–${l.year_latest}`)}${row("", l.source)}</table>`)
        .bindTooltip(`${l[`title_${L_()}`]}: ${t(st).toLowerCase()}`, { sticky: true }).addTo(g);
    }
  }

  // ---------- requests ----------
  function drawOrders(g, sim, opts = {}) {
    for (const o of ENGINE.orders().concat(sim.dec.batteries || [])) {
      if (opts.mineOnly && !o.mine) continue;
      if (opts.skip === o.id) continue;
      const r = sim.res[o.id], st = (sim.dec.cancelled || []).includes(o.id) ? null : r?.status;
      L.circleMarker([o.lat, o.lon], { pane: "points", radius: o.mine ? 8 : 6, weight: 2, color: "#fff", fillColor: st ? COL[st] : "#999", fillOpacity: 1 })
        .bindTooltip(`${o[`title_${L_()}`]}, ${ENGINE.oMW(o)} MW: ${st ? `${t(st)} ${ENGINE.estRange(r)}` : "–"}`)
        .on("click", () => opts.onClick && opts.onClick(o)).addTo(g);
    }
  }
  function pin(g, lat, lon, html) {
    const m = L.marker([lat, lon], { pane: "points", zIndexOffset: 1000, icon: L.divIcon({ className: "pin", html: "<i></i><span></span>", iconSize: [0, 0] }) }).addTo(g);
    if (html) m.bindTooltip(html, { permanent: true, direction: "top", offset: [0, -16], className: "lbl" });
    return m;
  }
  const label = (g, lat, lon, html, dir = "right", off = [12, 0]) =>
    L.marker([lat, lon], { interactive: false, icon: noIcon() }).bindTooltip(html, { permanent: true, direction: dir, offset: off, className: "lbl" }).addTo(g);

  function legend(map, html, pos = "bottomleft") {
    const c = L.control({ position: pos });
    c.onAdd = () => { const d = L.DomUtil.create("div", "map-legend"); d.innerHTML = html; L.DomEvent.disableClickPropagation(d); return d; };
    c.addTo(map);
    return c;
  }
  const sw = (color, text, op = 0.75) => `<div><span class="sw" style="background:${color};opacity:${op}"></span>${text}</div>`;
  const legendReal = (subtle) => `<b>${t("view_today")}: ${t("view_today_hint")}</b>` + [0, 1, 2, 3].map((c) => sw(CODE[c], t("cap" + c), subtle ? 0.45 : 0.75)).join("");
  const legendProj = () => `<b>${t("view_proj")}</b>` + ["room", "limited", "bottleneck"].map((k) => sw(COL[k], t(k))).join("");
  const legendInfra = () => `<b>${t("l_infra")}</b>` +
    `<div><span class="pt" style="background:${COL.navy}"></span>${t("operational")}</div>` +
    `<div><span class="pt" style="border:3px dashed ${COL.investigate}"></span>${t("under_construction")}</div>` +
    `<div><span class="pt" style="border:3px dashed ${COL.blue}"></span>${t("planned")}</div>` +
    `<b>${t("l_cables")}</b><div><span class="ln" style="border-color:${COL.grey}"></span>${t("overhead")}</div>` +
    `<div><span class="ln" style="border-color:${COL.brown};border-top-style:dotted"></span>${t("underground")}</div>` +
    `<div><span class="ln" style="border-color:${COL.blue};border-top-style:dashed"></span>${t("planned")}</div>`;

  return { COL, CODE, create, drawRealAreas, drawProjAreas, drawStations, drawUpgrades, drawLines, drawOrders, pin, label, legend, legendReal, legendProj, legendInfra, lineStatus, realPopup };
})();
