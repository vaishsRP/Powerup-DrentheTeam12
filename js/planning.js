// Planning view: region overview + area detail.
// Renders the Belasting tab. Reads ENGINE.* and APP.data; changes things only via APP.setState().
// Owner: planning view. CSS lives in the marked block at the end of css/style.css.

(() => {
  const COLORS = {
    navy: "#003584",
    orange: "#FF6428",
    room: "#33A92F",
    limited: "#FAC850",
    bottleneck: "#FF6428",
  };
  const START = 2026;
  const END = 2035;

  let chart = null;

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  const clean = (value) => String(value ?? "").replace(/🔎/g, "").trim();

  const DIR_KEY = (dir) => (dir === "teruglevering" ? "feed_in" : "offtake");
  const MW_KEY = (dir) => (dir === "teruglevering" ? "mw_feed_in" : "mw_offtake");

  const tile = (value, label, sub = "") => `<div class="pv-tile">
      <div class="pv-k">${label}</div>
      <div class="pv-v">${value}</div>
      ${sub ? `<div class="pv-u">${sub}</div>` : ""}
    </div>`;

  // First year the area is a bottleneck (> 100%), within the app horizon.
  function firstBottleneck(areaId, state, dir) {
    for (let year = START; year <= END; year++) {
      if (ENGINE.areaStatus(areaId, state, year, dir).status === "bottleneck") return year;
    }
    return null;
  }

  function delayFlag(upgrade, state) {
    const delay = ENGINE.upgradeYear(upgrade, state) - upgrade.year_desired;
    return { delay, flag: delay >= 2 ? "red" : delay === 1 ? "orange" : "none" };
  }

  // Same "at risk" rule as the map: a study project or a delay of two years or more.
  const isAtRisk = (upgrade, state) => delayFlag(upgrade, state).delay >= 2 || upgrade.phase === "study";

  function affectedPlans(areaId, upgrade, state, dir) {
    const key = MW_KEY(dir);
    const inService = ENGINE.upgradeYear(upgrade, state);
    return ENGINE.plansIn(areaId).filter(
      (plan) => plan.year_needed <= inService && (plan[key] || 0) > 0
    );
  }

  function scenarioRow(state) {
    return `<label class="pv-select">${t("scenario")}
      <select id="pv-scenario">
        <option value="contracted"${state.scenario === "contracted" ? " selected" : ""}>${t("scenario_contracted")}</option>
        <option value="expected"${state.scenario === "expected" ? " selected" : ""}>${t("scenario_expected")}</option>
        <option value="everything"${state.scenario === "everything" ? " selected" : ""}>${t("scenario_everything")}</option>
      </select>
    </label>`;
  }

  function layerControls(state) {
    const layers = state.layers || {};
    const rows = [
      ["substations", "layer_substations"],
      ["cables", "layer_cables"],
      ["upgrades", "layer_upgrades"],
      ["plans", "layer_plans"],
    ];
    return `<details class="pv-layers" open>
      <summary>${t("map_layers")}</summary>
      <div class="pv-layer-grid">
        ${rows
          .map(
            ([key, label]) =>
              `<label class="pv-check"><input type="checkbox" data-layer="${key}" ${layers[key] !== false ? "checked" : ""}> ${t(label)}</label>`
          )
          .join("")}
      </div>
    </details>`;
  }

  function yearStrip(areaId, state, dir) {
    let cells = "";
    for (let year = START; year <= END; year++) {
      const st = ENGINE.areaStatus(areaId, state, year, dir);
      const active = year === state.year ? " active" : "";
      cells += `<button class="pv-year status-${st.status}${active}" data-year="${year}" title="${year}: ${Math.round(st.ratio * 100)}%">${year}</button>`;
    }
    return `<div class="pv-yearstrip">${cells}</div>`;
  }

  function decisionCard(deadline) {
    if (!deadline.needed) {
      return `<div class="pv-decision pv-ok">
        <div class="pv-decision-title">${t("decision")}</div>
        <div class="muted">${t("decision_none")}</div>
      </div>`;
    }

    return `<div class="pv-decision ${deadline.tooLate ? "pv-danger" : "pv-warn"}">
      <div class="pv-decision-title">${t("decision")}</div>
      <div class="pv-chain">
        <span>${t("needed_in")} <strong>${deadline.firstBottleneck}</strong></span>
        <span>${t("investment_plan")} <strong>${deadline.investmentPlanYear}</strong></span>
        <span>${t("pmiek")} <strong>${deadline.pmiekYear}</strong></span>
      </div>
      <div class="pv-decision-text">${deadline.tooLate ? t("too_late_measures") : `${t("decision_by")} ${deadline.pmiekYear}.`}</div>
      <div class="muted">${t("who_decides")}</div>
      <button class="pv-btn pv-btn-small" data-measures>${t("test_measures")}</button>
    </div>`;
  }

  function upgradeCard(upgrade, state, dir) {
    const inService = ENGINE.upgradeYear(upgrade, state);
    const latest = Math.max(upgrade.year_latest ?? inService, inService);
    const flag = delayFlag(upgrade, state);
    const atRisk = isAtRisk(upgrade, state);
    const added = upgrade[`mw_added_${DIR_KEY(dir)}`] || 0;
    const affected = affectedPlans(upgrade.area_id, upgrade, state, dir);
    const status = inService <= state.year ? t("in_service") : atRisk ? t("at_risk") : t("planned");
    const statusClass = inService <= state.year ? "pv-ok" : atRisk ? "pv-red" : "pv-orange";
    const flagText =
      flag.delay > 0
        ? `+${flag.delay} ${t("years")}`
        : flag.delay < 0
        ? t("accelerated")
        : t("on_schedule");
    const phase =
      upgrade.phase === "study"
        ? t("phase_study")
        : upgrade.phase === "commissioned"
        ? t("phase_commissioned")
        : (upgrade.phase || "—");
    const range = inService === latest ? `${inService}` : `${inService}–${latest}`;
    const affectedText = affected.length
      ? affected.length === 1
        ? `1 ${t("plan_waiting")}`
        : `${affected.length} ${t("plans_waiting")}`
      : "";
    const affectedNames = affected
      .slice(0, 3)
      .map((plan) => esc(plan[`title_${state.lang}`] || plan.title_nl))
      .join(", ");
    const tail = [
      added ? `+${added} MW ${dir === "teruglevering" ? t("feed_in") : t("offtake")}` : "",
      affectedText,
    ].filter(Boolean).join(" · ");

    return `<div class="pv-upgrade">
      <div class="pv-upgrade-top">
        <strong>${esc(upgrade[`title_${state.lang}`] || upgrade.title_nl)}</strong>
        <span class="${statusClass}">${status}</span>
      </div>
      <div class="pv-sub">${esc(upgrade.operator || "")} · ${t("phase")}: ${phase} · ${t("lead")} ${upgrade.lead_years} ${t("years")}</div>
      <div class="pv-sub">${t("desired")} ${upgrade.year_desired} → ${t("feasible")} ${inService} · ${t("likely_range")} ${range} · <span class="pv-flag-${flag.flag}">${flagText}</span></div>
      ${upgrade[`space_${state.lang}`] ? `<div class="pv-sub">${t("space_permit")}: ${esc(clean(upgrade[`space_${state.lang}`]))}</div>` : ""}
      ${upgrade[`risk_${state.lang}`] ? `<div class="pv-sub">${t("risk")}: ${esc(clean(upgrade[`risk_${state.lang}`]))}</div>` : ""}
      <div class="pv-slider-row">
        <input type="range" min="${Math.min(upgrade.year_desired, END)}" max="${END}" value="${inService}" data-up="${upgrade.id}">
        <strong>${inService}</strong>
      </div>
      ${tail ? `<div class="pv-sub">${tail}</div>` : ""}
      ${affectedNames ? `<div class="pv-sub">${t("affected_projects")}: ${affectedNames}${affected.length > 3 ? "…" : ""}</div>` : ""}
    </div>`;
  }

  function planRow(plan, state, dir) {
    const estimate = ENGINE.connectionEstimate(plan.id, state);
    const mw = plan[MW_KEY(dir)] || 0;
    const estimateText =
      estimate.earliest === null
        ? t("no_upgrade")
        : estimate.earliest === estimate.latest
        ? `${estimate.earliest}`
        : `${estimate.earliest}–${estimate.latest}`;

    return `<div class="pv-plan" data-plan="${plan.id}">
      <div class="pv-plan-top">
        <strong>${esc(plan[`title_${state.lang}`] || plan.title_nl)}</strong>
        <span class="pv-mw">${Math.round(mw)} MW</span>
      </div>
      <div class="pv-sub">${t(`maturity_${plan.maturity}`)} · ${t("plan_needs")} ${plan.year_needed} · ${t("plan_estimate")} ${estimateText}</div>
      <button class="pv-link" data-customer="${plan.id}">${t("view_customer")}</button>
    </div>`;
  }

  function areaCard(row, state) {
    const pct = Math.round(row.st.ratio * 100);
    const gap = row.st.capacity - row.st.load;
    const gapText =
      gap < 0
        ? `${t("shortfall")} ${Math.abs(Math.round(gap))} MW`
        : `${t("headroom")} ${Math.round(gap)} MW`;
    const maxDelay = row.delayed.reduce((max, item) => Math.max(max, item.delay), 0);
    const atRisk = row.delayed.some((item) => item.atRisk);
    const delayText =
      maxDelay > 0
        ? `${t("delayed")} +${maxDelay} ${t("years")}`
        : atRisk
        ? t("at_risk")
        : t("on_schedule");
    const flagClass = row.delayed.some((item) => item.flag === "red" || item.atRisk)
      ? "pv-red"
      : row.delayed.length
      ? "pv-orange"
      : "pv-ok";
    const deadlineHtml = row.deadline.needed
      ? row.deadline.tooLate
        ? `<span class="pv-red">${t("too_late_short")}</span>`
        : `${t("feb")} ${row.deadline.pmiekYear}`
      : "—";

    return `<button class="pv-area-card" data-area="${row.area.id}">
      <div class="pv-area-top">
        <strong>${esc(row.area.name)}</strong>
        <span class="pv-chip status-${row.st.status}">${t(row.st.status)}</span>
      </div>
      <div class="pv-area-meta">${pct}% in ${state.year} · ${gapText} · <span class="${flagClass}">${delayText}</span></div>
      <div class="pv-area-deadline">${t("decision")}: ${deadlineHtml}${row.first ? ` · ${t("first_bottleneck")} ${row.first}` : ""}</div>
    </button>`;
  }

  function renderRegion(el, state) {
    const dir = state.direction;
    const rows = APP.data.areas.features
      .map((feature) => {
        const area = feature.properties;
        const st = ENGINE.areaStatus(area.id, state, state.year, dir);
        const first = firstBottleneck(area.id, state, dir);
        const deadline = ENGINE.decisionDeadline(area.id, state, dir);
        const delayed = ENGINE.upgradesIn(area.id)
          .map((upgrade) => ({ upgrade, ...delayFlag(upgrade, state), atRisk: isAtRisk(upgrade, state) }))
          .filter((item) => item.delay >= 1 || item.atRisk);
        return { area, st, first, deadline, delayed };
      })
      .sort((a, b) => (a.first ?? 9999) - (b.first ?? 9999) || a.area.name.localeCompare(b.area.name));

    const bottlenecks = rows.filter((row) => row.st.status === "bottleneck").length;
    const delayedCount = APP.data.upgrades.filter((upgrade) => isAtRisk(upgrade, state)).length;
    const decisionYears = rows
      .map((row) => row.deadline)
      .filter((deadline) => deadline.needed)
      .map((deadline) => deadline.pmiekYear);
    const firstDecision = decisionYears.length ? Math.min(...decisionYears) : null;
    const firstDecisionText =
      firstDecision === null
        ? "—"
        : firstDecision < 2027
        ? `<span class="pv-red">${t("too_late_short")}</span>`
        : `${t("feb")} ${firstDecision}`;

    el.innerHTML = `<div class="pv-head"><h2>${t("region_title")}</h2></div>
      ${scenarioRow(state)}
      ${layerControls(state)}
      <div class="pv-tiles">
        ${tile(`${bottlenecks} / ${rows.length}`, t("summary_bottlenecks"), `${state.year}`)}
        ${tile(`${delayedCount}`, t("summary_delayed"))}
        ${tile(`${APP.data.plans.length}`, t("summary_plans"))}
        ${tile(firstDecisionText, t("summary_decision"))}
      </div>
      <div class="pv-section-title">${t("region_sub")}</div>
      <div class="pv-area-list">${rows.map((row) => areaCard(row, state)).join("")}</div>
      <p class="muted">${t("footer")}</p>`;

    document.getElementById("pv-scenario")?.addEventListener("change", (event) =>
      APP.setState({ scenario: event.target.value })
    );
    el.querySelectorAll("input[data-layer]").forEach((input) =>
      input.addEventListener("change", () =>
        APP.setState({ layers: { ...(state.layers || {}), [input.dataset.layer]: input.checked } })
      )
    );
    el.querySelectorAll("[data-area]").forEach((button) =>
      button.addEventListener("click", () =>
        APP.setState({ selectedAreaId: button.dataset.area, selectedPlanId: null })
      )
    );
  }

  function renderArea(el, state) {
    const area = ENGINE.area(state.selectedAreaId);
    if (!area) {
      renderRegion(el, state);
      return;
    }

    const dir = state.direction;
    const st = ENGINE.areaStatus(area.id, state, state.year, dir);
    const first = firstBottleneck(area.id, state, dir);
    const deadline = ENGINE.decisionDeadline(area.id, state, dir);
    const gap = st.capacity - st.load;
    const mwKey = MW_KEY(dir);

    const activePlans = ENGINE.plansIn(area.id).filter(
      (plan) => plan.year_needed <= state.year && (plan[mwKey] || 0) > 0
    );
    const flex = activePlans.reduce((sum, plan) => sum + (plan.mw_flex || 0), 0);
    const contracted = ENGINE.areaStatus(area.id, { ...state, scenario: "contracted" }, state.year, dir).load;
    const everything = ENGINE.areaStatus(area.id, { ...state, scenario: "everything" }, state.year, dir).load;
    const showBand = Math.round(contracted) !== Math.round(everything);

    const upgrades = ENGINE.upgradesIn(area.id);
    const plans = ENGINE.plansIn(area.id)
      .filter((plan) => (plan[mwKey] || 0) > 0)
      .sort((a, b) => a.year_needed - b.year_needed);

    el.innerHTML = `<div class="pv-head">
        <button class="pv-back" id="pv-back">← ${t("back_region")}</button>
      </div>
      <h2 class="pv-area-title">${esc(area.name)} <span class="pv-chip status-${st.status}">${t(st.status)}</span></h2>
      <div class="pv-sub">${esc(area.station || "")} · ${t("area_approx")}</div>
      ${scenarioRow(state)}
      ${layerControls(state)}
      <div class="pv-tiles">
        ${tile(`${Math.round(st.load)} MW`, t("peak"), `${state.year}`)}
        ${tile(`${Math.round(st.capacity)} MW`, t("capacity"), `${state.year}`)}
        ${tile(`${gap < 0 ? "−" : "+"}${Math.abs(Math.round(gap))} MW`, gap < 0 ? t("shortfall") : t("headroom"))}
        ${tile(first ? `${first}` : "—", t("first_bottleneck"), first ? "" : t("none_until"))}
      </div>
      ${showBand ? `<div class="pv-band">${t("band")}: ${Math.round(contracted)}–${Math.round(everything)} MW</div>` : ""}
      ${flex > 0 ? `<div class="pv-flex">${t("flex")}: ${Math.round(flex)} MW · ${t("flex_after")}: ${Math.max(0, Math.round(st.load - flex))} MW</div>` : ""}
      ${yearStrip(area.id, state, dir)}
      <div class="pv-chart"><canvas id="pv-chart-years"></canvas></div>
      ${decisionCard(deadline)}
      <h3 class="pv-section-title">${t("upgrades")}</h3>
      <div class="pv-upgrades">${
        upgrades.length
          ? upgrades.map((upgrade) => upgradeCard(upgrade, state, dir)).join("")
          : `<p class="muted">${t("no_upgrades")}</p>`
      }</div>
      ${Object.keys(state.upgradeYears).length ? `<button class="pv-btn" id="pv-reset">${t("reset_delays")}</button>` : ""}
      <h3 class="pv-section-title">${t("plans")} (${plans.length})</h3>
      <div class="pv-plans">${
        plans.length
          ? plans.map((plan) => planRow(plan, state, dir)).join("")
          : `<p class="muted">${t("no_plans")}</p>`
      }</div>
      <p class="muted">${t("footer")}</p>`;

    document.getElementById("pv-back").addEventListener("click", () =>
      APP.setState({ selectedAreaId: null, selectedPlanId: null })
    );
    document.getElementById("pv-scenario")?.addEventListener("change", (event) =>
      APP.setState({ scenario: event.target.value })
    );
    el.querySelectorAll("input[data-layer]").forEach((input) =>
      input.addEventListener("change", () =>
        APP.setState({ layers: { ...(state.layers || {}), [input.dataset.layer]: input.checked } })
      )
    );
    el.querySelectorAll("[data-year]").forEach((button) =>
      button.addEventListener("click", () => APP.setState({ year: +button.dataset.year }))
    );
    el.querySelectorAll("input[data-up]").forEach((input) =>
      input.addEventListener("change", () =>
        APP.setState({
          upgradeYears: { ...state.upgradeYears, [input.dataset.up]: +input.value },
        })
      )
    );
    document.getElementById("pv-reset")?.addEventListener("click", () =>
      APP.setState({ upgradeYears: {} })
    );
    el.querySelectorAll("[data-plan]").forEach((row) =>
      row.addEventListener("click", () => APP.setState({ selectedPlanId: row.dataset.plan }))
    );
    el.querySelectorAll("[data-customer]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        APP.setState({ selectedPlanId: button.dataset.customer, tab: "location" });
      })
    );
    el.querySelectorAll("[data-measures]").forEach((button) =>
      button.addEventListener("click", () => APP.setState({ tab: "scenarios" }))
    );

    drawChart(area.id, state, dir);
  }

  function drawChart(areaId, state, dir) {
    const canvas = document.getElementById("pv-chart-years");
    if (!canvas) return;

    const data = ENGINE.loadByYear(areaId, state, dir, END);
    const pointColors = data.years.map((_, index) => {
      const ratio = data.capacity[index] ? data.load[index] / data.capacity[index] : 0;
      return ratio > 1 ? COLORS.bottleneck : ratio > 0.8 ? COLORS.limited : COLORS.room;
    });

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.years,
        datasets: [
          {
            label: t("peak"),
            data: data.load.map((value) => +value.toFixed(1)),
            borderColor: COLORS.navy,
            backgroundColor: COLORS.navy,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: 4,
            tension: 0.2,
          },
          {
            label: t("capacity"),
            data: data.capacity,
            borderColor: COLORS.orange,
            borderDash: [6, 4],
            stepped: true,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const load = data.load[index];
                const capacity = data.capacity[index];
                if (context.datasetIndex === 0) {
                  return `${t("peak")}: ${Math.round(load)} MW (${capacity ? Math.round((load / capacity) * 100) : 0}%)`;
                }
                return `${t("capacity")}: ${Math.round(capacity)} MW`;
              },
            },
          },
        },
        scales: {
          y: { title: { display: true, text: "MW" }, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    });
  }

  function render() {
    const el = document.getElementById("tab-load");
    if (!el) return;

    if (chart) {
      chart.destroy();
      chart = null;
    }

    if (!APP.state.selectedAreaId) renderRegion(el, APP.state);
    else renderArea(el, APP.state);
  }

  document.addEventListener("statechange", () => {
    if (APP.data) render();
  });
})();
