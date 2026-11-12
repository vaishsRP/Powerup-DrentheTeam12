// Customer view: location check, application, project timeline, next step and nearby infrastructure.
// Renders the Locatiecheck and Plannen tabs. Reads ENGINE.* and APP.data; changes only via APP.setState().

(() => {
  const MATURITY = ["idea", "planned", "permit", "contracted"];
  const APP_STATUS = { idea: "app_idea", planned: "app_planned", permit: "app_permit", contracted: "app_contracted" };
  const NEXT_STEP = { idea: "next_idea", planned: "next_planned", permit: "next_permit", contracted: "next_contracted" };

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const haversine = (lat1, lon1, lat2, lon2) => {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const slug = (name) => name.replace(/^\d+ kV /, "").toLowerCase().replace(/ /g, "-");
  const fmtEstimate = (e) => {
    if (e.earliest === null) return t("no_upgrade");
    if (e.onTime) return `${t("on_time")} (${e.earliest})`;
    return e.earliest === e.latest ? `${e.earliest}` : `${e.earliest}–${e.latest}`;
  };
  const planMW = (p) => Math.max(p.mw_offtake || 0, p.mw_feed_in || 0);
  const planDir = (p) => (p.mw_feed_in > p.mw_offtake ? "teruglevering" : "afname");
  const dirLabel = (p) => (planDir(p) === "teruglevering" ? t("feed_in") : t("offtake"));

  const stationCache = new Map();
  const cableCache = new Map();

  function nearestStation(plan) {
    if (stationCache.has(plan.id)) return stationCache.get(plan.id);
    let best = null;
    for (const st of APP.data.stations || []) {
      const distance = haversine(plan.lat, plan.lon, st.lat, st.lon);
      if (!best || distance < best.distance) best = { ...st, distance };
    }
    stationCache.set(plan.id, best);
    return best;
  }

  function nearestCable(plan) {
    if (cableCache.has(plan.id)) return cableCache.get(plan.id);
    let best = null;
    for (const feature of APP.data.cables?.features || []) {
      const paths =
        feature.geometry?.type === "LineString"
          ? [feature.geometry.coordinates]
          : feature.geometry?.coordinates || [];
      for (const path of paths) {
        for (const [lon, lat] of path) {
          if (Math.abs(lat - plan.lat) > 0.2 || Math.abs(lon - plan.lon) > 0.3) continue;
          const distance = haversine(plan.lat, plan.lon, lat, lon);
          if (!best || distance < best.distance) best = { feature, distance };
        }
      }
    }
    const result = best && best.distance <= 25 ? best : null;
    cableCache.set(plan.id, result);
    return result;
  }

  function constructionNear(lat, lon) {
    return (APP.data.construction?.features || []).some((feature) => {
      const [clon, clat] = feature.geometry?.coordinates || [];
      return clat != null && haversine(lat, lon, clat, clon) < 1;
    });
  }

  function upgradePhase(upgrade, state) {
    if (upgrade.phase === "study") return t("phase_study");
    if (upgrade.phase === "commissioned") return t("phase_commissioned");
    return upgrade.phase || "—";
  }

  function upgradeRange(upgrade, state) {
    const year = ENGINE.upgradeYear(upgrade, state);
    const latest = Math.max(upgrade.year_latest ?? year, year);
    return year === latest ? `${year}` : `${year}–${latest}`;
  }

  function upgradeStatus(upgrade, state) {
    const year = ENGINE.upgradeYear(upgrade, state);
    if (year <= state.year) return { label: t("operational"), cls: "cust-ok" };
    if (upgrade.phase === "study") return { label: t("in_study"), cls: "cust-warn" };
    const space = (upgrade[`space_${state.lang}`] || "").toLowerCase();
    if (space.includes("aanbouw") || space.includes("construction")) {
      return { label: t("under_construction"), cls: "cust-warn" };
    }
    return { label: t("planned"), cls: "cust-info" };
  }

  function stationStatus(station) {
    return constructionNear(station.lat, station.lon) ? t("under_construction") : t("operational");
  }

  function cableStatus(feature) {
    const status = feature.properties?.STATUS === "In service" ? t("operational") : feature.properties?.STATUS || "—";
    return `${t("installed_underground")} · ${status}`;
  }

  function infraRow(kind, title, meta, detail, status, relevance, blocking = false) {
    return `<div class="cust-infra-row${blocking ? " cust-blocking" : ""}">
      <div class="cust-infra-top">
        <strong>${esc(title)}</strong>
        <span class="cust-kind">${kind}</span>
      </div>
      <div class="cust-sub">${esc(detail)}${meta ? ` · ${esc(meta)}` : ""}</div>
      <div class="cust-infra-status">${status}</div>
      <div class="cust-tbc">${relevance}</div>
    </div>`;
  }

  function renderInfrastructure(plan, area, state) {
    const estimate = ENGINE.connectionEstimate(plan.id, state);
    const station = nearestStation(plan);
    const cable = nearestCable(plan);
    const blockingId = estimate.blockingUpgradeId;
    const upgrades = ENGINE.upgradesIn(area.id).sort((a, b) => {
      if (a.id === blockingId) return -1;
      if (b.id === blockingId) return 1;
      return ENGINE.upgradeYear(a, state) - ENGINE.upgradeYear(b, state);
    });

    const stationRelevant =
      station && (slug(station.name) === area.id || station.name.toLowerCase().includes(area.name.toLowerCase()));
    const rows = [];

    if (station) {
      rows.push(
        infraRow(
          t("substation"),
          station.name.replace(/^\d+ kV /, ""),
          `${station.distance.toFixed(1)} ${t("distance_km")}`,
          `${(station.voltages_kv || []).join(" / ")} kV · ${station.operator || "TenneT"}`,
          stationStatus(station),
          stationRelevant ? t("relevant_for_area") : t("tbc_grid_operator")
        )
      );
    } else {
      rows.push(`<p class="muted">${t("no_substation_data")}</p>`);
    }

    if (cable) {
      const props = cable.feature.properties || {};
      rows.push(
        infraRow(
          t("cable"),
          `${t("cable")} ${props.NETSCHAKELID || ""}`,
          `${cable.distance.toFixed(1)} ${t("distance_km")}`,
          `${props.SPANNINGSNIVEAU || ""}`,
          cableStatus(cable.feature),
          t("tbc_grid_operator")
        )
      );
    } else {
      rows.push(`<p class="muted">${t("no_cable_data")}</p>`);
    }

    for (const upgrade of upgrades) {
      const blocking = upgrade.id === blockingId;
      const status = upgradeStatus(upgrade, state);
      const delay = ENGINE.upgradeYear(upgrade, state) - upgrade.year_desired;
      rows.push(
        infraRow(
          t("grid_upgrade"),
          upgrade[`title_${state.lang}`] || upgrade.title_nl,
          `${t("likely_range")} ${upgradeRange(upgrade, state)}${delay > 0 ? ` · ${t("delayed")} +${delay} ${t("years")}` : ""}`,
          `${t("phase")}: ${upgradePhase(upgrade, state)}`,
          status.label,
          blocking ? t("directly_affects") : `${t("may_affect")} · ${t("tbc_grid_operator")}`,
          blocking
        )
      );
    }

    return `<h3>${t("infrastructure_near")}</h3><div class="cust-infra">${rows.join("")}</div>`;
  }

  function renderTimeline(plan, estimate, state) {
    const index = MATURITY.indexOf(plan.maturity);
    const connectionDone = estimate.earliest !== null && estimate.earliest <= state.year;
    const steps = [
      {
        key: "tl_registered",
        state: index > 0 ? "done" : "now",
        meta: plan.updated_at || "",
      },
      {
        key: "tl_grid_study",
        state: index > 1 ? "done" : index === 1 ? "now" : "future",
        meta: index === 1 ? t("now") : "",
      },
      {
        key: "tl_permit",
        state: index > 2 ? "done" : index === 2 ? "now" : "future",
        meta: index === 2 ? t("now") : "",
      },
      {
        key: "tl_contract",
        state: index > 3 ? "done" : index === 3 ? "now" : "future",
        meta: index === 3 ? t("now") : "",
      },
      {
        key: "tl_connection",
        state: connectionDone ? "done" : "future",
        meta:
          estimate.earliest === null
            ? t("no_upgrade")
            : `${estimate.earliest}${estimate.latest !== estimate.earliest ? `–${estimate.latest}` : ""}`,
      },
    ];

    return `<h3>${t("project_timeline")}</h3><ol class="cust-timeline">${steps
      .map(
        (step) =>
          `<li class="${step.state}"><span class="cust-step-dot"></span><strong>${t(step.key)}</strong>${step.meta ? `<span class="cust-step-meta">${esc(step.meta)}</span>` : ""}</li>`
      )
      .join("")}</ol>`;
  }

  function renderApplication(plan, area, state) {
    const estimate = ENGINE.connectionEstimate(plan.id, state);
    const blocking = estimate.blockingUpgradeId
      ? APP.data.upgrades.find((u) => u.id === estimate.blockingUpgradeId)
      : null;

    return `<div class="cust-app">
        <div class="cust-k">${t("application_status")}</div>
        <div class="cust-app-top">
          <strong>${esc(plan[`title_${state.lang}`] || plan.title_nl)}</strong>
          <span class="cust-chip">${t(APP_STATUS[plan.maturity])}</span>
        </div>
        <div class="cust-sub">${esc(plan.municipality)} · ${Math.round(planMW(plan))} MW ${dirLabel(plan)} · ${t("capacity_needed")} ${plan.year_needed}</div>
      </div>
      <div class="cust-estimate">
        <div class="cust-k">${t("expected_connection")}</div>
        <div class="cust-big">${fmtEstimate(estimate)}</div>
        ${
          blocking
            ? `<div class="cust-sub">${t("reason_waiting")}: ${esc(blocking[`title_${state.lang}`] || blocking.title_nl)} (${upgradeRange(blocking, state)})</div>`
            : estimate.earliest === null
            ? `<div class="cust-sub">${t("no_upgrades")}</div>`
            : `<div class="cust-sub">${t("no_blocking_upgrade")}</div>`
        }
      </div>
      <div class="cust-next">
        <div class="cust-k">${t("next_step")}</div>
        <div>${t(NEXT_STEP[plan.maturity])}</div>
      </div>
      ${renderTimeline(plan, estimate, state)}
      ${renderInfrastructure(plan, area, state)}`;
  }

  function renderAreaStatus(area, state) {
    const off = ENGINE.areaStatus(area.id, state, state.year, "afname");
    const fin = ENGINE.areaStatus(area.id, state, state.year, "teruglevering");
    return `<div class="tiles">
      <div class="tile"><div class="muted">${t("offtake")} ${state.year}</div><div class="v status-${off.status}">${t(off.status)}</div></div>
      <div class="tile"><div class="muted">${t("feed_in")} ${state.year}</div><div class="v status-${fin.status}">${t(fin.status)}</div></div>
    </div>`;
  }

  function renderPicker(area, state) {
    const plans = area ? ENGINE.plansIn(area.id) : APP.data.plans;
    if (!plans.length) return `<p class="muted">${t("no_plans")}</p>`;
    return `<h3>${t("plans")}</h3><div class="cust-plan-list">${plans
      .map((plan) => {
        const estimate = ENGINE.connectionEstimate(plan.id, state);
        return `<button class="cust-plan-pick" data-pick="${plan.id}">
          <span><strong>${esc(plan[`title_${state.lang}`] || plan.title_nl)}</strong><span class="cust-sub">${esc(plan.municipality)} · ${Math.round(planMW(plan))} MW</span></span>
          <span class="cust-pick-est">${fmtEstimate(estimate)}</span>
        </button>`;
      })
      .join("")}</div>`;
  }

  function renderLocation() {
    const el = document.getElementById("tab-location");
    const state = APP.state;

    if (!state.selectedAreaId) {
      el.innerHTML = `<p class="muted">${t("pick_area")}</p><p class="muted">${t("select_project")}</p>${renderPicker(null, state)}
        <p class="muted">${t("source_years")} · ${t("demo_badge")}</p>`;
      bindPickers(el);
      return;
    }

    const area = ENGINE.area(state.selectedAreaId);
    if (!area) {
      el.innerHTML = `<p class="muted">${t("pick_area")}</p>`;
      return;
    }

    const plan = state.selectedPlanId
      ? APP.data.plans.find((p) => p.id === state.selectedPlanId)
      : null;

    el.innerHTML = `<div class="cust-area-head">
        <h2>${esc(area.name)}</h2>
        <div class="cust-sub">${esc(area.station || "")} · ${t("area_approx")}</div>
      </div>
      ${renderAreaStatus(area, state)}
      ${
        plan
          ? renderApplication(plan, area, state)
          : `<p class="muted">${t("select_project")}</p>${renderPicker(area, state)}`
      }
      <p class="muted">${t("source_years")} · ${t("demo_badge")}</p>`;

    bindPickers(el);
  }

  function bindPickers(el) {
    el.querySelectorAll("[data-pick]").forEach((button) =>
      button.addEventListener("click", () => {
        const plan = APP.data.plans.find((p) => p.id === button.dataset.pick);
        if (plan) APP.setState({ selectedAreaId: plan.area_id, selectedPlanId: plan.id });
      })
    );
  }

  function renderPlans() {
    const el = document.getElementById("tab-plans");
    const state = APP.state;
    const list = state.selectedAreaId ? ENGINE.plansIn(state.selectedAreaId) : APP.data.plans;
    el.innerHTML =
      list
        .map((plan) => {
          const estimate = ENGINE.connectionEstimate(plan.id, state);
          return `<div class="card ${plan.id === state.selectedPlanId ? "selected" : ""}" data-id="${plan.id}">
        <strong>${esc(plan[`title_${state.lang}`] || plan.title_nl)}</strong>
        <span class="muted">${esc(plan.municipality)} · ${t(`maturity_${plan.maturity}`)} · ${Math.round(planMW(plan))} MW</span><br>
        ${t("expected_connection")}: <strong>${fmtEstimate(estimate)}</strong></div>`;
        })
        .join("") + `<p class="muted">${t("demo_badge")}</p>`;

    el.querySelectorAll(".card").forEach((card) =>
      card.addEventListener("click", () => {
        const plan = APP.data.plans.find((p) => p.id === card.dataset.id);
        if (plan) APP.setState({ selectedPlanId: plan.id, selectedAreaId: plan.area_id, tab: "location" });
      })
    );
  }

  // Open the customer map with a representative project, so the panel is useful on first load.
  document.addEventListener("dataready", () => {
    if (!APP.state.selectedPlanId && APP.data.plans.length) {
      const plan = APP.data.plans[0];
      APP.setState({ selectedAreaId: plan.area_id, selectedPlanId: plan.id });
    }
  });

  document.addEventListener("statechange", () => {
    if (!APP.data) return;
    renderLocation();
    renderPlans();
  });
})();
