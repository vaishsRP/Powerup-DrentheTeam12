// Planning view: region overview + area detail.
// Renders the Belasting tab. Reads ENGINE.* and APP.data; changes things only via APP.setState().
// Owner: planning view. CSS lives in the marked block at the end of css/style.css.
//
// Temporary planning-view dictionary. The i18n owner can merge these keys into js/i18n.js
// before the feature freeze; keeping them here avoids editing a shared file while we build.

(() => {
  const PV = {
    nl: {
      region_title: "Regionale planning",
      region_sub: "Gebieden gesorteerd op eerste knelpuntjaar",
      scenario: "Scenario",
      scenario_contracted: "Alleen contracten",
      scenario_expected: "Verwacht",
      scenario_everything: "Alles",
      summary_bottlenecks: "knelpunten in",
      summary_delayed: "late netuitbreidingen",
      summary_plans: "plannen in het register",
      summary_decision: "eerste besluit",
      too_late: "Te laat",
      feb: "feb",
      decision: "Besluit",
      first_bottleneck: "Eerste knelpunt",
      shortfall: "tekort",
      headroom: "ruimte",
      delayed: "vertraagd",
      years: "jaar",
      on_schedule: "op schema",
      back_region: "Regio",
      area_approx: "gebiedsbenadering",
      peak: "Piek",
      capacity: "Netgrens",
      none_until: "Geen knelpunt t/m 2035",
      band: "Bandbreedte scenario's",
      flex: "Beschikbare flexibiliteit",
      flex_after: "piek na flex",
      upgrades: "Netuitbreidingen",
      no_upgrades: "Geen netuitbreiding gepland. Alleen maatregelen kunnen helpen.",
      reset_delays: "Reset scenariodata",
      plans: "Plannen",
      no_plans: "Nog geen plannen in dit gebied voor deze richting.",
      footer: "Demo · fictieve gegevens · Jaartallen: Enexis Investeringsplan 2026 · gebieden: benadering",
      needed_in: "Capaciteit nodig",
      investment_plan: "Investeringsplan jan",
      pmiek: "pMIEK feb",
      too_late_measures: "Te laat: alleen maatregelen helpen.",
      decision_by: "Besluit nodig vóór februari",
      who_decides: "Wie: provincie (pMIEK) · netbeheerder (investeringsplan) · gemeente (vergunning)",
      test_measures: "Test maatregelen",
      desired: "gewenst",
      feasible: "haalbaar",
      lead: "doorlooptijd",
      accelerated: "versneld",
      plans_waiting: "plannen wachten hierop",
      plan_waiting: "plan wacht hierop",
      plan_needs: "nodig",
      plan_estimate: "verwacht",
      view_customer: "Klantview",
      decision_none: "Geen besluit nodig t/m 2035",
      maturity_idea: "Idee",
      maturity_planned: "Gepland",
      maturity_permit: "Vergunning",
      maturity_contracted: "Contract",
    },
    en: {
      region_title: "Regional planning",
      region_sub: "Areas sorted by first bottleneck year",
      scenario: "Scenario",
      scenario_contracted: "Contracted only",
      scenario_expected: "Expected",
      scenario_everything: "Everything",
      summary_bottlenecks: "bottlenecks in",
      summary_delayed: "late grid upgrades",
      summary_plans: "plans in the register",
      summary_decision: "first decision",
      too_late: "Too late",
      feb: "Feb",
      decision: "Decision",
      first_bottleneck: "First bottleneck",
      shortfall: "shortfall",
      headroom: "headroom",
      delayed: "delayed",
      years: "yrs",
      on_schedule: "on schedule",
      back_region: "Region",
      area_approx: "station-area approximation",
      peak: "Peak",
      capacity: "Grid limit",
      none_until: "No bottleneck through 2035",
      band: "Scenario range",
      flex: "Available flexibility",
      flex_after: "peak after flex",
      upgrades: "Grid upgrades",
      no_upgrades: "No grid upgrade planned. Only measures can help.",
      reset_delays: "Reset scenario data",
      plans: "Plans",
      no_plans: "No plans in this area for this direction yet.",
      footer: "Demo · illustrative data · Years: Enexis Investment Plan 2026 · areas: approximation",
      needed_in: "Capacity needed",
      investment_plan: "Investment plan Jan",
      pmiek: "pMIEK Feb",
      too_late_measures: "Too late: only measures can help.",
      decision_by: "Decision needed before February",
      who_decides: "Who: province (pMIEK) · grid operator (investment plan) · municipality (permits)",
      test_measures: "Test measures",
      desired: "desired",
      feasible: "feasible",
      lead: "lead time",
      accelerated: "accelerated",
      plans_waiting: "plans wait for this",
      plan_waiting: "plan waits for this",
      plan_needs: "needed",
      plan_estimate: "expected",
      view_customer: "Customer view",
      decision_none: "No decision needed through 2035",
      maturity_idea: "Idea",
      maturity_planned: "Planned",
      maturity_permit: "Permit",
      maturity_contracted: "Contracted",
    },
  };

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

  const pt = (key) => PV[APP.state.lang]?.[key] ?? PV.nl[key] ?? key;

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

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

  // pMIEK -> investment plan -> in-service chain, for the direction being viewed.
  function deadlineFor(areaId, state, dir) {
    const first = firstBottleneck(areaId, state, dir);
    if (first === null) return { needed: false };

    const key = DIR_KEY(dir);
    const upgrades = ENGINE.upgradesIn(areaId).filter((u) => (u[`mw_added_${key}`] || 0) > 0);
    const lead = upgrades.length ? Math.max(...upgrades.map((u) => u.lead_years || 0)) : 4;
    const investmentPlanYear = first - lead;
    const pmiekYear = investmentPlanYear - 1;

    return {
      needed: true,
      firstBottleneck: first,
      leadYears: lead,
      investmentPlanYear,
      pmiekYear,
      tooLate: pmiekYear < 2027,
    };
  }

  function delayFlag(upgrade, state) {
    const delay = ENGINE.upgradeYear(upgrade, state) - upgrade.year_desired;
    return { delay, flag: delay >= 2 ? "red" : delay === 1 ? "orange" : "none" };
  }

  function affectedPlans(areaId, upgrade, state, dir) {
    const key = MW_KEY(dir);
    const inService = ENGINE.upgradeYear(upgrade, state);
    return ENGINE.plansIn(areaId).filter(
      (plan) => plan.year_needed <= inService && (plan[key] || 0) > 0
    );
  }

  function scenarioRow(state) {
    return `<label class="pv-select">${pt("scenario")}
      <select id="pv-scenario">
        <option value="contracted"${state.scenario === "contracted" ? " selected" : ""}>${pt("scenario_contracted")}</option>
        <option value="expected"${state.scenario === "expected" ? " selected" : ""}>${pt("scenario_expected")}</option>
        <option value="everything"${state.scenario === "everything" ? " selected" : ""}>${pt("scenario_everything")}</option>
      </select>
    </label>`;
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
        <div class="pv-decision-title">${pt("decision")}</div>
        <div class="muted">${pt("decision_none")}</div>
      </div>`;
    }

    return `<div class="pv-decision ${deadline.tooLate ? "pv-danger" : "pv-warn"}">
      <div class="pv-decision-title">${pt("decision")}</div>
      <div class="pv-chain">
        <span>${pt("needed_in")} <strong>${deadline.firstBottleneck}</strong></span>
        <span>${pt("investment_plan")} <strong>${deadline.investmentPlanYear}</strong></span>
        <span>${pt("pmiek")} <strong>${deadline.pmiekYear}</strong></span>
      </div>
      <div class="pv-decision-text">${deadline.tooLate ? pt("too_late_measures") : `${pt("decision_by")} ${deadline.pmiekYear}.`}</div>
      <div class="muted">${pt("who_decides")}</div>
      <button class="pv-btn pv-btn-small" data-measures>${pt("test_measures")}</button>
    </div>`;
  }

  function upgradeCard(upgrade, state, dir) {
    const inService = ENGINE.upgradeYear(upgrade, state);
    const flag = delayFlag(upgrade, state);
    const added = upgrade[`mw_added_${DIR_KEY(dir)}`] || 0;
    const affected = affectedPlans(upgrade.area_id, upgrade, state, dir);
    const flagText =
      flag.delay > 0
        ? `+${flag.delay} ${pt("years")}`
        : flag.delay < 0
        ? pt("accelerated")
        : pt("on_schedule");
    const affectedText = affected.length
      ? affected.length === 1
        ? `1 ${pt("plan_waiting")}`
        : `${affected.length} ${pt("plans_waiting")}`
      : "";
    const tail = [
      added ? `+${added} MW ${dir === "teruglevering" ? t("feed_in") : t("offtake")}` : "",
      affectedText,
    ].filter(Boolean).join(" · ");

    return `<div class="pv-upgrade">
      <div class="pv-upgrade-top">
        <strong>${esc(upgrade[`title_${state.lang}`] || upgrade.title_nl)}</strong>
        <span class="pv-flag-${flag.flag}">${flagText}</span>
      </div>
      <div class="pv-sub">${esc(upgrade.operator || "")} · ${pt("desired")} ${upgrade.year_desired} → ${pt("feasible")} ${upgrade.year_feasible} · ${pt("lead")} ${upgrade.lead_years} ${pt("years")}</div>
      <div class="pv-slider-row">
        <input type="range" min="${Math.min(upgrade.year_desired, END)}" max="${END}" value="${inService}" data-up="${upgrade.id}">
        <strong>${inService}</strong>
      </div>
      ${tail ? `<div class="pv-sub">${tail}</div>` : ""}
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
      <div class="pv-sub">${pt(`maturity_${plan.maturity}`)} · ${pt("plan_needs")} ${plan.year_needed} · ${pt("plan_estimate")} ${estimateText}</div>
      <button class="pv-link" data-customer="${plan.id}">${pt("view_customer")}</button>
    </div>`;
  }

  function areaCard(row, state) {
    const pct = Math.round(row.st.ratio * 100);
    const gap = row.st.capacity - row.st.load;
    const gapText =
      gap < 0
        ? `${pt("shortfall")} ${Math.abs(Math.round(gap))} MW`
        : `${pt("headroom")} ${Math.round(gap)} MW`;
    const maxDelay = row.delayed.reduce((max, item) => Math.max(max, item.delay), 0);
    const delayText = maxDelay > 0 ? `${pt("delayed")} +${maxDelay} ${pt("years")}` : pt("on_schedule");
    const flagClass = row.delayed.some((item) => item.flag === "red")
      ? "pv-red"
      : row.delayed.length
      ? "pv-orange"
      : "pv-ok";
    const deadlineHtml = row.deadline.needed
      ? row.deadline.tooLate
        ? `<span class="pv-red">${pt("too_late")}</span>`
        : `${pt("feb")} ${row.deadline.pmiekYear}`
      : "—";

    return `<button class="pv-area-card" data-area="${row.area.id}">
      <div class="pv-area-top">
        <strong>${esc(row.area.name)}</strong>
        <span class="pv-chip status-${row.st.status}">${t(row.st.status)}</span>
      </div>
      <div class="pv-area-meta">${pct}% in ${state.year} · ${gapText} · <span class="${flagClass}">${delayText}</span></div>
      <div class="pv-area-deadline">${pt("decision")}: ${deadlineHtml}${row.first ? ` · ${pt("first_bottleneck")} ${row.first}` : ""}</div>
    </button>`;
  }

  function renderRegion(el, state) {
    const dir = state.direction;
    const rows = APP.data.areas.features
      .map((feature) => {
        const area = feature.properties;
        const st = ENGINE.areaStatus(area.id, state, state.year, dir);
        const first = firstBottleneck(area.id, state, dir);
        const deadline = deadlineFor(area.id, state, dir);
        const delayed = ENGINE.upgradesIn(area.id)
          .map((upgrade) => ({ upgrade, ...delayFlag(upgrade, state) }))
          .filter((item) => item.delay >= 1);
        return { area, st, first, deadline, delayed };
      })
      .sort((a, b) => (a.first ?? 9999) - (b.first ?? 9999) || a.area.name.localeCompare(b.area.name));

    const bottlenecks = rows.filter((row) => row.st.status === "bottleneck").length;
    const delayedCount = ENGINE.delayFlags(state).filter((flag) => flag.delay >= 1).length;
    const decisionYears = rows
      .map((row) => row.deadline)
      .filter((deadline) => deadline.needed)
      .map((deadline) => deadline.pmiekYear);
    const firstDecision = decisionYears.length ? Math.min(...decisionYears) : null;
    const firstDecisionText =
      firstDecision === null
        ? "—"
        : firstDecision < 2027
        ? `<span class="pv-red">${pt("too_late")}</span>`
        : `${pt("feb")} ${firstDecision}`;

    el.innerHTML = `<div class="pv-head"><h2>${pt("region_title")}</h2></div>
      ${scenarioRow(state)}
      <div class="pv-tiles">
        ${tile(`${bottlenecks} / ${rows.length}`, pt("summary_bottlenecks"), `${state.year}`)}
        ${tile(`${delayedCount}`, pt("summary_delayed"))}
        ${tile(`${APP.data.plans.length}`, pt("summary_plans"))}
        ${tile(firstDecisionText, pt("summary_decision"))}
      </div>
      <div class="pv-section-title">${pt("region_sub")}</div>
      <div class="pv-area-list">${rows.map((row) => areaCard(row, state)).join("")}</div>
      <p class="muted">${pt("footer")}</p>`;

    document.getElementById("pv-scenario")?.addEventListener("change", (event) =>
      APP.setState({ scenario: event.target.value })
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
    const deadline = deadlineFor(area.id, state, dir);
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
        <button class="pv-back" id="pv-back">← ${pt("back_region")}</button>
      </div>
      <h2 class="pv-area-title">${esc(area.name)} <span class="pv-chip status-${st.status}">${t(st.status)}</span></h2>
      <div class="pv-sub">${esc(area.station || "")} · ${pt("area_approx")}</div>
      ${scenarioRow(state)}
      <div class="pv-tiles">
        ${tile(`${Math.round(st.load)} MW`, pt("peak"), `${state.year}`)}
        ${tile(`${Math.round(st.capacity)} MW`, pt("capacity"), `${state.year}`)}
        ${tile(`${gap < 0 ? "−" : "+"}${Math.abs(Math.round(gap))} MW`, gap < 0 ? pt("shortfall") : pt("headroom"))}
        ${tile(first ? `${first}` : "—", pt("first_bottleneck"), first ? "" : pt("none_until"))}
      </div>
      ${showBand ? `<div class="pv-band">${pt("band")}: ${Math.round(contracted)}–${Math.round(everything)} MW</div>` : ""}
      ${flex > 0 ? `<div class="pv-flex">${pt("flex")}: ${Math.round(flex)} MW · ${pt("flex_after")}: ${Math.max(0, Math.round(st.load - flex))} MW</div>` : ""}
      ${yearStrip(area.id, state, dir)}
      <div class="pv-chart"><canvas id="pv-chart-years"></canvas></div>
      ${decisionCard(deadline)}
      <h3 class="pv-section-title">${pt("upgrades")}</h3>
      <div class="pv-upgrades">${
        upgrades.length
          ? upgrades.map((upgrade) => upgradeCard(upgrade, state, dir)).join("")
          : `<p class="muted">${pt("no_upgrades")}</p>`
      }</div>
      ${Object.keys(state.upgradeYears).length ? `<button class="pv-btn" id="pv-reset">${pt("reset_delays")}</button>` : ""}
      <h3 class="pv-section-title">${pt("plans")} (${plans.length})</h3>
      <div class="pv-plans">${
        plans.length
          ? plans.map((plan) => planRow(plan, state, dir)).join("")
          : `<p class="muted">${pt("no_plans")}</p>`
      }</div>
      <p class="muted">${pt("footer")}</p>`;

    document.getElementById("pv-back").addEventListener("click", () =>
      APP.setState({ selectedAreaId: null, selectedPlanId: null })
    );
    document.getElementById("pv-scenario")?.addEventListener("change", (event) =>
      APP.setState({ scenario: event.target.value })
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
            label: pt("peak"),
            data: data.load.map((value) => +value.toFixed(1)),
            borderColor: COLORS.navy,
            backgroundColor: COLORS.navy,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
            pointRadius: 4,
            tension: 0.2,
          },
          {
            label: pt("capacity"),
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
                  return `${pt("peak")}: ${Math.round(load)} MW (${capacity ? Math.round((load / capacity) * 100) : 0}%)`;
                }
                return `${pt("capacity")}: ${Math.round(capacity)} MW`;
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
