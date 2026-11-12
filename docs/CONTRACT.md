# Team contract: how the app fits together

> Agreed Thu 12 Nov. Three people vibe-code in parallel; this file keeps the pieces compatible.
> **Change a contract only after telling the team in Discord.** Everything else in your own files is yours.

## 1. Stack and how to run it

- One static page: `index.html` + `css/style.css` + `js/*.js` + `data/app/*`. No build step, no backend, no npm.
- Libraries from cdnjs: **Leaflet 1.9.4** (map) and **Chart.js 4.4.1** (charts).
- Run locally (fetch() doesn't work from `file://`):
  ```
  python -m http.server 8000      # in the repo root, then open http://localhost:8000
  ```
- Hosting: GitHub Pages from `main` / root (Settings → Pages). [DECIDE: who turns it on]

## 2. Shared state (`js/state.js`)

```js
APP.state = {
  year: 2026,              // map year (slider, 2026–2035)
  direction: "afname",     // "afname" | "teruglevering"
  scenario: "expected",    // "contracted" | "expected" | "everything"
  lang: "nl",              // "nl" | "en"
  upgradeYears: {},        // overrides, e.g. { "veenoord-boerdijk": 2031 }  ← the delay ripple
  measures: [],            // e.g. [{ type: "battery", areaId: "veenoord", direction: "afname", mw: 10 }]
  selectedAreaId: null,
  selectedPlanId: null,
  tab: "location",         // "location" | "plans" | "load" | "scenarios"
}
APP.setState(patch)        // merges, then fires the "statechange" event
APP.data                   // { areas, upgrades, plans } — loaded once, then "dataready" fires
```

Rules:
- Every view: `document.addEventListener("statechange", render)`; render only your own container.
- Change anything **only** with `APP.setState(...)`. Never call another person's functions.
- New state keys: add them here first, with a default in `state.js`.

## 3. Engine (`js/engine.js`): pure functions, no DOM

| Function | Returns |
|---|---|
| `ENGINE.areaStatus(areaId, state, year?, dir?)` | `{ load, capacity, ratio, status }`, status = `room` (<80 %) / `limited` (≤100 %) / `bottleneck` |
| `ENGINE.loadByYear(areaId, state, dir?)` | `{ years, load[], capacity[] }` for 2026–2035 |
| `ENGINE.dayCurve(areaId, state, dir?)` | `{ hours[24], load[24], capacity }` for `state.year`, measures applied |
| `ENGINE.connectionEstimate(planId, state)` | `{ earliest, latest, onTime, blockingUpgradeId, direction }`; `earliest: null` = no upgrade planned |
| `ENGINE.decisionDeadline(areaId, state, dir?)` | `{ needed, firstBottleneck, leadYears, investmentPlanYear, pmiekYear, tooLate }` |
| `ENGINE.delayFlags(state)` | `[{ upgradeId, areaId, delay, flag: "red" \| "orange" \| "none" }]` |
| helpers | `area(id)`, `plansIn(areaId)`, `upgradesIn(areaId)`, `upgradeYear(upgrade, state)` |

Model (docs/PLAN.md §6): load = base × (1+growth)^(year−2026) + Σ plan MW × maturity weight − measures; capacity = base capacity + upgrades in service. Weights: idea 0.25 · planned 0.5 · permit 0.75 · contracted 0.95.

## 4. Data files (`data/app/`, built by `scripts/build_demo_data.py`)

| File | Shape | Real or illustrative |
|---|---|---|
| `areas.geojson` | Features with `properties: { id, name, station, base_offtake_mw, cap_offtake_mw, base_feed_in_mw, cap_feed_in_mw, growth_offtake, growth_feed_in, demo }` | Shapes: Voronoi around real TenneT stations, clipped to real Drenthe border. **MW illustrative.** |
| `upgrades.json` | `[{ id, area_id, title_nl, title_en, year_desired, year_feasible, lead_years, kind, mw_added_offtake, mw_added_feed_in, source_document, years_verified }]` | **Years real** (Enexis IP2026, RESEARCH.md §9; `years_verified` = ✅). MW illustrative. |
| `plans.json` | Plan cards per DATA-SCHEMA.md, plus `area_id` (pre-computed) | Illustrative ("Demo · fictieve gegevens") |

Next: `scripts/fetch_capaciteitskaart.py` pulls the **real** capaciteitskaart supply areas (status, queue MW, "solved in year") into `data/real/`. When it works, the build script switches areas to those shapes. Keep the property names above so nothing else breaks.

## 5. Who owns which file

| Person | Files |
|---|---|
| **Data & logic** | `scripts/*.py`, `data/app/*`, `js/engine.js` |
| **Dev (Teammate A)** | `index.html`, `css/style.css`, `js/state.js`, `js/map.js`, `js/planning.js` (Belasting tab: load over years, deadlines, delay ripple), hosting |
| **Teammate B (Dutch)** | `js/customer.js` (Locatiecheck + Plannen tabs), `js/measures.js` (Scenario's tab), `js/i18n.js` (all text, NL proofreading) |

- Only edit your own files. Need something in another file? Ask in Discord.
- Others' CSS: add a clearly marked block at the end of `style.css` (`/* customer.js */ …`).
- `git pull --rebase` before every push; commit small and often.

## 6. Checkpoints

| Time | Done when |
|---|---|
| Thu 15:00 | Everyone has pulled, the page runs locally |
| Thu 18:00 | Real/realistic data in; each tab shows something sensible for every area |
| Thu 22:00 | Full demo path works: location check → estimate → delay ripple → measure fixes it |
| Fri 09:00 | Polish + Dutch text check at 1080p |
| **Fri 11:00** | **Feature freeze** → video |
