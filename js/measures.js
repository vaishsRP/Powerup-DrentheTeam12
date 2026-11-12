// Scenario's tab: 24-hour peak-day curve + "Test scenario" measures. Owner: Teammate B.
// Reads ENGINE.dayCurve(); changes things only via APP.setState({ measures }).
// TODO (owner): time-block contract, pairing solar + demand, relocate; show before/after peak tiles.

(() => {
  let chart;

  function render() {
    const el = document.getElementById("tab-scenarios"), s = APP.state;
    if (!s.selectedAreaId) { el.innerHTML = `<p class="muted">${t("pick_area")}</p>`; return; }
    const a = ENGINE.area(s.selectedAreaId);
    const c = ENGINE.dayCurve(a.id, s);
    const peak = Math.max(...c.load);

    el.innerHTML = `<h2>${a.name} · ${s.year}</h2>
      <div class="tiles">
        <div class="tile"><div class="muted">${t("peak")}</div><div class="v">${peak.toFixed(0)} MW</div></div>
        <div class="tile"><div class="muted">${t("grid_limit")}</div><div class="v">${c.capacity.toFixed(0)} MW</div></div>
      </div>
      <canvas id="chart-day" height="180"></canvas>
      <p><button class="action" id="btn-battery">${t("add_battery")}</button> <button id="btn-reset">${t("reset")}</button></p>
      <p class="muted">${t("demo_badge")}</p>`;

    document.getElementById("btn-battery").onclick = () =>
      APP.setState({ measures: [...s.measures, { type: "battery", areaId: a.id, direction: s.direction, mw: 10 }] });
    document.getElementById("btn-reset").onclick = () =>
      APP.setState({ measures: s.measures.filter((m) => m.areaId !== a.id) });

    chart?.destroy();
    chart = new Chart(document.getElementById("chart-day"), {
      type: "line",
      data: { labels: c.hours.map((h) => `${h}:00`), datasets: [
        { label: t("peak"), data: c.load.map((v) => +v.toFixed(1)), borderColor: "#003584", fill: false, tension: 0.3 },
        { label: t("grid_limit"), data: c.hours.map(() => c.capacity), borderColor: "#FF6428", borderDash: [6, 4], pointRadius: 0 },
      ] },
      options: { animation: false, plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "MW" } } } },
    });
  }

  document.addEventListener("statechange", () => { if (APP.data) render(); });
})();
