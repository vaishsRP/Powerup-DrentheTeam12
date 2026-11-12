// Customer view: "Can I build here? When can I connect?" Owner: Teammate B.
// Renders the Locatiecheck and Plannen tabs. Reads ENGINE.*; changes things only via APP.setState().
// TODO (owner): location click anywhere (not just areas), "how to connect sooner" options, project timeline.

(() => {
  const fmtEstimate = (e) => {
    if (e.earliest === null) return t("no_upgrade");
    if (e.onTime) return `${t("on_time")} (${e.earliest})`;
    return e.earliest === e.latest ? `${e.earliest}` : `${e.earliest}–${e.latest}`;
  };
  const upgradeTitle = (id) => {
    const u = APP.data.upgrades.find((x) => x.id === id);
    return u ? u[`title_${APP.state.lang}`] : "";
  };

  function renderLocation() {
    const el = document.getElementById("tab-location"), s = APP.state;
    if (!s.selectedAreaId) { el.innerHTML = `<p class="muted">${t("pick_area")}</p>`; return; }
    const a = ENGINE.area(s.selectedAreaId);
    const off = ENGINE.areaStatus(a.id, s, s.year, "afname");
    const fin = ENGINE.areaStatus(a.id, s, s.year, "teruglevering");
    const ups = ENGINE.upgradesIn(a.id).map((u) => `<li>${u[`title_${s.lang}`]}: ${ENGINE.upgradeYear(u, s)}</li>`).join("");
    const plan = s.selectedPlanId && APP.data.plans.find((p) => p.id === s.selectedPlanId);
    let planHtml = "";
    if (plan) {
      const e = ENGINE.connectionEstimate(plan.id, s);
      planHtml = `<div class="card selected"><strong>${plan[`title_${s.lang}`]}</strong>
        <div class="tiles"><div class="tile"><div class="muted">${t("connect_estimate")}</div><div class="v">${fmtEstimate(e)}</div></div></div>
        ${e.blockingUpgradeId ? `<div>${t("because_of")}: ${upgradeTitle(e.blockingUpgradeId)}</div>` : ""}</div>`;
    }
    el.innerHTML = `<h2>${a.name}</h2>
      <div class="tiles">
        <div class="tile"><div class="muted">${t("offtake")} ${s.year}</div><div class="v status-${off.status}">${t(off.status)}</div></div>
        <div class="tile"><div class="muted">${t("feed_in")} ${s.year}</div><div class="v status-${fin.status}">${t(fin.status)}</div></div>
      </div>
      ${planHtml}
      <h3>${t("upgrades")}</h3><ul>${ups || "<li>–</li>"}</ul>
      <p class="muted">${t("source_years")} · ${t("demo_badge")}</p>`;
  }

  function renderPlans() {
    const el = document.getElementById("tab-plans"), s = APP.state;
    const list = s.selectedAreaId ? ENGINE.plansIn(s.selectedAreaId) : APP.data.plans;
    el.innerHTML = list.map((p) => {
      const e = ENGINE.connectionEstimate(p.id, s);
      return `<div class="card ${p.id === s.selectedPlanId ? "selected" : ""}" data-id="${p.id}">
        <strong>${p[`title_${s.lang}`]}</strong> <span class="muted">${p.municipality} · ${p.maturity}</span><br>
        ${t("connect_estimate")}: <strong>${fmtEstimate(e)}</strong></div>`;
    }).join("") + `<p class="muted">${t("demo_badge")}</p>`;
    el.querySelectorAll(".card").forEach((c) => c.addEventListener("click", () => {
      const p = APP.data.plans.find((x) => x.id === c.dataset.id);
      APP.setState({ selectedPlanId: p.id, selectedAreaId: p.area_id, tab: "location" });
    }));
  }

  document.addEventListener("statechange", () => {
    if (!APP.data) return;
    renderLocation();
    renderPlans();
  });
})();
