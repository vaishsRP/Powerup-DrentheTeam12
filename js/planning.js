// Planning view: load over the years, delay flags, decision deadline, and the delay ripple (upgrade-year sliders).
// Owner: Dev (Teammate A). Renders the Belasting tab. Reads ENGINE.*; changes things only via APP.setState().

(() => {
  let chart;

  function render() {
    const el = document.getElementById("tab-load"), s = APP.state;
    if (!s.selectedAreaId) { el.innerHTML = `<p class="muted">${t("pick_area")}</p>`; return; }
    const a = ENGINE.area(s.selectedAreaId);
    const d = ENGINE.decisionDeadline(a.id, s);
    const flags = Object.fromEntries(ENGINE.delayFlags(s).map((f) => [f.upgradeId, f]));

    const upgrades = ENGINE.upgradesIn(a.id).map((u) => {
      const y = ENGINE.upgradeYear(u, s), f = flags[u.id];
      return `<div class="card"><strong>${u[`title_${s.lang}`]}</strong>
        <span class="flag-${f.flag}">${f.delay > 0 ? `+${f.delay}` : ""}</span><br>
        <input type="range" min="${u.year_desired}" max="2035" value="${y}" data-up="${u.id}"> <strong>${y}</strong>
        <span class="muted">(${u.year_desired} → ${u.year_feasible})</span></div>`;
    }).join("");

    const deadline = !d.needed ? "" : `<div class="card"><strong>${t("deadline")}</strong><br>
      ${d.tooLate ? `<span class="flag-red">${t("too_late")}</span>` : `${t("must_be_in_pmiek")} ${d.pmiekYear}`}
      <div class="muted">${t("bottleneck")}: ${d.firstBottleneck} · lead ${d.leadYears} yr</div></div>`;

    el.innerHTML = `<h2>${a.name}</h2><canvas id="chart-years" height="180"></canvas>${deadline}
      <h3>${t("upgrades")}</h3>${upgrades || "<p>–</p>"}<p class="muted">${t("source_years")} · MW: ${t("demo_badge")}</p>`;

    el.querySelectorAll("input[data-up]").forEach((inp) => inp.addEventListener("change", () =>
      APP.setState({ upgradeYears: { ...s.upgradeYears, [inp.dataset.up]: +inp.value } })));

    const data = ENGINE.loadByYear(a.id, s);
    chart?.destroy();
    chart = new Chart(document.getElementById("chart-years"), {
      type: "line",
      data: { labels: data.years, datasets: [
        { label: t("peak"), data: data.load.map((v) => +v.toFixed(1)), borderColor: "#003584", tension: 0.2 },
        { label: t("grid_limit"), data: data.capacity, borderColor: "#FF6428", stepped: true, borderDash: [6, 4] },
      ] },
      options: { animation: false, plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "MW" } } } },
    });
  }

  document.addEventListener("statechange", () => { if (APP.data) render(); });
})();
