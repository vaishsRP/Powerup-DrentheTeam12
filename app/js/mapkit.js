// Map building blocks shared by all pages (Leaflet). Each draw* function fills a LayerGroup.
const MAPKIT = (() => {
  // NetWijzer palette (see app.css): status scale capacity available → congested, brand ink/teal/leaf, violet for "under construction".
  // Keys navy/blue are kept for older callers and now hold the brand ink and teal.
  const COL = { room: "#5DB565", limited: "#F2C94C", bottleneck: "#E25A6B", investigate: "#F2994A", shortage: "#E25A6B",
    proceeds: "#5DB565", delayed: "#F2994A", not_possible: "#E25A6B", navy: "#022A2C", blue: "#0A5353", leaf: "#39A24A",
    grey: "#4F625D", brown: "#4F625D", build: "#8E5BD9", veil: "#F5F8F4", nodata: "#B9C2BC" };
  const CODE = [COL.room, COL.limited, COL.investigate, COL.shortage];
  const LINE = {
    operational: { color: COL.grey, weight: 2.5, dashArray: null }, overhead: { color: COL.grey, weight: 2.5, dashArray: null },
    underground: { color: COL.brown, weight: 3, dashArray: "2 5" }, under_construction: { color: COL.build, weight: 3, dashArray: "8 5" },
    planned: { color: COL.blue, weight: 3, dashArray: "10 7" }, planned_cable: { color: COL.blue, weight: 3, dashArray: "2 6" },
  };
  const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
  const L_ = () => STORE.state.lang;
  const noIcon = () => L.divIcon({ className: "", iconSize: [0, 0] });

  // Drenthe, so maps never wander off into empty space
  const DRENTHE = L.latLngBounds([[52.61, 6.12], [53.21, 7.10]]);
  // brand pin (the logo mark): teardrop in leaf green with a white bolt
  const BRAND_PIN = `<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 .8C5.8.8.8 5.6.8 11.6c0 7.9 9.6 17.7 10.4 18.5a1.1 1.1 0 0 0 1.6 0c.8-.8 10.4-10.6 10.4-18.5C23.2 5.6 18.2.8 12 .8z" fill="${COL.leaf}" stroke="#fff" stroke-width="1.4"/><path d="M13.9 4.6 7.3 13.5h4.4l-1.5 8 6.5-9.2h-4.5z" fill="#fff"/></svg>`;

  // grey veil outside Drenthe. Maps are fixed (see create()), so no zoom or pan limits are needed;
  // maxBounds would even fight the popup snap-back.
  function lock(map) {
    const ol = STORE.data.outline?.features?.[0]?.geometry;
    if (ol) {
      const rings = (ol.type === "Polygon" ? [ol.coordinates] : ol.coordinates).map((p) => p[0].map(([x, y]) => [y, x]));
      L.polygon([[[49, 1], [56, 1], [56, 11], [49, 11]], ...rings], { pane: "veil", stroke: false, fillColor: COL.veil, fillOpacity: 0.72, interactive: false }).addTo(map);
      L.polygon(rings, { pane: "veil", color: COL.navy, weight: 1.5, opacity: 0.55, fill: false, interactive: false }).addTo(map);
    }
  }

  // a page with a floating toolbar over the map passes popupTop, so popups open below it instead of behind it
  const adjustPan = L.Popup.prototype._adjustPan;
  L.Popup.prototype._adjustPan = function () {
    const top = this._map?.options.popupTop;
    if (top) this.options.autoPanPaddingTopLeft = [16, top];
    return adjustPan.apply(this, arguments);
  };

  function create(el, opts = {}) {
    // Fixed maps: no dragging or zooming by the user, only clicks. Each page sets its own view.
    const map = L.map(el, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
      keyboard: false,
      popupTop: opts.popupTop,
      zoomSnap: 0.25, // fixed views: fit each page's area snugly instead of jumping a whole zoom level
      // Avoid zoom-transition callbacks firing after a page has been replaced.
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(opts.center || [52.84, 6.6], opts.zoom || 9);
    L.tileLayer("https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png", {
      attribution: 'Kaart <a href="https://www.pdok.nl">PDOK</a> · CBS/PDOK · Capaciteitskaart Netbeheer Nederland · TenneT · Enexis IP2026 · © OpenStreetMap', maxZoom: 15,
    }).addTo(map);
    // A popup near the edge may pan the map to fit; put the view back when it closes.
    let home = null;
    map.on("moveend", () => { if (map._mapPane && map._containerId && !map._popup?.isOpen()) home = { c: map.getCenter(), z: map.getZoom() }; });
    map.on("popupclose", () => { if (home && map._mapPane && map._containerId) map.setView(home.c, home.z, { animate: false }); });
    map.createPane("areas").style.zIndex = 400;
    map.createPane("veil").style.zIndex = 410;
    map.createPane("lines").style.zIndex = 430;
    map.createPane("points").style.zIndex = 640;
    lock(map);
    return map;
  }

  // ---------- real capaciteitskaart areas ----------
  function realPopup(p) {
    const mw = (v) => (v == null ? "–" : `${(+v).toFixed(1)} MW`);
    const tn = (d) => `${t("cap" + (p[`tennet_code_${d}`] ?? 0))}${p[`tennet_solved_${d}`] ? `. ${t("tennet_solved")} ${p[`tennet_solved_${d}`]}` : ""}`;
    return `<h4>${p.name}</h4>${p.operator ? `<div class="pop-sub">${p.operator}</div>` : ""}<table>
      ${row(t("afname"), `${t("cap" + (p.code_afname ?? 0))}<br>${t("queue")} ${mw(p.queue_afname_mw)}, ${p.requests_afname ?? 0} ${t("requests")}`)}
      ${row(t("teruglevering"), `${t("cap" + (p.code_teruglevering ?? 0))}<br>${t("queue")} ${mw(p.queue_teruglevering_mw)}, ${p.requests_teruglevering ?? 0} ${t("requests")}`)}
      ${p.tennet_area ? row("TenneT", `${p.tennet_area}<br>${t("afname")}: ${tn("afname")}<br>${t("teruglevering")}: ${tn("teruglevering")}`) : ""}
      </table>`;
  }
  // the capaciteitskaart leaves small parts of Drenthe without a supply area: show them grey, not as empty white
  const drawGaps = (g, subtle) => STORE.data.gaps &&
    L.geoJSON(STORE.data.gaps, { pane: "areas", interactive: false, style: { stroke: false, fillColor: COL.nodata, fillOpacity: subtle ? 0.35 : 0.6 } }).addTo(g);
  function drawRealAreas(g, dir, opts = {}) {
    const fc = STORE.data.realAreas;
    if (!fc) return false;
    drawGaps(g, opts.subtle);
    L.geoJSON(fc, { pane: "areas", style: (f) => ({ weight: 0.8, color: "#fff", fillColor: CODE[ENGINE.ckCode(f.properties, dir)], fillOpacity: opts.subtle ? 0.32 : 0.62 }),
      onEachFeature: (f, l) => l.bindPopup(realPopup(f.properties)) }).addTo(g);
    return true;
  }

  // ---------- projection ----------
  // Drawn on the real capaciteitskaart shapes so it reads like the Today map. Each real supply area starts from its
  // real status today and moves up or down with the modelled change (growth, upgrades, decisions) of the station
  // area it lies in: projection 2026 = Today, later years show what changes.
  const LVL = { room: 0, limited: 1, bottleneck: 2 }, CODE_LVL = [0, 1, 2, 2], LVL_CODE = [0, 1, 3];
  let projOf = null; // real supply area -> station area, by majority of its outline points
  function projArea(f) {
    projOf ??= new Map();
    if (!projOf.has(f)) {
      const votes = {};
      const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0]);
      for (const r of rings) for (let i = 0; i < r.length; i += 3) { const id = ENGINE.areaAt(r[i][1], r[i][0]); if (id) votes[id] = (votes[id] || 0) + 1; }
      projOf.set(f, Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || null);
    }
    return projOf.get(f);
  }
  function projCode(sim, f, dir, year) {
    const today = ENGINE.ckCode(f.properties, dir), aid = projArea(f);
    if (!aid) return today;
    const d = LVL[ENGINE.areaStatus(sim, aid, dir, year).status] - LVL[ENGINE.areaStatus(sim, aid, dir, ENGINE.START).status];
    const lvl = Math.min(2, Math.max(0, CODE_LVL[today] + d));
    return lvl === CODE_LVL[today] ? today : LVL_CODE[lvl];
  }
  function drawProjAreas(g, sim, dir, year, opts = {}) {
    const fc = STORE.data.realAreas;
    if (!fc) return drawProjCells(g, sim, dir, year, opts);
    drawGaps(g, opts.subtle);
    L.geoJSON(fc, { pane: "areas", style: (f) => ({ weight: 0.8, color: "#fff", fillColor: CODE[projCode(sim, f, dir, year)], fillOpacity: opts.subtle ? 0.32 : 0.62 }),
      onEachFeature: (f, l) => {
        const aid = projArea(f);
        if (!aid) return;
        if (opts.onClick) l.on("click", () => opts.onClick(aid));
        else {
          const s = ENGINE.areaStatus(sim, aid, dir, year);
          l.bindPopup(`<h4>${f.properties.name}</h4><div class="pop-sub">${ENGINE.area(aid).name}</div><table>${row(`${t("view_proj")} ${year}`, t("cap" + projCode(sim, f, dir, year)))}${row(`${t("peak")} / ${t("capacity")}`, `${Math.round(s.load)} / ${Math.round(s.cap)} MW`)}</table>`);
        }
      } }).addTo(g);
    // the station area that a click selects (simulator)
    const sel = opts.selected && STORE.data.areas.features.find((f) => f.properties.id === opts.selected);
    if (sel) L.geoJSON(sel, { pane: "lines", interactive: false, style: { color: COL.navy, weight: 3, fill: false } }).addTo(g);
  }
  // fallback without the real shapes: the simplified station areas themselves
  function drawProjCells(g, sim, dir, year, opts = {}) {
    L.geoJSON(STORE.data.areas, { pane: "areas", style: (f) => {
        const s = ENGINE.areaStatus(sim, f.properties.id, dir, year);
        return { weight: f.properties.id === opts.selected ? 3 : 1, color: f.properties.id === opts.selected ? COL.navy : "#fff", fillColor: COL[s.status], fillOpacity: opts.subtle ? 0.3 : 0.6 };
      },
      onEachFeature: (f, l) => {
        const s = ENGINE.areaStatus(sim, f.properties.id, dir, year);
        // info on click, not on hover (hover boxes covered too much of the map); a page with its own click action skips it
        if (opts.onClick) l.on("click", () => opts.onClick(f.properties.id));
        else l.bindPopup(`<h4>${f.properties.name}</h4><table>${row("Status", t(s.status))}${row(`${t("peak")} / ${t("capacity")}`, `${Math.round(s.load)} / ${Math.round(s.cap)} MW`)}</table>`);
      } }).addTo(g);
  }

  // ---------- infrastructure ----------
  function drawStations(g, opts = {}) {
    for (const st of STORE.data.stations) {
      L.circleMarker([st.lat, st.lon], { pane: "points", radius: 6, weight: 2, color: "#fff", fillColor: COL.navy, fillOpacity: 1 })
        .bindPopup(`<h4>${st.name.replace(/^\d+ kV /, "")}</h4><div class="pop-sub">${st.voltages_kv.join("/")} kV, ${t("operational").toLowerCase()}</div>`).addTo(g);
    }
    if (!opts.detail) return; // the ~40 small TenneT station points only on request: too busy for the overview
    for (const f of STORE.data.realStations?.features || []) {
      const [lon, lat] = f.geometry.coordinates;
      L.circleMarker([lat, lon], { pane: "points", radius: 3, weight: 1, color: COL.grey, fillColor: "#fff", fillOpacity: 1 })
        .bindPopup(`<h4>${f.properties.name}</h4><div class="pop-sub">TenneT</div>`).addTo(g);
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
    for (const u of ENGINE.upgrades(dec)) {
      if (u.lat == null || (opts.only && !opts.only.includes(u.id))) continue;
      const st = ENGINE.upStatus(u, dec, year), risk = st !== "operational" && ENGINE.atRisk(u, dec);
      const color = st === "operational" ? COL.room : st === "under_construction" ? COL.build : risk ? COL.shortage : COL.blue;
      const y = ENGINE.upYear(u, dec), latest = y + Math.max(0, (u.year_latest ?? u.year_feasible) - u.year_feasible);
      const m = L.circleMarker([u.lat, u.lon], { pane: "points", radius: 11, weight: 3, color, dashArray: st === "operational" ? null : "4 3", fillColor: "#fff", fillOpacity: 0.7 })
        .bindPopup(upgradePopup(u, dec, year)).addTo(g);
      const yrs = latest > y ? `${y}–${latest}` : `${y}`;
      // labels: true (all), "risk" (only delayed/uncertain ones get a year label; the rest show it in the popup), false (none)
      if (opts.labels !== false && st !== "operational" && (opts.labels !== "risk" || risk))
        m.bindTooltip(yrs, { permanent: true, direction: "right", offset: [11, 0], className: `yr${risk ? " risk" : ""}` });
    }
  }
  const lineStatus = (l, year) => (l.year_feasible <= year ? (l.cable ? "underground" : "operational") : l.cable ? "planned_cable" : l.infra_status || "planned");
  function drawLines(g, year, opts = {}) {
    for (const f of STORE.data.realLines?.features || []) {
      if (opts.near) {
        const parts = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
        const near = parts.filter((p) => p.some(([x, y]) => Math.abs(y - opts.near[0]) < 0.055 && Math.abs(x - opts.near[1]) < 0.085));
        if (near.length) L.geoJSON({ type: "MultiLineString", coordinates: near }, { pane: "lines", style: { ...LINE[f.properties.kind === "cable" ? "underground" : "overhead"], opacity: 0.9 } })
          .bindPopup(`<h4>${t(f.properties.kind === "cable" ? "underground" : "overhead")}</h4><div class="pop-sub">TenneT</div>`).addTo(g);
        continue;
      }
      L.geoJSON(f, { pane: "lines", style: { ...LINE[f.properties.kind === "cable" ? "underground" : "overhead"], weight: 2, opacity: 0.75 } })
        .bindPopup(`<h4>${t(f.properties.kind === "cable" ? "underground" : "overhead")}</h4><div class="pop-sub">TenneT</div>`).addTo(g);
    }
    for (const l of STORE.data.lines) {
      if (opts.stationIds && !l.station_ids.some((id) => opts.stationIds.includes(id))) continue;
      const st = lineStatus(l, year);
      L.polyline(l.route.map((p) => [p.lat, p.lon]), { pane: "lines", ...LINE[st] })
        .bindPopup(`<h4>${l[`title_${L_()}`]}</h4><table>${row("Status", t(st))}${row(t("feasible"), `${l.year_feasible}–${l.year_latest}`)}${row("", l.source)}</table>`).addTo(g);
    }
  }

  // ---------- requests ----------
  function drawOrders(g, sim, opts = {}) {
    for (const o of ENGINE.orders().concat(sim.dec.batteries || [])) {
      if (opts.mineOnly && !o.mine) continue;
      if (opts.skip === o.id) continue;
      if ((STORE.state.applied.cancelled || []).includes(o.id)) continue; // withdrawn for good
      const r = sim.res[o.id], st = (sim.dec.cancelled || []).includes(o.id) ? null : r?.status;
      const m = L.circleMarker([o.lat, o.lon], { pane: "points", radius: o.mine ? 8 : 6, weight: 2, color: "#fff", fillColor: st ? COL[st] : "#999", fillOpacity: 1 }).addTo(g);
      if (opts.onClick) m.on("click", () => opts.onClick(o));
      else m.bindPopup(`<h4>${o[`title_${L_()}`]}</h4><div class="pop-sub">${ENGINE.oMW(o)} MW</div><table>${row("Status", st ? t(st) : "–")}${row(t("expected"), st ? ENGINE.estRange(r) : "–")}</table>`);
    }
  }
  function pin(g, lat, lon, html) {
    const m = L.marker([lat, lon], { pane: "points", zIndexOffset: 1000, icon: L.divIcon({ className: "pin", html: `<i></i>${BRAND_PIN}`, iconSize: [0, 0] }) }).addTo(g);
    if (html) m.bindTooltip(html, { permanent: true, direction: "top", offset: [0, -38], className: "lbl" });
    return m;
  }
  const label = (g, lat, lon, html, dir = "right", off = [12, 0]) =>
    L.marker([lat, lon], { interactive: false, icon: noIcon() }).bindTooltip(html, { permanent: true, direction: dir, offset: off, className: "lbl" }).addTo(g);

  // compact legend with a header button to fold it away; the open/closed choice is remembered per browser
  const LEGEND_KEY = "netwijzer-legend";
  function legend(map, html, pos = "bottomleft", opts = {}) {
    const c = L.control({ position: pos });
    c.onAdd = () => {
      // big maps start open, the small side maps start folded so they don't hide the project
      const key = LEGEND_KEY + (opts.wide ? "-wide" : "");
      let closed = !opts.wide;
      try { const v = localStorage.getItem(key); if (v) closed = v === "closed"; } catch (_) { /* ignore */ }
      const d = L.DomUtil.create("div", `map-legend${opts.wide ? " wide" : ""}${closed ? " closed" : ""}`);
      d.innerHTML = `<button type="button" class="lg-h" aria-expanded="${!closed}">${icon("layers", 14)}${t("legend")}${icon("chevron-down", 14).replace('class="ic"', 'class="ic chev"')}</button><div class="lg-b">${html}</div>`;
      d.querySelector(".lg-h").onclick = () => {
        const now = d.classList.toggle("closed");
        d.querySelector(".lg-h").setAttribute("aria-expanded", String(!now));
        try { localStorage.setItem(key, now ? "closed" : "open"); } catch (_) { /* ignore */ }
      };
      L.DomEvent.disableClickPropagation(d);
      L.DomEvent.disableScrollPropagation(d);
      return d;
    };
    c.addTo(map);
    return c;
  }
  const sw = (color, text, op = 0.75) => `<div><span class="sw" style="background:${color};opacity:${op}"></span>${text}</div>`;
  const legendReal = (subtle) => `<section><b>${t("view_today")}: ${t("view_today_hint")}</b>` + [0, 1, 2, 3].map((c) => sw(CODE[c], t("cap" + c), subtle ? 0.5 : 0.8)).join("") + sw(COL.nodata, t("no_data"), subtle ? 0.5 : 0.8) + `</section>`;
  // same categories as Today: the projection moves each real area along the capaciteitskaart scale
  const legendProj = () => `<section><b>${t("view_proj")}: ${t("view_proj_legend")}</b>` + [0, 1, 2, 3].map((c) => sw(CODE[c], t("cap" + c), 0.8)).join("") + sw(COL.nodata, t("no_data"), 0.8) + `</section>`;
  const legendInfra = () => `<section><b>${t("l_infra")}</b>` +
    `<div><span class="pt" style="background:${COL.navy}"></span>${t("operational")}</div>` +
    `<div><span class="pt" style="border:3px dashed ${COL.build}"></span>${t("under_construction")}</div>` +
    `<div><span class="pt" style="border:3px dashed ${COL.blue}"></span>${t("planned")}</div>` +
    `<div><span class="pt" style="border:3px dashed ${COL.shortage}"></span>${t("at_risk")}</div></section>` +
    `<section><b>${t("l_cables")}</b><div><span class="ln" style="border-color:${COL.grey}"></span>${t("overhead")}</div>` +
    `<div><span class="ln" style="border-color:${COL.brown};border-top-style:dotted"></span>${t("underground")}</div>` +
    `<div><span class="ln" style="border-color:${COL.blue};border-top-style:dashed"></span>${t("planned")}</div></section>`;

  return { COL, CODE, DRENTHE, BRAND_PIN, create, drawRealAreas, drawProjAreas, drawStations, drawUpgrades, drawLines, drawOrders, pin, label, legend, legendReal, legendProj, legendInfra, lineStatus, realPopup };
})();
