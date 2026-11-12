// Pages of the v2 app. Each page: { html() → string, mount(root) → optional cleanup }.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lang = () => STORE.state.lang;
const title = (o) => o?.[`title_${lang()}`] ?? "";
const STATUS_CLASS = { room: "s-room", limited: "s-limited", bottleneck: "s-shortage", proceeds: "s-room", delayed: "s-investigate", not_possible: "s-shortage" };
const CODE_CLASS = ["s-room", "s-limited", "s-investigate", "s-shortage"];
const TYPE_ICON = { solar: "sun", battery: "battery-charging", defence: "shield", hospital: "hospital", school: "school", housing: "building-2",
  business_park: "factory", industry: "factory", charging: "car-front", hydrogen: "zap", heat: "flame" };
const pill = (cls, text) => `<span class="pill ${cls}">${text}</span>`;
// a new request shows no date until an expert of the grid operator has confirmed the estimate
const pending = (o) => o?.review === "pending";
// a customer can ask to withdraw a request; the planner confirms it, and only then does it leave the queue
const withdrawn = (o) => (STORE.state.applied.cancelled || []).includes(o?.id);
const askedWithdraw = (o) => !withdrawn(o) && (STORE.state.cancelReqs || []).includes(o?.id);
const estText = (o, r) => (withdrawn(o) ? t("cancelled") : pending(o) ? t("in_review") : ENGINE.estRange(r));
// the grid operator at the project's location (capaciteitskaart), and who acts next on a customer's project
const operatorFor = (o) => (ENGINE.realAreaAt(o.lat, o.lon)?.properties.operator || "").split(",")[0].trim() || t("netbeheerder");
const nextOwner = (o) => {
  const op = operatorFor(o);
  if (withdrawn(o)) return { who: t("who_op", { op }), text: t("next_withdrawn") };
  if (askedWithdraw(o)) return { who: t("who_op", { op }), text: t("next_withdraw_req") };
  if (pending(o)) return { who: t("who_op", { op }), text: t("next_review") };
  if (o.maturity === "permit") return { who: t("who_op_you", { op }), text: t("next_permit") };
  if (o.maturity === "contracted") return { who: t("who_op", { op }), text: t("next_contracted") };
  return { who: t("who_you"), text: t("next_" + o.maturity) };
};
const estPill = (o, r) => withdrawn(o) ? pill("s-neutral", t("cancelled")) : askedWithdraw(o) ? pill("s-investigate", t("cancel_pending")) : (pending(o) ? pill("s-neutral", t("in_review")) : pill(STATUS_CLASS[r?.status] || "s-neutral", t(r?.status || "proceeds")));
const stationFor = (areaId) => STORE.data.stations.find((s) => s.name.replace(/^\d+ kV /, "").toLowerCase().replace(/ /g, "-") === areaId);
function meter(ratio) { // the dot meter: 10 dots, filled share = use of capacity, red dots = over capacity
  const n = Math.round(Math.min(ratio, 1.5) * 10);
  return `<span class="meter" title="${Math.round(ratio * 100)}%">${Array.from({ length: Math.max(10, n) }, (_, i) => `<i class="${i < Math.min(n, 10) ? "f" : ""}${i >= 10 ? " o" : ""}"></i>`).join("")}</span>`;
}

// =====================================================================================  START
const StartPage = {
  html() {
    const st = ENGINE.realStats();
    return `<div class="page">
      <section class="hero">
        <div>
          <h1>${t("hero_title")}</h1>
          <p class="lead">${t("hero_lead")}</p>
          <div class="dotmap-stats">
            <div><b>${st.withQueue}</b><span>${t("st_areas_queue", { n: st.areas })}</span></div>
            <div><b>${Math.round(st.mw).toLocaleString(lang() === "nl" ? "nl-NL" : "en-GB")}</b><span>${t("st_queue_mw")}</span></div>
            ${st.solvedFeedIn ? `<div><b>${st.solvedFeedIn}</b><span>${t("st_solved")}</span></div>` : ""}
          </div>
        </div>
        <div class="dotmap-wrap">
          <svg class="dotmap" id="dotmap" role="img" aria-label="${t("dot_caption_" + STORE.state.dir)}"></svg>
          <div class="dotmap-caption">
            <span class="seg" id="dot-dir"><button data-d="afname">${t("afname")}</button><button data-d="teruglevering">${t("teruglevering")}</button></span>
            <span class="small muted">${[0, 1, 2, 3].map((c) => `<span class="pill ${CODE_CLASS[c]}" style="margin-left:4px">${t("cap" + c)}</span>`).join("")}</span>
          </div>
          <p class="small muted" style="margin-top:8px">${t("dot_source")}</p>
        </div>
      </section>
      <section class="roles">
        <a class="role-card" href="#/klant">
          <h2>${icon("folder-kanban", 22)} ${t("rc_title")}</h2>
          <ul><li>${t("rc_1")}</li><li>${t("rc_2")}</li><li>${t("rc_3")}</li></ul>
          <span class="go">${t("rc_go")} ${icon("chevron-right", 16)}</span>
        </a>
        <a class="role-card" href="#/planner">
          <h2>${icon("layout-dashboard", 22)} ${t("rp_title")}</h2>
          <p class="muted" style="margin-top:4px">${t("rp_sub")}</p>
          <ul><li>${t("rp_1")}</li><li>${t("rp_2")}</li><li>${t("rp_3")}</li></ul>
          <span class="go">${t("rp_go")} ${icon("chevron-right", 16)}</span>
        </a>
      </section>
      <h2 class="section-title">${t("how_title")}</h2>
      <section class="how">
        ${[1, 2, 3, 4].map((n) => `<div><span class="n">${n}</span><h3>${t(`how${n}_t`)}</h3><p>${t(`how${n}_p`)}</p></div>`).join("")}
      </section>
    </div>`;
  },
  mount(root) {
    const svg = root.querySelector("#dotmap"), fs = STORE.data.realAreas?.features || [];
    const bb = [6.12, 52.61, 7.1, 53.21], lat0 = 52.9, kx = Math.cos((lat0 * Math.PI) / 180), K = 700;
    const W = (bb[2] - bb[0]) * kx * K, H = (bb[3] - bb[1]) * K;
    svg.setAttribute("viewBox", `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    const pts = [], stepX = 0.03, stepY = 0.018;
    const maxQ = Math.max(1, ...fs.map((f) => Math.max(f.properties.queue_afname_mw || 0, f.properties.queue_teruglevering_mw || 0)));
    for (let la = bb[1]; la < bb[3]; la += stepY) for (let lo = bb[0]; lo < bb[2]; lo += stepX) {
      if (!ENGINE.inDrenthe(la, lo)) continue;
      const ra = ENGINE.realAreaAt(la, lo);
      pts.push({ x: (lo - bb[0]) * kx * K, y: (bb[3] - la) * K, p: ra?.properties });
    }
    svg.innerHTML = pts.map((d, i) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="0" data-i="${i}"></circle>`).join("");
    const draw = () => {
      const dir = STORE.state.dir;
      svg.querySelectorAll("circle").forEach((c) => {
        const p = pts[+c.dataset.i].p, q = p ? p[`queue_${dir}_mw`] || 0 : 0;
        c.setAttribute("fill", p ? MAPKIT.CODE[ENGINE.ckCode(p, dir)] : "#D5DED3");
        c.setAttribute("r", (2.6 + 5.2 * Math.sqrt(q / maxQ)).toFixed(1));
      });
      root.querySelectorAll("#dot-dir button").forEach((b) => b.classList.toggle("on", b.dataset.d === dir));
    };
    draw(); // first draw without animation; afterwards switching direction animates the dots
    setTimeout(() => svg.classList.add("live"), 50);
    root.querySelectorAll("#dot-dir button").forEach((b) => (b.onclick = () => { STORE.state.dir = b.dataset.d; draw(); }));
  },
};

// =====================================================================================  CUSTOMER: my projects
const ProjectsPage = {
  html() {
    const sim = ENGINE.simulate(STORE.state.applied), mine = ENGINE.orders().filter((o) => o.mine);
    const rows = mine.map((o) => {
      const r = sim.res[o.id], ev = STORE.state.events[o.id] || [], last = ev[ev.length - 1];
      return `<a class="row-item" href="#/klant/project/${o.id}">
        <span class="bar ${pending(o) ? "s-neutral" : STATUS_CLASS[r?.status] || "s-neutral"}"></span>
        <div><h3>${icon(TYPE_ICON[o.category] || "zap")} ${esc(title(o))}</h3>
          <div class="row-meta"><span>${icon("map-pin", 14)} ${esc(o.municipality || ENGINE.area(o.area_id)?.name || "")}</span><span>${ENGINE.oMW(o)} MW ${t(ENGINE.oDir(o)).toLowerCase()}</span>
          <span>${icon("calendar-clock", 14)} ${t("from_year", { y: o.year_needed })}</span>${last ? `<span>${icon("clock", 14)} ${last.date}</span>` : ""}</div>
          <p class="small" style="margin-top:6px">${t("next_step")} (<b>${nextOwner(o).who}</b>): ${nextOwner(o).text}</p></div>
        <div class="row-end"><div class="small muted">${t("expected")}</div><div class="est ${pending(o) ? "est-pending" : ""}">${estText(o, r)}</div>${estPill(o, r)}</div>
      </a>`;
    }).join("");
    return `<div class="page">
      <div class="page-head"><div><h1>${t("projects_title")}</h1><p class="muted">${t("projects_lead")}</p></div>
        <a class="btn btn-primary" href="#/klant/nieuw">${icon("plus")} ${t("nav_new")}</a></div>
      <div class="split">
        <div>${mine.length ? `<div class="rows">${rows}</div>` : `<div class="empty">${t("projects_empty")}</div>`}</div>
        <div class="sticky"><div class="map" id="map"></div><p class="map-caption">${t("view_today")}: ${t("view_today_hint")}, ${t(STORE.state.dir).toLowerCase()}</p></div>
      </div></div>`;
  },
  mount(root) {
    const map = MAPKIT.create(root.querySelector("#map")), g = L.layerGroup().addTo(map), sim = ENGINE.simulate(STORE.state.applied);
    MAPKIT.drawRealAreas(g, STORE.state.dir, { subtle: true });
    MAPKIT.drawOrders(g, sim, { mineOnly: true, onClick: (o) => (location.hash = `#/klant/project/${o.id}`) });
    const mine = ENGINE.orders().filter((o) => o.mine);
    if (mine.length) map.fitBounds(L.latLngBounds(mine.map((o) => [o.lat, o.lon])).pad(0.6), { maxZoom: 11 });
    return () => map.remove();
  },
};

// =====================================================================================  CUSTOMER: project detail
const ProjectPage = {
  html(id) {
    const o = ENGINE.orders().find((x) => x.id === id);
    if (!o) return `<div class="page"><a class="back" href="#/klant">${icon("arrow-left", 16)} ${t("back_projects")}</a><div class="empty">${t("projects_empty")}</div></div>`;
    const sim = ENGINE.simulate(STORE.state.applied), r = sim.res[o.id], dir = ENGINE.oDir(o), dec = STORE.state.applied;
    const ra = ENGINE.realAreaAt(o.lat, o.lon)?.properties, code = ra ? ENGINE.ckCode(ra, dir) : null;
    const w = r?.wait, wStatus = w && ENGINE.upStatus(w, dec, 2026);
    const opts = (dir === "afname" ? ["timeblock", "battery", "nonfirm"] : ["cablepool", "battery", "nonfirm"]).map((type) => {
      const rr = ENGINE.simulate(dec, { measure: { id: o.id, type } }).res[o.id];
      const gain = r?.year != null && rr?.year != null ? r.year - rr.year : r?.year == null && rr?.year != null ? 1 : 0;
      return `<div class="option"><span class="ico">${icon(type === "battery" ? "battery-charging" : type === "timeblock" ? "clock" : type === "cablepool" ? "cable" : "zap")}</span>
        <div><b>${t("o_" + type)}</b><p class="small muted">${t("o_" + type + "_p")}</p></div>
        <div style="text-align:right"><div class="gain ${gain > 0 ? "good" : ""}">${ENGINE.estRange(rr)}</div>
        <button class="btn btn-quiet" style="padding:4px 8px;margin-top:4px;font-size:12px" data-opt="${type}">${t("request_option")}</button></div></div>`;
    }).join("");
    const ev = (STORE.state.events[o.id] || []).map((e) => `<li class="${e.kind}"><span class="dot"></span><time>${e.date}</time><span class="t">${eventText(e)}</span></li>`).join("");
    const future = r?.year && !pending(o) && !withdrawn(o) ? `<li class="todo"><span class="dot"></span><time>${ENGINE.estRange(r)}</time><span class="t">${t("ev_connected")}</span></li>` : "";
    return `<div class="page">
      <a class="back" href="#/klant">${icon("arrow-left", 16)} ${t("back_projects")}</a>
      <div class="split">
        <div>
          <h1>${icon(TYPE_ICON[o.category] || "zap", 26)} ${esc(title(o))}</h1>
          <div class="row-meta" style="margin-top:8px">${estPill(o, r)}<span>${ENGINE.oMW(o)} MW ${t(dir).toLowerCase()}</span><span>${icon("map-pin", 14)} ${esc(o.municipality || ENGINE.area(o.area_id)?.name || "")}</span><span>${t("m_" + o.maturity)}</span></div>
          <div class="panel" style="margin-top:20px">
            <div class="estimate"><div class="big ${pending(o) ? "est-pending" : ""}">${estText(o, r)}</div>
              <div><div class="muted">${t("expected")}</div>${estPill(o, r)}</div></div>
            ${pending(o) ? `<p class="why" style="margin-top:14px">${t("review_wait")}</p>` : ""}
            ${w && !pending(o) ? `<p class="why" style="margin-top:14px">${t("waiting_for")}: <b>${title(w)}</b>, ${t(wStatus).toLowerCase()}. ${esc(w[`risk_${lang()}`] || "")}</p>` : ""}
            <div class="facts">
              <div><b>${esc([o.municipality, ENGINE.area(o.area_id)?.name].filter(Boolean).join(" · ") || "–")}</b><span>${t("f_location")} (${t("area").toLowerCase()})</span></div>
              <div><b>${esc(operatorFor(o))}</b><span>${t("grid_owner")}</span></div>
              <div><b>${t("from_year", { y: o.year_needed })}</b><span>${t("pref_start")}</span></div>
              <div><b>${t("pr" + o.priority)}</b><span>${t("prio_note")}</span></div>
              ${ra ? `<div><b>${pill(CODE_CLASS[code], t("cap" + code))}</b><span>${t("location_status")}: ${esc(ra.name)}</span></div>
              <div><b>${ra[`queue_${dir}_mw`] != null ? `${(+ra[`queue_${dir}_mw`]).toFixed(1)} MW` : "–"}</b><span>${t("queue")}, ${ra[`requests_${dir}`] ?? 0} ${t("requests")}</span></div>` : ""}
            </div>
          </div>
          <div class="panel panel-grey"><h2>${icon("list-checks")} ${t("next_step")}</h2><p>${nextOwner(o).text}</p><p class="who">${t("who")}: <b>${nextOwner(o).who}</b></p></div>
          ${pending(o) || withdrawn(o) ? "" : `<h2 class="section-title">${icon("zap")} ${t("sooner")}</h2>
          <p class="small muted">${t("sooner_lead")}</p>
          <div class="panel" style="margin-top:10px;padding-top:6px;padding-bottom:6px">${opts}</div>`}
          <h2 class="section-title">${icon("calendar-clock")} ${t("history")}</h2>
          <ul class="timeline">${ev}${future}</ul>
          ${withdrawn(o) || askedWithdraw(o) ? "" : `<div class="withdraw" id="wd"><button type="button" class="btn btn-quiet" id="wd-ask">${icon("x", 16)} ${t("req_cancel")}</button>
            <div class="wd-confirm" hidden><p class="small">${t("req_cancel_q")}</p><p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-danger" id="wd-yes">${t("req_cancel_yes")}</button><button type="button" class="btn btn-quiet" id="wd-no">${t("req_cancel_no")}</button></p></div></div>`}
        </div>
        <div class="sticky"><div class="map" id="map" style="height:560px"></div><p class="map-caption">${t("grid_note")}</p></div>
      </div></div>`;
  },
  mount(root, id) {
    const o = ENGINE.orders().find((x) => x.id === id);
    if (!o) return;
    const wd = root.querySelector("#wd");
    if (wd) {
      root.querySelector("#wd-ask").onclick = () => { wd.querySelector(".wd-confirm").hidden = false; root.querySelector("#wd-ask").hidden = true; };
      root.querySelector("#wd-no").onclick = () => { wd.querySelector(".wd-confirm").hidden = true; root.querySelector("#wd-ask").hidden = false; };
      root.querySelector("#wd-yes").onclick = () => {
        STORE.state.cancelReqs = [...(STORE.state.cancelReqs || []), o.id];
        (STORE.state.events[o.id] ??= []).push({ date: TODAY, kind: "now", key: "ev_cancel_req" });
        STORE.save(); toast(t("cancel_pending")); route();
      };
    }
    root.querySelectorAll("[data-opt]").forEach((b) => (b.onclick = () => {
      (STORE.state.events[o.id] ??= []).push({ date: TODAY, kind: "now", key: "ev_option", vars: { option: b.dataset.opt } });
      STORE.save(); toast(`${t("option_requested")} ${t("o_" + b.dataset.opt).toLowerCase()}`); route();
    }));
    const dec = STORE.state.applied, sim = ENGINE.simulate(dec), r = sim.res[o.id], dir = ENGINE.oDir(o);
    // the customer can zoom in and out around their own project, but not move away from it
    const map = MAPKIT.create(root.querySelector("#map"), { center: [o.lat, o.lon], zoom: 11, zoomOnly: true }), g = L.layerGroup().addTo(map);
    MAPKIT.drawRealAreas(g, dir, { subtle: true });
    const st = stationFor(o.area_id), pts = [[o.lat, o.lon]];
    if (st) {
      pts.push([st.lat, st.lon]);
      L.polyline([[o.lat, o.lon], [st.lat, st.lon]], { pane: "lines", color: MAPKIT.COL.navy, weight: 1.5, dashArray: "1 6", interactive: false }).addTo(g);
      L.circleMarker([st.lat, st.lon], { pane: "points", radius: 8, weight: 2, color: "#fff", fillColor: MAPKIT.COL.navy, fillOpacity: 1 }).addTo(g);
      MAPKIT.drawLines(g, 2026, { near: [st.lat, st.lon], stationIds: [o.area_id] });
    }
    const ups = ENGINE.upgradesIn(o.area_id, dec).filter((u) => u.lat != null);
    // grid-operator details (station status, upgrade years, whether it decides the date) are not shown to customers:
    // only the markers, without labels or popups
    MAPKIT.drawUpgrades(g, dec, 2026, { only: ups.map((u) => u.id), labels: false, popup: false });
    for (const u of ups) pts.push([u.lat, u.lon]);
    MAPKIT.pin(g, o.lat, o.lon, `<b>${esc(title(o))}</b><br>${ENGINE.oMW(o)} MW`);
    // centre on the project: mirror every point around it so the fitted view keeps the project in the middle
    const b = L.latLngBounds(pts.flatMap(([la, lo]) => [[la, lo], [2 * o.lat - la, 2 * o.lon - lo]]));
    map.setView([o.lat, o.lon], Math.min(12, map.getBoundsZoom(b.pad(0.1), false, L.point(40, 110))));
    return () => map.remove();
  },
};

// =====================================================================================  CUSTOMER: new request
const NewPage = {
  form: { name: "", category: "solar", mw: 10, year: 2028, maturity: "planned", lat: null, lon: null },
  html() { return `<div class="page"><a class="back" href="#/klant">${icon("arrow-left", 16)} ${t("back_projects")}</a>
    <div class="page-head"><div><h1>${t("new_title")}</h1><p class="muted">${t("new_lead")}</p></div></div>
    <div class="split"><div id="form"></div><div class="sticky"><div class="map" id="map" style="height:560px"></div><p class="map-caption">${t("f_loc_hint")}</p></div></div></div>`; },
  formHtml() {
    const f = this.form, types = ["solar", "battery", "housing", "school", "hospital", "defence", "business_park", "industry", "charging", "hydrogen", "heat"];
    const areaId = f.lat != null ? ENGINE.areaAt(f.lat, f.lon) : null;
    // no estimate here: an expert of the grid operator checks the request first and sends the estimate back
    const ra = areaId ? ENGINE.realAreaAt(f.lat, f.lon)?.properties : null, dir = f.category === "solar" ? "teruglevering" : "afname";
    const code = ra ? ENGINE.ckCode(ra, dir) : null;
    const est = `<div class="panel" style="margin-top:8px"><h3 style="margin:0 0 6px">${icon("user-check", 18)} ${t("review_title")}</h3><p>${t("review_p")}</p>
      ${ra ? `<p class="small" style="margin-top:10px">${t("review_today")} (${esc(ra.name)}): ${pill(CODE_CLASS[code], t("cap" + code))}</p>` : ""}</div>`;
    return `<div class="step-h"><span class="n">1</span><h2>${t("s1")}</h2></div>
      <div class="field"><label for="f-name">${t("f_name")}</label><input id="f-name" value="${esc(f.name)}" placeholder="${t("f_name_ph")}"></div>
      <div class="field"><label>${t("f_type")}</label><div class="types">${types.map((x) => `<button type="button" data-cat="${x}" class="${x === f.category ? "on" : ""}">${icon(TYPE_ICON[x], 20)}<span>${t("t_" + x)}</span><small>${t("pr" + ({ battery: 1, defence: 2, hospital: 3, school: 3, housing: 3 }[x] || 4))}</small></button>`).join("")}</div></div>
      <div class="grid2"><div class="field"><label for="f-mw">${t("f_mw")}</label><input id="f-mw" type="number" min="0.1" step="0.5" value="${f.mw}"><p class="hint">${t("f_mw_hint")}</p></div>
        <div class="field"><label for="f-year">${t("f_year")}</label><input id="f-year" type="number" min="2026" max="2035" value="${f.year}"></div></div>
      <div class="field"><label for="f-mat">${t("f_phase")}</label><select id="f-mat">${["idea", "planned", "permit", "contracted"].map((m) => `<option value="${m}" ${m === f.maturity ? "selected" : ""}>${t("m_" + m)}</option>`).join("")}</select></div>
      <div class="step-h"><span class="n">2</span><h2>${t("s2")}</h2></div>
      <p>${areaId ? `${icon("check")} ${t("f_loc_set")} <b>${esc(ENGINE.area(areaId).name)}</b>` : `<span class="muted">${t("f_loc_none")}. ${t("f_loc_hint")}</span>`}</p>
      <div class="step-h"><span class="n">3</span><h2>${t("s3")}</h2></div>
      ${est}
      <p style="margin-top:16px"><button class="btn btn-primary" id="f-submit" ${areaId ? "" : "disabled"}>${icon("check")} ${t("submit")}</button></p>`;
  },
  draft(areaId) {
    const f = this.form, feed = f.category === "solar", bat = f.category === "battery";
    return { id: "draft", title_nl: f.name || "Nieuw project", title_en: f.name || "New project", category: f.category,
      mw_offtake: feed || bat ? 0 : +f.mw, mw_feed_in: feed ? +f.mw : 0, mw_flex: bat ? +f.mw : 0, lat: f.lat, lon: f.lon, area_id: areaId,
      year_needed: +f.year, maturity: f.maturity, municipality: "", priority: { battery: 1, defence: 2, hospital: 3, school: 3, housing: 3 }[f.category] ?? 4, request_seq: 9999 };
  },
  mount(root) {
    // zoom and pan (inside Drenthe) to find the exact spot; the mouse wheel keeps scrolling the form
    const map = MAPKIT.create(root.querySelector("#map"), { interactive: true, scroll: false }), g = L.layerGroup().addTo(map), mk = L.layerGroup().addTo(map);
    MAPKIT.drawRealAreas(g, this.form.category === "solar" ? "teruglevering" : "afname", { subtle: true });
    g.eachLayer((l) => l.eachLayer?.((x) => { x.unbindPopup(); x.on("click", (e) => pick(e.latlng)); }));
    const drawPin = () => { mk.clearLayers(); if (this.form.lat != null) MAPKIT.pin(mk, this.form.lat, this.form.lon); };
    const pick = (ll) => { if (!ENGINE.areaAt(ll.lat, ll.lng)) return; this.form.lat = +ll.lat.toFixed(4); this.form.lon = +ll.lng.toFixed(4); drawPin(); renderForm(); };
    map.on("click", (e) => pick(e.latlng));
    const renderForm = () => {
      const el = root.querySelector("#form"); el.innerHTML = this.formHtml();
      const read = () => Object.assign(this.form, { name: el.querySelector("#f-name").value, mw: +el.querySelector("#f-mw").value || 1, year: +el.querySelector("#f-year").value || 2028, maturity: el.querySelector("#f-mat").value });
      el.querySelector("#f-name").oninput = read;
      ["#f-mw", "#f-year", "#f-mat"].forEach((s) => (el.querySelector(s).onchange = () => { read(); renderForm(); }));
      el.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => { read(); this.form.category = b.dataset.cat; renderForm(); }));
      el.querySelector("#f-submit").onclick = () => {
        read(); const areaId = ENGINE.areaAt(this.form.lat, this.form.lon); if (!areaId) return;
        const o = ENGINE.addOrder({ ...this.draft(areaId), id: "u-" + Date.now(), municipality: "", review: "pending" });
        seedEvents(o); STORE.save();
        this.form = { name: "", category: "solar", mw: 10, year: 2028, maturity: "planned", lat: null, lon: null };
        toast(t("submitted")); location.hash = `#/klant/project/${o.id}`;
      };
    };
    renderForm(); drawPin();
    return () => map.remove();
  },
};

// =====================================================================================  PLANNER: overview
const OverviewPage = {
  html() {
    return `<div class="dash"><div class="dash-main">
      <div class="toolbar">
        <span class="seg" id="v-view"><button data-v="today">${t("view_today")}</button><button data-v="proj">${t("view_proj")}</button></span>
        <span class="yr" id="v-yr"><span class="muted">${t("view_proj")}</span><b id="yr-v"></b><input type="range" id="yr" min="2026" max="2035" step="1"></span>
        <span class="seg" id="v-dir"><button data-d="afname">${t("afname")}</button><button data-d="teruglevering">${t("teruglevering")}</button></span>
        <span class="chips" id="v-layers">${["stations", "upgrades", "cables", "projects"].map((k) => `<button class="chip" data-l="${k}">${t("l_" + k)}</button>`).join("")}</span>
      </div>
      <div class="dash-map"><div class="map" id="map"></div></div></div>
      <aside class="dash-side" id="side"></aside></div>`;
  },
  mount(root) {
    const map = MAPKIT.create(root.querySelector("#map"), { zoom: 9, popupTop: 125, interactive: true }), g = L.layerGroup().addTo(map);
    let leg = null;
    // leave room for the floating toolbar (top) and the legend (bottom)
    const fit = setTimeout(() => { if (!map._container) return; map.invalidateSize(); map.fitBounds([[52.62, 6.15], [53.2, 7.1]], { paddingTopLeft: [10, 90], paddingBottomRight: [10, 150] }); }, 60);
    const draw = () => {
      const s = STORE.state, sim = ENGINE.simulate(s.applied);
      g.clearLayers();
      if (s.view === "today") MAPKIT.drawRealAreas(g, s.dir);
      else MAPKIT.drawProjAreas(g, sim, s.dir, s.year, { onClick: (id) => (location.hash = `#/planner/gebied/${id}`) });
      if (s.layers.cables) MAPKIT.drawLines(g, s.view === "today" ? 2026 : s.year);
      if (s.layers.stations) MAPKIT.drawStations(g);
      if (s.layers.upgrades) MAPKIT.drawUpgrades(g, s.applied, s.view === "today" ? 2026 : s.year, { labels: "risk" });
      if (s.layers.projects) MAPKIT.drawOrders(g, sim, { onClick: (o) => (location.hash = `#/planner/gebied/${o.area_id}`) });
      leg?.remove();
      const infraOn = s.layers.stations || s.layers.upgrades || s.layers.cables;
      leg = MAPKIT.legend(map, (s.view === "today" ? MAPKIT.legendReal(false) : MAPKIT.legendProj()) +
        (infraOn ? MAPKIT.legendInfra() + (s.layers.cables ? `<section><div class="q">${t("grid_note")}</div></section>` : "") : ""), "bottomleft", { wide: true });
      root.querySelectorAll("#v-view button").forEach((b) => b.classList.toggle("on", b.dataset.v === s.view));
      root.querySelectorAll("#v-dir button").forEach((b) => b.classList.toggle("on", b.dataset.d === s.dir));
      root.querySelectorAll("#v-layers .chip").forEach((b) => b.classList.toggle("on", s.layers[b.dataset.l]));
      root.querySelector("#v-yr").style.opacity = s.view === "proj" ? 1 : 0.4;
      root.querySelector("#yr").value = s.year; root.querySelector("#yr-v").textContent = s.year;
      root.querySelector("#side").innerHTML = this.side(sim);
      root.querySelector("#show-all")?.addEventListener("click", () => { STORE.state.showAll = !STORE.state.showAll; draw(); });
      root.querySelectorAll("[data-withdraw]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.withdraw, s2 = STORE.state;
        markWithdrawn(id);
        const n = applyDecision({ ...s2.applied, cancelled: [...(s2.applied.cancelled || []), id] }, [id]);
        toast(t(n === 1 ? "cx_done1" : n ? "cx_done" : "cx_done0", { n })); draw();
      }));
      root.querySelectorAll("[data-confirm]").forEach((b) => (b.onclick = () => {
        const o = ENGINE.orders().find((x) => x.id === b.dataset.confirm), r = sim.res[o.id];
        ENGINE.confirmOrder(o.id);
        const list = (STORE.state.events[o.id] ??= []);
        list.forEach((e) => { if (e.kind === "now") e.kind = "done"; });
        list.push({ date: TODAY, kind: "now", key: "ev_confirmed", vars: { est: ENGINE.estRange(r), wait: r?.wait?.id || "" } });
        STORE.save(); toast(t("rv_sent")); draw();
      }));
    };
    root.querySelectorAll("#v-view button").forEach((b) => (b.onclick = () => { STORE.state.view = b.dataset.v; draw(); }));
    root.querySelectorAll("#v-dir button").forEach((b) => (b.onclick = () => { STORE.state.dir = b.dataset.d; draw(); }));
    root.querySelectorAll("#v-layers .chip").forEach((b) => (b.onclick = () => { STORE.state.layers[b.dataset.l] = !STORE.state.layers[b.dataset.l]; draw(); }));
    root.querySelector("#yr").oninput = (e) => { STORE.state.year = +e.target.value; STORE.state.view = "proj"; draw(); };
    draw();
    return () => { clearTimeout(fit); map.remove(); };
  },
  // customers asking to withdraw a request: confirming takes it out of the queue and tells everyone affected
  withdrawals(sim) {
    const list = ENGINE.orders().filter(askedWithdraw);
    if (!list.length) return "";
    return `<div class="side-h"><h2>${t("cx_title")} (${list.length})</h2><p class="small muted">${t("cx_lead")}</p></div>
      ${list.map((o) => `<div class="review-row"><div><b>${esc(title(o))}</b><div class="small muted">${ENGINE.oMW(o)} MW ${t(ENGINE.oDir(o)).toLowerCase()}, ${esc(ENGINE.area(o.area_id)?.name || "")}</div>
        <div class="small">${t("cx_frees", { mw: ENGINE.oMW(o), area: esc(ENGINE.area(o.area_id)?.name || "") })}</div></div>
        <button class="btn btn-danger" data-withdraw="${o.id}">${icon("x", 16)} ${t("cx_send")}</button></div>`).join("")}`;
  },
  // new requests waiting for an expert to confirm the model's estimate
  reviews(sim) {
    const list = ENGINE.orders().filter(pending);
    if (!list.length) return "";
    return `<div class="side-h"><h2>${t("rv_title")} (${list.length})</h2><p class="small muted">${t("rv_lead")}</p></div>
      ${list.map((o) => { const r = sim.res[o.id];
        return `<div class="review-row"><div><b>${esc(title(o))}</b><div class="small muted">${ENGINE.oMW(o)} MW ${t(ENGINE.oDir(o)).toLowerCase()}, ${esc(ENGINE.area(o.area_id)?.name || "")}</div>
          <div class="small">${t("rv_model")}: <b>${ENGINE.estRange(r)}</b>${r?.wait ? `, ${t("waiting_for").toLowerCase()} ${esc(title(r.wait))}` : ""}</div></div>
          <button class="btn btn-primary" data-confirm="${o.id}">${icon("send", 16)} ${t("rv_send")}</button></div>`; }).join("")}`;
  },
  side(sim) {
    const s = STORE.state, ids = STORE.data.areas.features.map((f) => f.properties.id);
    const bn = ids.filter((id) => ENGINE.areaStatus(sim, id, s.dir, s.year).status === "bottleneck").length;
    const late = ENGINE.upgrades(s.applied).filter((u) => ENGINE.upYear(u, s.applied) > u.year_desired).length;
    const st = ENGINE.realStats();
    const rows = ids.map((id) => ({ id, d: ENGINE.deadline(sim, id, s.dir), now: ENGINE.areaStatus(sim, id, s.dir, s.year) }))
      .sort((a, b) => (a.d?.first ?? 9999) - (b.d?.first ?? 9999) || b.now.unmet - a.now.unmet || b.now.ratio - a.now.ratio);
    const un = rows.reduce((t2, r) => ({ f: t2.f + r.now.unmetFormal, e: t2.e + r.now.unmetEarly }), { f: 0, e: 0 });
    const firstDec = rows.find((r) => r.d)?.d;
    return `<div class="kpis">
        <div><b>${bn} / ${ids.length}</b><span>${t("k_bottlenecks")} ${s.year}</span></div>
        <div><b class="${late ? "bad" : ""}">${late}</b><span>${t("k_delayed")}</span></div>
        <div><b>${Math.round(st.mw).toLocaleString(lang() === "nl" ? "nl-NL" : "en-GB")}</b><span>${t("k_queue")}</span></div>
        <div><b class="${firstDec?.late ? "bad" : ""}">${firstDec ? (firstDec.late ? t("too_late") : `${t("pmiek")} ${firstDec.pmiek}`) : "–"}</b><span>${t("k_first")} (${t("model_short")})</span></div>
        <div><b class="${un.f + un.e >= 0.5 ? "bad" : ""}">${Math.round(un.f + un.e)} MW</b><span>${t("k_unmet", { y: s.year })}</span></div>
        <div><b>${Math.round(un.f)} / ${Math.round(un.e)} MW</b><span>${t("k_unmet_split")}</span></div>
      </div>
      ${this.withdrawals(sim)}
      ${this.reviews(sim)}
      <div class="side-h"><h2>${t("attention")}</h2><p class="small muted">${t("attention_lead")}</p></div>
      ${rows.filter((r) => s.showAll || r.d || r.now.status !== "room").map((r) => `<a class="area-row" href="#/planner/gebied/${r.id}">
        <h3>${esc(ENGINE.area(r.id).name)}</h3>${pill(STATUS_CLASS[r.now.status], t(r.now.status))}
        <div class="sub">${meter(r.now.ratio)}<span>${r.d ? `${t("first_bn")} ${r.d.first}` : t("none_bn")}</span>
        ${r.d ? `<span style="color:${r.d.late ? "var(--shortage-tx)" : "inherit"}">${r.d.late ? t("too_late") : `${t("pmiek")} ${r.d.pmiek} (${t("model_short")})`}</span>` : ""}
        ${r.now.unmet >= 0.5 ? `<span class="unmet">${Math.round(r.now.unmet)} MW ${t("unmet_short")} ${s.year}</span>` : ""}</div></a>`).join("")}
      ${rows.some((r) => !(r.d || r.now.status !== "room")) ? `<button class="show-all" id="show-all">${s.showAll ? t("show_less") : t("show_all", { n: rows.length })}</button>` : ""}`;
  },
};

// the withdrawn project's own timeline entry, and the request is no longer waiting
function markWithdrawn(id) {
  const s = STORE.state, o = ENGINE.orders().find((x) => x.id === id);
  s.cancelReqs = (s.cancelReqs || []).filter((x) => x !== id);
  if (!o?.mine) return;
  const list = (s.events[id] ??= []);
  list.forEach((e) => { if (e.kind === "now") e.kind = "done"; });
  list.push({ date: TODAY, kind: "warn", key: "ev_cancelled" });
}
// put a decision in force and write the change into every affected customer's timeline; returns how many were told
function applyDecision(next, skip = []) {
  const s = STORE.state, D = ENGINE.diff(s.applied, next);
  let n = 0;
  for (const c of D.out) {
    if (!c.o?.mine || pending(c.o) || skip.includes(c.id)) continue; n++;
    const list = (s.events[c.id] ??= []);
    list.forEach((e) => { if (e.kind === "now") e.kind = "done"; });
    list.push({ date: TODAY, kind: c.to?.year != null && c.from?.year != null && c.to.year < c.from.year ? "now" : "warn", key: "ev_changed",
      vars: { from: c.from ? ENGINE.estRange(c.from) : "–", to: c.to ? ENGINE.estRange(c.to) : "–", reason: c.reason } });
  }
  s.applied = JSON.parse(JSON.stringify(next)); s.draft = JSON.parse(JSON.stringify(next));
  STORE.save();
  return n;
}

// what holds a grid upgrade up, read from its source fields (Enexis IP2026 notes); nothing is invented
const noFlag = (s) => String(s || "").replace(/\s*🔎/g, "");
function blockers(u) {
  if (u.is_new) return [];
  const txt = `${u.space_nl || ""} ${u.risk_nl || ""}`.toLowerCase(), out = [];
  if (u.phase === "study" || /locatie nog/.test(txt)) out.push("blk_location");
  if (/procedure|bestemmingsplan|vergunning|raad van state/.test(txt)) out.push("blk_permit");
  if (/aannemer/.test(txt)) out.push("blk_contractors");
  if (/\//.test(u.operator || "")) out.push("blk_coord");
  return out;
}
function nextAction(ups) {
  const u = ups[0];
  if (!u) return { owner: t("own_pmiek"), act: t("act_propose") };
  const owner = (u.operator || t("netbeheerder")).replace("/", " + ");
  if (u.is_new) return { owner, act: t("act_propose") };
  if (u.phase === "study") return { owner, act: t("act_study") };
  if (u.infra_status === "under_construction") return { owner, act: t("act_build") };
  return { owner, act: t("act_plan") };
}

// =====================================================================================  PLANNER: area detail
const AreaPage = {
  html(id) {
    const a = ENGINE.area(id);
    if (!a) return `<div class="page"><a class="back" href="#/planner">${icon("arrow-left", 16)} ${t("back_overview")}</a></div>`;
    const s = STORE.state, sim = ENGINE.simulate(s.applied), d = ENGINE.deadline(sim, id, s.dir), cur = ENGINE.areaStatus(sim, id, s.dir, s.year);
    const strip = Array.from({ length: 10 }, (_, i) => 2026 + i).map((y) => {
      const st = ENGINE.areaStatus(sim, id, s.dir, y).status;
      return `<button data-y="${y}" class="${y === s.year ? "on" : ""}" style="background:${MAPKIT.COL[st]};opacity:${st === "room" ? .85 : 1}">${y}</button>`;
    }).join("");
    const ups = ENGINE.upgradesIn(id, s.applied).map((u) => {
      const y = ENGINE.upYear(u, s.applied), dl = y - u.year_desired, bl = blockers(u);
      const affected = ENGINE.orders().filter((o) => o.area_id === id && ENGINE.oDir(o) === s.dir && o.year_needed <= y);
      return `<div class="upg"><b>${title(u)}</b><span class="delay ${dl > 0 ? "" : "ok"}">${dl > 0 ? t("delay_y", { n: dl }) : t("on_time_u")}</span>
        <div class="sub">${t(ENGINE.upStatus(u, s.applied, 2026))}, ${t("desired")} ${u.year_desired}, ${t("feasible")} ${y}. ${esc(noFlag(u[`space_${lang()}`]))} ${esc(u[`risk_${lang()}`] || "")}</div>
        ${bl.length ? `<div class="sub tags">${bl.map((k) => `<span class="tag">${t(k)}</span>`).join("")}</div>` : ""}
        ${affected.length ? `<div class="sub">${t("affected_projects")}: ${affected.slice(0, 3).map((o) => esc(title(o))).join(", ")}</div>` : ""}</div>`;
    }).join("") || `<p class="muted">–</p>`;
    const queue = ENGINE.orders().filter((o) => o.area_id === id && !withdrawn(o)).sort((a, b) => a.priority - b.priority || a.request_seq - b.request_seq).map((o) => {
      const r = sim.res[o.id];
      return `<div class="queue-row"><span class="prio p${o.priority}" title="${t("pr" + o.priority)}">${o.priority}</span>
        <div><b>${esc(title(o))}</b><div class="small muted">${ENGINE.oMW(o)} MW ${t(ENGINE.oDir(o)).toLowerCase()}, ${t("pr" + o.priority).toLowerCase()}</div></div>
        <div style="text-align:right"><b>${ENGINE.estRange(r)}</b><br>${pill(STATUS_CLASS[r?.status] || "s-neutral", t(r?.status || "proceeds"))}</div></div>`;
    }).join("") || `<p class="muted">–</p>`;
    const stn = stationFor(id), atStation = stn ? ENGINE.realAreaAt(stn.lat, stn.lon) : null;
    const realHere = (atStation ? [atStation] : []).concat((STORE.data.realAreas?.features || []).filter((f) => {
      const [la, lo] = ENGINE.centroid(f.geometry); return ENGINE.areaAt(la, lo) === id;
    }));
    const seen = new Set(), realRows = realHere.filter((f) => !seen.has(f.properties.name) && seen.add(f.properties.name)).map((f) => {
      const p = f.properties, c = ENGINE.ckCode(p, s.dir), q = p[`queue_${s.dir}_mw`];
      return `<div class="queue-row" style="grid-template-columns:minmax(0,1fr) auto"><div><b>${esc(p.name)}</b><div class="small muted">${t("queue")} ${q != null ? (+q).toFixed(1) : "–"} MW, ${p[`requests_${s.dir}`] ?? 0} ${t("requests")}</div></div>${pill(CODE_CLASS[c], t("cap" + c))}</div>`;
    }).join("");
    return `<div class="page">
      <a class="back" href="#/planner">${icon("arrow-left", 16)} ${t("back_overview")}</a>
      <div class="page-head"><div><h1>${esc(a.name)}</h1><p class="muted">${t("area_lead")}</p></div>
        <div style="display:flex;gap:10px;align-items:center"><span class="seg" id="a-dir"><button data-d="afname" class="${s.dir === "afname" ? "on" : ""}">${t("afname")}</button><button data-d="teruglevering" class="${s.dir === "teruglevering" ? "on" : ""}">${t("teruglevering")}</button></span>
        <a class="btn" href="#/planner/simulator" id="to-sim">${icon("sliders-horizontal")} ${t("test_sim")}</a></div></div>
      <div class="split">
        <div>
          <div class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0">${s.year}: ${Math.round(cur.load)} / ${Math.round(cur.cap)} MW</h2>${meter(cur.ratio)}</div>
            <div class="yearstrip">${strip}</div>
            <div class="chart-box"><canvas id="chart"></canvas></div>
            ${this.table(sim, id)}
            <p class="small muted" style="margin-top:8px">${t("unmet_note")}</p>
          </div>
          <div class="panel">
            <h2>${icon("calendar-clock")} ${t("decision")}</h2>
            ${d ? this.decision(id, sim, d) : `<p class="muted">${t("none_bn")}</p>`}
          </div>
          <div class="panel"><h2>${icon("route")} ${t("upgrades")}</h2>${ups}</div>
        </div>
        <div>
          <div class="panel"><h2>${icon("list-checks")} ${t("queue_title")}</h2><p class="small muted" style="margin:-6px 0 6px">${t("queue_lead")}</p>${queue}</div>
          ${realRows ? `<div class="panel"><h2>${icon("layers")} ${t("real_here")}</h2>${realRows}</div>` : ""}
          <div class="map" id="map" style="height:320px;margin-top:16px"></div>
        </div>
      </div></div>`;
  },
  // the decision a bottleneck needs: shortfall, who waits on it, who acts next, when, and what holds it up
  decision(id, sim, d) {
    const s = STORE.state, ups = ENGINE.upgradesIn(id, s.applied);
    // the year with the biggest shortfall, split into what is already connected and what doesn't fit yet
    const peak = Array.from({ length: ENGINE.END - ENGINE.START + 1 }, (_, i) => ENGINE.START + i)
      .reduce((best, y) => { const a = ENGINE.areaStatus(sim, id, s.dir, y); return !best || a.shortfall > best.a.shortfall ? { y, a } : best; }, null);
    const at = peak.a, nextPmiek = Math.max(d.pmiek, 2027); // late: the next pMIEK round is the first decision moment left
    const next = nextAction(ups);
    const waiting = ENGINE.orders().filter((o) => o.area_id === id && o.category !== "battery" && !withdrawn(o) && ENGINE.oDir(o) === s.dir && (sim.res[o.id]?.year ?? 9999) > o.year_needed);
    const bl = [...new Set(ups.flatMap(blockers))];
    return `<dl class="dec">
        <dt>${t("dec_shortfall", { y: peak.y })}</dt><dd><b>${Math.round(at.shortfall)} MW</b> <span class="muted">${t("dec_split", { f: Math.round(at.unmetFormal), e: Math.round(at.unmetEarly) })}</span></dd>
        <dt>${t("dec_projects")}</dt><dd>${waiting.length ? waiting.map((o) => `${esc(title(o))} <span class="muted">(${ENGINE.oMW(o)} MW, ${t(ENGINE.isFormal(o) ? "formal" : "early")}, ${t("from_year", { y: o.year_needed })} → ${ENGINE.estRange(sim.res[o.id])})</span>`).join("<br>") : "–"}</dd>
        <dt>${t("dec_next")}</dt><dd>${next.act}${d.late ? `<br><span style="color:var(--shortage-tx)">${t("act_measures")}</span>` : ""}</dd>
        <dt>${t("dec_owner")}</dt><dd>${esc(next.owner)}</dd>
        <dt>${t("dec_due")}</dt><dd>${d.late ? `<b style="color:var(--shortage-tx)">${t("too_late")}</b>. ${t("next_moment")}: <b>${t("pmiek")} ${nextPmiek}</b>` : `<b>${t("pmiek")} ${d.pmiek}</b>`} ${pill("s-neutral", t("model_est"))}</dd>
        <dt>${t("dec_block")}</dt><dd>${!ups.length ? t("no_upg") : bl.length ? bl.map((k) => `<span class="tag">${t(k)}</span>`).join(" ") : t("blk_none_known")}</dd>
      </dl>
      ${d.late ? "" : `<div class="chain" style="margin-top:14px"><div><span>${t("pmiek")}</span><b>${d.pmiek}</b></div><div><span>${t("ip")}</span><b>${d.ip}</b></div><div><span>${t("in_service")}</span><b>${d.first}</b></div></div>`}
      <p class="small muted" style="margin-top:8px">${t("model_est_note")}</p>`;
  },
  // load, capacity and unmet demand side by side for every year
  table(sim, id) {
    const ser = ENGINE.series(sim, id, STORE.state.dir), r = (v) => Math.round(v);
    const row = (label, arr, cls = "") => `<tr class="${cls}"><th>${label}</th>${arr.map((v) => `<td>${r(v) || (cls ? "–" : 0)}</td>`).join("")}</tr>`;
    return `<div class="ytable"><table><thead><tr><th>MW</th>${ser.years.map((y) => `<th>${y}</th>`).join("")}</tr></thead><tbody>
      ${row(t("c_load"), ser.load)}${row(t("capacity"), ser.cap)}
      ${row(t("c_unmet_f"), ser.unmetFormal, "un")}${row(t("c_unmet_e"), ser.unmetEarly, "un")}${row(t("c_short"), ser.shortfall, "short")}
      </tbody></table></div>`;
  },
  mount(root, id) {
    if (!ENGINE.area(id)) return;
    const s = STORE.state, sim = ENGINE.simulate(s.applied), ser = ENGINE.series(sim, id, s.dir);
    root.querySelectorAll(".yearstrip button").forEach((b) => (b.onclick = () => { STORE.state.year = +b.dataset.y; route(); }));
    root.querySelectorAll("#a-dir button").forEach((b) => (b.onclick = () => { STORE.state.dir = b.dataset.d; route(); }));
    root.querySelector("#to-sim").onclick = () => { STORE.state.simArea = id; };
    const chart = new Chart(root.querySelector("#chart"), {
      type: "bar",
      data: { labels: ser.years, datasets: [
        { type: "line", label: t("capacity"), data: ser.cap.map((v) => Math.round(v)), borderColor: "#022A2C", borderDash: [6, 4], stepped: "middle", pointRadius: 0, borderWidth: 2, order: 0 },
        { label: t("c_load"), data: ser.load.map((v) => Math.round(v)), backgroundColor: "#0A5353", stack: "d", order: 1 },
        { label: t("c_unmet_f"), data: ser.unmetFormal.map((v) => Math.round(v)), backgroundColor: "#E25A6B", stack: "d", order: 1 },
        { label: t("c_unmet_e"), data: ser.unmetEarly.map((v) => Math.round(v)), backgroundColor: "rgba(226,90,107,.35)", stack: "d", order: 1 },
      ] },
      options: { maintainAspectRatio: false, animation: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans', Arial" } } } },
        scales: { y: { title: { display: true, text: "MW" }, beginAtZero: true, stacked: true, grid: { color: "#E6EEE5" } }, x: { stacked: true, grid: { display: false } } } },
    });
    const map = MAPKIT.create(root.querySelector("#map"), { interactive: true, scroll: false }), g = L.layerGroup().addTo(map);
    const f = STORE.data.areas.features.find((x) => x.properties.id === id);
    MAPKIT.drawRealAreas(g, s.dir, { subtle: true });
    L.geoJSON(f, { pane: "lines", style: { color: MAPKIT.COL.navy, weight: 3, fill: false, dashArray: "6 4" }, interactive: false }).addTo(g);
    MAPKIT.drawUpgrades(g, s.applied, 2026, { only: ENGINE.upgradesIn(id, s.applied).map((u) => u.id) });
    MAPKIT.drawOrders(g, sim, {});
    map.fitBounds(L.geoJSON(f).getBounds().pad(0.15));
    return () => { chart.destroy(); map.remove(); };
  },
};

// =====================================================================================  PLANNER: simulator
const SimPage = {
  picked: [], // grid upgrades the planner added to the list (view only, not part of the decision)
  scope: null, // project list: "area" (the chosen area) or "all" (all of Drenthe)
  // every project (or the chosen area's), with its date now and after this draft decision; a click picks its area
  projects(sim) {
    const s = STORE.state, scope = this.scope ?? (s.simArea ? "area" : "all"), now = ENGINE.simulate(s.applied);
    const rank = { not_possible: 0, delayed: 1, proceeds: 2 };
    const list = ENGINE.orders().filter((o) => o.category !== "battery" && !withdrawn(o) && (scope === "all" || o.area_id === s.simArea))
      .sort((a, b) => (rank[sim.res[a.id]?.status] ?? 3) - (rank[sim.res[b.id]?.status] ?? 3) || (ENGINE.area(a.area_id)?.name || "").localeCompare(ENGINE.area(b.area_id)?.name || ""));
    const rows = list.map((o) => {
      const r0 = now.res[o.id], r1 = sim.res[o.id], e0 = ENGINE.estRange(r0), e1 = ENGINE.estRange(r1);
      return `<button type="button" class="proj-row ${o.area_id === s.simArea ? "on" : ""}" data-proj="${o.area_id}">
        <span class="pr-main"><b>${esc(title(o))}</b>${o.mine ? ` ${pill("s-neutral", t("role_customer"))}` : ""}${pending(o) ? ` ${pill("s-neutral", t("in_review"))}` : ""}${askedWithdraw(o) ? ` ${pill("s-investigate", t("cancel_pending"))}` : ""}
          <span class="pr-sub">${ENGINE.oMW(o)} MW ${t(ENGINE.oDir(o)).toLowerCase()} · ${esc(ENGINE.area(o.area_id)?.name || "")} · ${t(ENGINE.isFormal(o) ? "formal" : "early")}</span></span>
        <span class="pr-end">${e0 !== e1 ? `<span class="from">${e0}</span> ` : ""}<b>${e1}</b>${pill(STATUS_CLASS[r1?.status] || "s-neutral", t(r1?.status || "proceeds"))}</span></button>`;
    }).join("");
    return `<div class="side-h" style="padding:18px 0 4px"><h2>${t("sim_projects")} (${list.length})</h2><p class="small muted">${t("sim_projects_lead")}</p></div>
      <div class="seg" style="margin:6px 0 8px"><button type="button" data-scope="area" class="${scope === "area" ? "on" : ""}" ${s.simArea ? "" : "disabled"}>${s.simArea ? esc(ENGINE.area(s.simArea).name) : t("sim_scope_area")}</button><button type="button" data-scope="all" class="${scope === "all" ? "on" : ""}">${t("sim_scope_all")}</button></div>
      ${rows || `<p class="small muted">${t("sim_projects_none")}</p>`}`;
  },
  html() {
    return `<div class="sim">
      <aside id="sim-left"></aside>
      <div class="sim-map"><div class="map" id="map"></div></div>
      <aside id="sim-right"></aside></div>`;
  },
  mount(root) {
    const s = STORE.state, map = MAPKIT.create(root.querySelector("#map"), { interactive: true }), g = L.layerGroup().addTo(map);
    s.batMW ??= 20; // battery size for the next "place battery"
    const fit = setTimeout(() => { if (!map._container) return; map.invalidateSize(); map.fitBounds([[52.62, 6.15], [53.2, 7.1]], { paddingTopLeft: [20, 20], paddingBottomRight: [20, 70] }); }, 60);
    MAPKIT.legend(map, MAPKIT.legendProj(), "bottomleft", { wide: true });
    const left = root.querySelector("#sim-left"), right = root.querySelector("#sim-right");
    const draw = () => {
      const sim = ENGINE.simulate(s.draft), D = ENGINE.diff(s.applied, s.draft);
      g.clearLayers();
      MAPKIT.drawProjAreas(g, sim, s.dir, s.year, { selected: s.simArea, onClick: (id) => { s.simArea = id; this.scope = "area"; draw(); } });
      MAPKIT.drawUpgrades(g, s.draft, s.year, { labels: "risk" });
      MAPKIT.drawOrders(g, sim, {});
      const areaOpts = STORE.data.areas.features.map((f) => `<option value="${f.properties.id}" ${f.properties.id === s.simArea ? "selected" : ""}>${esc(f.properties.name)}</option>`).join("");
      const q = s.simArea ? ENGINE.orders().filter((o) => o.area_id === s.simArea && o.category !== "battery") : [];
      // only the grid upgrades that matter for this decision: the chosen area's, the ones picked, and every one changed or new
      const d = s.draft, a = s.applied, NEW = d.newUpgrades || [], OFF = d.removedUpgrades || [];
      const all = STORE.data.upgrades.concat(NEW);
      const changed = (u) => u.is_new || OFF.includes(u.id) || ENGINE.upYear(u, d) !== ENGINE.upYear(u, a);
      const shown = all.filter((u) => u.area_id === s.simArea || this.picked.includes(u.id) || changed(u));
      const yearSel = (u) => {
        const y = ENGINE.upYear(u, d), from = u.is_new ? 2027 : Math.min(u.year_desired, y);
        return `<select class="yr-sel" data-up="${u.id}" aria-label="${t("sim_upg_ready")}: ${esc(title(u))}">${Array.from({ length: 2036 - from + 1 }, (_, i) => from + i)
          .map((v) => `<option value="${v}" ${v === y ? "selected" : ""}>${v}</option>`).join("")}${u.is_new ? "" : `<option value="off" ${OFF.includes(u.id) ? "selected" : ""}>${t("sim_upg_off")}</option>`}</select>`;
      };
      const upRow = (u) => {
        const area = ENGINE.area(u.area_id)?.name || "", was = ENGINE.upYear(u, a), off = OFF.includes(u.id);
        const sub = u.is_new ? `${t("sim_new_tag")}, +${u.mw_added_offtake} MW` : off ? t("sim_upg_off").toLowerCase() : ENGINE.upYear(u, d) !== was ? `${t("now")} ${was}` : t(ENGINE.upStatus(u, d, 2026));
        const x = u.is_new || (this.picked.includes(u.id) && u.area_id !== s.simArea && !changed(u));
        return `<div class="pick-row ${changed(u) ? "changed" : ""}"><div><b>${esc(title(u))}</b><span>${esc(area)} · ${sub}</span></div>${yearSel(u)}
          ${x ? `<button type="button" class="btn btn-quiet" data-unpick="${u.id}" aria-label="${t(u.is_new ? "sim_bat_remove" : "sim_upg_hide")}">${icon("x", 14)}</button>` : "<span></span>"}</div>`;
      };
      const pickable = all.filter((u) => !shown.includes(u));
      const KIND_MW = { transformer: 25, new_station: 80, line: 40 };
      this.newKind ??= "transformer";
      left.innerHTML = `<h2>${t("sim_title")}</h2><p class="small muted" style="margin-top:4px">${t("sim_lead")}</p>
        <div class="seg" style="margin-top:14px" id="s-dir"><button data-d="afname" class="${s.dir === "afname" ? "on" : ""}">${t("afname")}</button><button data-d="teruglevering" class="${s.dir === "teruglevering" ? "on" : ""}">${t("teruglevering")}</button></div>
        <div class="field" style="margin-top:14px"><label>${t("view_proj")} <b id="s-yv">${s.year}</b></label><input type="range" id="s-yr" min="2026" max="2035" value="${s.year}" style="width:100%;accent-color:var(--navy)"></div>
        <div class="field"><label for="s-area">${t("area")}</label><select id="s-area"><option value="">${t("sim_choose")}</option>${areaOpts}</select></div>
        <h3 style="margin-top:18px">${t("sim_upg")}</h3>
        ${shown.length ? shown.map(upRow).join("") : `<p class="small muted">${t("sim_upg_lead")}</p>`}
        ${pickable.length ? `<div class="field" style="margin-top:8px"><select id="s-pick"><option value="">${t("sim_upg_pick")}</option>${pickable.map((u) => `<option value="${u.id}">${esc(title(u))}</option>`).join("")}</select></div>` : ""}
        <details class="new-upg" ${this.newOpen ? "open" : ""}><summary>${icon("plus", 16)} ${t("sim_new")}</summary>
          <div class="field"><label for="s-nk">${t("sim_new_kind")}</label><select id="s-nk">${Object.keys(KIND_MW).map((k) => `<option value="${k}" ${k === this.newKind ? "selected" : ""}>${t("k_" + k)}</option>`).join("")}</select></div>
          <div class="grid2"><div class="field"><label for="s-nmw">${t("sim_new_mw")}</label><input id="s-nmw" type="number" min="1" max="300" value="${this.newMW ?? KIND_MW[this.newKind]}"></div>
          <div class="field"><label for="s-ny">${t("sim_upg_ready")}</label><select id="s-ny">${Array.from({ length: 10 }, (_, i) => 2027 + i).map((v) => `<option ${v === (this.newYear ?? 2030) ? "selected" : ""}>${v}</option>`).join("")}</select></div></div>
          <button class="btn" id="s-new" ${s.simArea ? "" : "disabled"}>${icon("plus")} ${s.simArea ? t("sim_new_btn", { area: esc(ENGINE.area(s.simArea).name) }) : t("sim_choose")}</button>
        </details>
        <h3 style="margin-top:18px">${t("sim_bat")}</h3>
        <div class="field"><label for="s-mw">${t("sim_bat_mw")}</label>
          <div class="bat-mw"><span class="seg" id="s-mw-pre">${[5, 10, 20, 50].map((v) => `<button type="button" data-mw="${v}" class="${v === s.batMW ? "on" : ""}">${v}</button>`).join("")}</span>
          <input id="s-mw" type="number" min="1" max="200" step="1" value="${s.batMW}" aria-label="${t("sim_bat_mw")}"></div></div>
        <button class="btn" id="s-bat" ${s.simArea ? "" : "disabled"}>${icon("battery-charging")} ${s.simArea ? t("sim_bat_btn", { mw: s.batMW }) : t("sim_choose")}</button>
        ${d.batteries.length ? `<p class="small muted" style="margin-top:12px">${t("sim_bat_placed")}</p>${d.batteries.map((b) => `<div class="bat-row">${icon("battery-charging", 16)}<span><b>${b.mw_flex} MW</b> · ${esc(ENGINE.area(b.area_id)?.name || "")}</span><button type="button" class="btn btn-quiet" data-unbat="${b.id}" aria-label="${t("sim_bat_remove")}">${icon("x", 14)}</button></div>`).join("")}` : ""}
        ${q.length ? `<h3 style="margin-top:18px">${t("sim_withdraw")}</h3>${q.filter((o) => !withdrawn(o)).map((o) => `<label style="display:flex;gap:8px;align-items:center;font-size:13px;padding:4px 0"><input type="checkbox" data-cancel="${o.id}" ${d.cancelled.includes(o.id) ? "checked" : ""}> ${esc(title(o))}, ${ENGINE.oMW(o)} MW${askedWithdraw(o) ? ` ${pill("s-investigate", t("cancel_pending"))}` : ""}</label>`).join("")}` : ""}`;
      right.innerHTML = `<h2>${t("effect")}</h2><p class="small muted">${t("now")} → ${t("after")}</p>
        <div class="compare">${["proceeds", "delayed", "not_possible"].map((k, i) => `<div><b>${D.before[i]} → ${D.after[i]}</b><span>${t(k)}</span></div>`).join("")}</div>
        ${D.out.length ? D.out.map((c) => `<div class="change"><b>${esc(title(c.o) || c.id)}</b> ${c.o?.mine ? pill("s-neutral", t("role_customer")) : ""}<br>
          <span class="from">${c.from ? ENGINE.estRange(c.from) : "–"}</span> <span class="to">${c.to ? ENGINE.estRange(c.to) : "–"}</span> ${c.to ? pill(STATUS_CLASS[c.to.status], t(c.to.status)) : ""}
          <span class="why">${reasonText(c.reason)}</span></div>`).join("") : `<div class="empty" style="margin-top:12px">${t("no_change")}</div>`}
        <p style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="s-apply" ${D.out.length ? "" : "disabled"}>${icon("bell")} ${t("confirm")}</button>
        <button class="btn btn-quiet" id="s-reset">${icon("undo-2")} ${t("reset")}</button></p>
        ${this.projects(sim)}`;
      right.querySelectorAll("[data-scope]").forEach((b) => (b.onclick = () => { this.scope = b.dataset.scope; draw(); }));
      right.querySelectorAll("[data-proj]").forEach((b) => (b.onclick = () => { s.simArea = b.dataset.proj; this.scope = "area"; draw(); }));
      left.querySelectorAll("#s-dir button").forEach((b) => (b.onclick = () => { s.dir = b.dataset.d; draw(); }));
      left.querySelector("#s-yr").oninput = (e) => { s.year = +e.target.value; left.querySelector("#s-yv").textContent = s.year; };
      left.querySelector("#s-yr").onchange = () => draw();
      left.querySelectorAll("[data-up]").forEach((i) => (i.onchange = () => {
        const id = i.dataset.up, off = i.value === "off";
        d.removedUpgrades = off ? [...OFF.filter((x) => x !== id), id] : OFF.filter((x) => x !== id);
        if (!off) d.upgradeYears = { ...d.upgradeYears, [id]: +i.value };
        draw();
      }));
      left.querySelectorAll("[data-unpick]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.unpick;
        this.picked = this.picked.filter((x) => x !== id);
        d.newUpgrades = NEW.filter((x) => x.id !== id);
        draw();
      }));
      left.querySelector("#s-pick")?.addEventListener("change", (e) => { if (e.target.value) { this.picked = [...this.picked, e.target.value]; draw(); } });
      const details = left.querySelector(".new-upg");
      details.ontoggle = () => (this.newOpen = details.open);
      left.querySelector("#s-nk").onchange = (e) => { this.newKind = e.target.value; this.newMW = null; left.querySelector("#s-nmw").value = KIND_MW[this.newKind]; };
      left.querySelector("#s-nmw").onchange = (e) => (this.newMW = Math.max(1, Math.min(300, Math.round(+e.target.value) || KIND_MW[this.newKind])));
      left.querySelector("#s-ny").onchange = (e) => (this.newYear = +e.target.value);
      left.querySelector("#s-new").onclick = () => {
        const f = STORE.data.areas.features.find((x) => x.properties.id === s.simArea); if (!f) return;
        const st = stationFor(s.simArea), c = st ? { lat: st.lat + 0.014, lng: st.lon + 0.02 } : L.geoJSON(f).getBounds().getCenter();
        const mw = this.newMW ?? KIND_MW[this.newKind], y = this.newYear ?? 2030, nm = f.properties.name;
        d.newUpgrades = [...NEW, { id: "n-" + Date.now(), is_new: true, area_id: s.simArea, kind: this.newKind,
          title_nl: `${nm}: ${TEXT.nl["k_" + this.newKind].toLowerCase()} (nieuw)`, title_en: `${nm}: ${TEXT.en["k_" + this.newKind].toLowerCase()} (new)`,
          year_desired: y, year_feasible: y, year_latest: y, lead_years: 4, mw_added_offtake: mw, mw_added_feed_in: mw,
          lat: c.lat, lon: c.lng, infra_status: "planned", source_document: "Simulator" }];
        this.newMW = null; draw();
      };
      const setMW = (v) => { s.batMW = Math.max(1, Math.min(200, Math.round(+v) || 20)); draw(); };
      left.querySelectorAll("#s-mw-pre button").forEach((b) => (b.onclick = () => setMW(b.dataset.mw)));
      left.querySelector("#s-mw").onchange = (e) => setMW(e.target.value);
      left.querySelectorAll("[data-unbat]").forEach((b) => (b.onclick = () => { s.draft.batteries = s.draft.batteries.filter((x) => x.id !== b.dataset.unbat); draw(); }));
      left.querySelector("#s-area").onchange = (e) => { s.simArea = e.target.value || null; this.scope = s.simArea ? "area" : "all"; draw(); };
      left.querySelector("#s-bat").onclick = () => {
        const f = STORE.data.areas.features.find((x) => x.properties.id === s.simArea); if (!f) return;
        const c = L.geoJSON(f).getBounds().getCenter();
        const mw = Math.max(1, Math.min(200, Math.round(s.batMW) || 20));
        s.draft.batteries = [...s.draft.batteries, { id: "b-" + Date.now(), title_nl: `Netbatterij ${mw} MW`, title_en: `Grid battery ${mw} MW`, category: "battery",
          mw_offtake: 0, mw_feed_in: 0, mw_flex: mw, lat: c.lat, lon: c.lng, area_id: s.simArea, year_needed: 2027, maturity: "planned", priority: 1, request_seq: 5000 + s.draft.batteries.length }];
        draw();
      };
      left.querySelectorAll("[data-cancel]").forEach((i) => (i.onchange = () => {
        s.draft.cancelled = i.checked ? [...s.draft.cancelled, i.dataset.cancel] : s.draft.cancelled.filter((x) => x !== i.dataset.cancel); draw(); }));
      right.querySelector("#s-apply").onclick = () => {
        const gone = s.draft.cancelled.filter((id) => !s.applied.cancelled.includes(id));
        gone.forEach(markWithdrawn);
        const n = applyDecision(s.draft, gone); toast(t(n === 1 ? "informed1" : n ? "informed" : "informed0", { n })); draw();
      };
      right.querySelector("#s-reset").onclick = () => { s.draft = JSON.parse(JSON.stringify(s.applied)); draw(); };
    };
    draw();
    return () => { clearTimeout(fit); map.remove(); };
  },
};

// =====================================================================================  ABOUT
const AboutPage = {
  html() {
    return `<div class="page"><div class="prose">
      <h1>${t("about_title")}</h1><p style="margin-top:12px">${t("about_p1")}</p>
      <h2>${t("how_title")}</h2>
      <section class="how" style="grid-template-columns:repeat(2,1fr);margin-top:0">${[1, 2, 3, 4].map((n) => `<div><span class="n">${n}</span><h3>${t(`how${n}_t`)}</h3><p>${t(`how${n}_p`)}</p></div>`).join("")}</section>
      <h2>${t("about_h_data")}</h2>
      <table class="src"><thead><tr><th>${t("th_what")}</th><th>${t("th_status")}</th><th>${t("th_source")}</th></tr></thead><tbody>
        ${t("src_rows").map(([w, k, src]) => `<tr><td>${w}</td><td class="${k === "real" ? "tag-real" : "tag-demo"}">${k === "real" ? t("real") : t("demo_word")}</td><td>${src}</td></tr>`).join("")}
      </tbody></table>
      <h2>${t("about_h_method")}</h2><p>${t("about_method")}</p>
      <h2>${t("about_h_limits")}</h2><p>${t("about_limits")}</p>
      <p style="margin-top:28px"><button class="btn btn-quiet" id="reset">${icon("undo-2")} ${t("reset_demo")}</button></p>
    </div></div>`;
  },
  mount(root) { root.querySelector("#reset").onclick = () => STORE.reset(); },
};
