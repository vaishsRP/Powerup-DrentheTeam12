// Map, header controls, tabs, legend. Owner: Dev (Teammate A).
// Reads ENGINE.areaStatus(); changes things only via APP.setState().

(() => {
  const COLORS = { room: "#33A92F", limited: "#FAC850", bottleneck: "#FF6428" };
  let map, layer;

  document.addEventListener("dataready", () => {
    map = L.map("map", { zoomControl: true }).setView([52.85, 6.6], 9);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap contributors © CARTO · CBS/PDOK",
      maxZoom: 14,
    }).addTo(map);

    layer = L.geoJSON(APP.data.areas, {
      style: () => ({ weight: 1, color: "#003584", fillOpacity: 0.55 }),
      onEachFeature: (f, l) => l.on("click", () => APP.setState({ selectedAreaId: f.properties.id, selectedPlanId: null })),
    }).addTo(map);
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });

    for (const p of APP.data.plans) {
      L.circleMarker([p.lat, p.lon], { radius: 6, color: "#003584", fillColor: "#fff", fillOpacity: 1, weight: 2 })
        .on("click", () => APP.setState({ selectedAreaId: p.area_id, selectedPlanId: p.id, tab: "location" }))
        .addTo(map);
    }

    // header controls
    document.getElementById("year").addEventListener("input", (e) => APP.setState({ year: +e.target.value }));
    document.querySelectorAll("#direction button").forEach((b) => b.addEventListener("click", () => APP.setState({ direction: b.dataset.dir })));
    document.querySelectorAll("#lang button").forEach((b) => b.addEventListener("click", () => APP.setState({ lang: b.dataset.lang })));
    document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => APP.setState({ tab: b.dataset.tab })));
  });

  document.addEventListener("statechange", () => {
    if (!layer) return;
    const s = APP.state;
    layer.eachLayer((l) => {
      const id = l.feature.properties.id;
      const st = ENGINE.areaStatus(id, s);
      l.setStyle({ fillColor: COLORS[st.status], weight: id === s.selectedAreaId ? 3 : 1 });
      l.bindTooltip(`${l.feature.properties.name}: ${Math.round(st.ratio * 100)}%`);
    });

    // header text + active states
    document.getElementById("title").textContent = t("title");
    document.getElementById("demo-badge").textContent = t("demo_badge");
    document.getElementById("year-label").textContent = t("year");
    document.getElementById("year-value").textContent = s.year;
    document.getElementById("year").value = s.year;
    document.querySelector('[data-dir="afname"]').textContent = t("offtake");
    document.querySelector('[data-dir="teruglevering"]').textContent = t("feed_in");
    document.querySelectorAll("#direction button").forEach((b) => b.classList.toggle("active", b.dataset.dir === s.direction));
    document.querySelectorAll("#lang button").forEach((b) => b.classList.toggle("active", b.dataset.lang === s.lang));
    document.querySelectorAll("#tabs button").forEach((b) => {
      b.textContent = t(`tab_${b.dataset.tab}`);
      b.classList.toggle("active", b.dataset.tab === s.tab);
    });
    document.querySelectorAll(".tab").forEach((el) => el.classList.toggle("active", el.id === `tab-${s.tab}`));
    document.getElementById("legend").innerHTML =
      ["room", "limited", "bottleneck"].map((k) => `<i style="background:${COLORS[k]}"></i>${t(k)}`).join("");
  });
})();
