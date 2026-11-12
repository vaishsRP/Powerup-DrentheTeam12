// Router + app shell. Routes (hash):
//   #/                      start            #/over                   about
//   #/klant                 my projects      #/klant/project/:id      project detail     #/klant/nieuw   new request
//   #/planner               overview         #/planner/gebied/:id     area detail        #/planner/simulator
let cleanup = null;

function parse() {
  const p = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  if (p[0] === "klant") return { role: "customer", page: p[1] === "nieuw" ? NewPage : p[1] === "project" ? ProjectPage : ProjectsPage, arg: p[2], nav: p[1] === "nieuw" ? "new" : "projects" };
  if (p[0] === "planner") return { role: "planner", page: p[1] === "simulator" ? SimPage : p[1] === "gebied" ? AreaPage : OverviewPage, arg: p[2], nav: p[1] === "simulator" ? "sim" : "overview" };
  if (p[0] === "over") return { role: null, page: AboutPage, nav: "about" };
  return { role: null, page: StartPage, nav: "start" };
}

function topbar(r) {
  const nav = r.role === "customer" ? [["projects", "#/klant", "folder-kanban", "nav_projects"], ["new", "#/klant/nieuw", "plus", "nav_new"]]
    : r.role === "planner" ? [["overview", "#/planner", "layout-dashboard", "nav_overview"], ["sim", "#/planner/simulator", "sliders-horizontal", "nav_sim"]]
    : [["start", "#/", "house", "nav_start"]];
  nav.push(["about", "#/over", "info", "nav_about"]);
  return `<a class="brand" href="#/" aria-label="${t("product")}, ${t("tagline")}">${MAPKIT.BRAND_PIN}<span>${t("product")}</span></a>
    <nav class="nav">${nav.map(([k, href, ic, label]) => `<a href="${href}" class="${r.nav === k ? "on" : ""}">${icon(ic, 16)}<span>${t(label)}</span></a>`).join("")}</nav>
    <div class="top-right">
      <span class="demo-tag">${t("demo")}</span>
      <div class="role" role="group"><a href="#/klant" class="${r.role === "customer" ? "on" : ""}">${t("role_customer")}</a><a href="#/planner" class="${r.role === "planner" ? "on" : ""}">${t("role_planner")}</a></div>
      <button class="lang" id="lang" aria-label="Language">${STORE.state.lang === "nl" ? "EN" : "NL"}</button>
    </div>`;
}

function route() {
  if (cleanup) { try { cleanup(); } catch (_) {} cleanup = null; }
  const r = parse();
  document.documentElement.lang = STORE.state.lang;
  document.querySelector(".topbar").innerHTML = topbar(r);
  document.querySelector("#lang").onclick = () => { STORE.set({ lang: STORE.state.lang === "nl" ? "en" : "nl" }); route(); };
  const main = document.querySelector("main");
  main.innerHTML = r.page.html(r.arg);
  document.querySelector("footer").style.display = r.page === OverviewPage || r.page === SimPage ? "none" : "";
  cleanup = r.page.mount?.(main, r.arg) || null;
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
loadData().then(route).catch((e) => {
  document.querySelector("main").innerHTML = `<div class="page"><div class="empty">Could not load data (${e.message}). Start a local server in the repo root: <code>python -m http.server 8000</code>, then open <code>http://localhost:8000/app/</code></div></div>`;
});
