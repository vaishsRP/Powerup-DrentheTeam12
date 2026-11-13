# NetWijzer (Regionale maatregelkaart): Team 12, PowerUp Drenthe hackathon

> **Status (Fri 13 Nov, midday):** the app is called **NetWijzer** (*Net een stukje wijzer.*) and lives in `app/`: a customer side and a planner side on one shared register, with real capacity-map and TenneT grid data. Feature freeze has passed; only bug fixes from here.
> Run `python -m http.server 8000` in the repo root and open **http://localhost:8000/app/**. Online (once GitHub Pages is switched on for `main` / root): https://vaishsrp.github.io/Powerup-DrentheTeam12/app/. The old prototype is still available at `http://localhost:8000/?legacy=1`.
> Read this file first, then [`docs/PLAN.md`](docs/PLAN.md) and [`docs/CONTRACT.md`](docs/CONTRACT.md). Claude Code users: your Claude reads [`CLAUDE.md`](CLAUDE.md) automatically.

## The hackathon in 30 seconds

- **Event:** PowerUp Drenthe grid-congestion hackathon (online, 30 hours, **12–13 Nov 2026**). It is organised by Provincie Drenthe with TenneT, Enexis, RENDO and Netbeheer Nederland.
- **Our track:** **Track 2 (challenge owner: TenneT).** Official title: *"Waar pak je netcongestie het slimst aan? Bouw de regionale maatregelkaart"* ("Where do you tackle grid congestion most smartly? Build the regional measures map").
- **The challenge question (translated):** *How can regional governments, grid operators and other parties plan energy demand, supply and the related infrastructure in a way that takes existing and future regional plans into account?*
- **TenneT's key sentence:** *"A lot is already known by various parties. How do we get the content of those parties together in **one form**?"*

## Hard deadlines (Dutch time, CET)

| When | What | Who |
|---|---|---|
| **Thu 14:00** | **Pre-pitch.** 5-minute rough concept for the challenge owner and experts. **Attendance mandatory.** | whole team |
| Thu 16:00 / 17:00 | Optional sessions: "AI at a hackathon" / pitch course | 1 person |
| Fri 10:00 | Optional session: video production | video teammate |
| **Fri 11:00** | **Our own feature freeze** | dev |
| **Fri 16:00** | **Pitch video upload deadline.** MP4, **max 2:00**, royalty-free music only. Each team gets its own upload link in Discord on Friday afternoon. | video teammate |
| Fri 18:00 | Finale: the top 2 per track get 4 minutes of jury questions live on **Microsoft Teams** | whole team online |
| Fri 21:00 | Prizes. All teams must be online. | whole team |

**The jury wants** an MVP or proof of concept that shows:
1. which specific bottleneck it solves
2. how it works (architecture, data flows or process model)
3. its impact on relieving the grid, and why it scales

The organisers prefer a **working prototype** to slides.

## What NetWijzer is

**One shared register of energy plans, with two views of the same data: customers see where they stand, planners see where the grid will jam and what has to be decided by when.**

### The problems it addresses

1. Customers wait years for a grid connection and don't know when or why.
2. Customers can't see what a grid upgrade or a delay means for their own project.
3. Planners can't see at a glance which areas run out of grid room, and in which year.
4. Planners decide on grid upgrades without seeing which projects depend on them.
5. Planners can't quickly test what a delay, a battery or a new upgrade would change.
6. Demand, supply and the infrastructure in between (cables, access to the site) are looked at separately.

### Customer side (*Klant*)

| Page | What it does |
|---|---|
| **Mijn projecten** | All the organisation's requests: preferred start, expected connection (or *In beoordeling*), status, next step and who takes it. Small fixed map. |
| **Project page** | Expected connection with the reason (*Wacht op …*), location, grid operator, preferred start, priority class (ACM), cable to the station, site access, real capacity-map status and queue, ways to connect sooner (battery, flexible contract, cable pooling), timeline of every change and why, and *Aanvraag intrekken*. Map centred on the project, zoom only, no grid-operator labels. |
| **Nieuwe aanvraag** | Name, type, MW, year and phase; click the map (zoom and pan inside Drenthe) for the location. Shows the capacity-map status there, whether a cable to the station is already there, and asks how the site is reached. **No instant estimate:** an expert at the grid operator reviews the request first. |

### Planner side (*Planner*)

| Page | What it does |
|---|---|
| **Overzicht** | Map of Drenthe: *Vandaag* (real capaciteitskaart) or *Projectie* for a chosen year (drawn on the same real shapes, starting from today's status). Layers: substations, grid upgrades, TenneT HV grid, projects, cable to station. Right column: key figures (incl. MW that doesn't fit, formal vs plans), *Verzoeken om in te trekken*, *Nieuwe aanvragen te beoordelen* (confirm and send the estimate), and the areas that need attention. |
| **Area page** | Chart and year table of connected load, capacity and demand that doesn't fit (formal requests vs early-stage plans) per direction; *Besluit nodig*: biggest shortfall, projects waiting on it, next action and owner, decision due (marked *Modelschatting*), what holds it up (from the IP2026 notes); grid upgrades and the queue in priority order. |
| **Simulator** | Pick an area (or a project from the list for one area or all of Drenthe) and change only the upgrades that matter: year selector, *Niet uitvoeren*, or a *Nieuwe netuitbreiding*; place a battery of any size; withdraw a request. The right side shows every project's date before and after, with the reason. *Besluit vastleggen en klanten informeren* writes the change into each affected customer's timeline. |

Planner maps zoom and pan inside Drenthe; customer maps don't move. Information appears on click, not on hover. Dutch is the default, with an EN toggle.

### What is real and what is demo

- **Real:** capaciteitskaart status and queues per supply area (Netbeheer Nederland), TenneT HV lines and stations, grid upgrades with desired and feasible years (Enexis investment plan 2026), CBS/PDOK borders. Sources in [`data/README.md`](data/README.md) and [`docs/RESEARCH.md`](docs/RESEARCH.md).
- **Demo (labelled in the app):** all projects and customers, MW per station area (2026 loads calibrated to the real status pattern by `scripts/calibrate_areas.py`), upgrade sizes in MW, battery effects, and the cable rule (a project within 2 km of its station counts as cabled; *demo-aanname*).

The original "one form" idea is still the core: the **real product is the shared intake format** (the plan card in [`docs/DATA-SCHEMA.md`](docs/DATA-SCHEMA.md)). That is TenneT's literal question.

**Why it isn't a copy of existing tools:** the national capacity map (capaciteitskaart) shows *today*. ETM and TNO's REV *calculate* futures. What's missing is the **front door**: one shared, machine-readable, always-current plan register wired into the province's pMIEK → grid investment plan cycle. Today these plans travel as PDFs every two years. Details and sources are in [`docs/RESEARCH.md`](docs/RESEARCH.md).

## Team roles (proposed)

| Role | Owns |
|---|---|
| **Dev** (`vaishsRP`) | data format, calculation engine, web app, deployment |
| **Data & story** (non-Dutch teammate) | real-data collection, demo dataset, fact-checking, pitch script, architecture diagram, testing |
| **Video & Dutch** (Dutch teammate) | Dutch UI text proofreading, Dutch voiceover, recording and editing the pitch video |

The video gets a **Dutch voiceover**. Live jury questions will be answered **in English**. The app has a **Dutch/English toggle** (Dutch by default).

## Repo layout

```
README.md            ← you are here
CLAUDE.md            ← rules for Claude Code sessions working in this repo
docs/PLAN.md         ← full plan: scope, features, architecture, timeline, tasks, open decisions
docs/RESEARCH.md     ← ground-reality research with sources (what exists, pain points, instruments, data)
docs/DATA-SCHEMA.md  ← the "plan card": the shared intake format
docs/CONTRACT.md     ← how the app fits together: state, engine, data files, who owns which file
app/                 NetWijzer, the demo app (multi-page hash router, plain JS + Leaflet + Chart.js, no build step)
index.html, css/, js/  old prototype (legacy; /?legacy=1)
scripts/             ← Python data pipeline (demo data, real capaciteitskaart fetch, calibration, supply-area gaps)
data/                ← real open data (data/real/, municipality borders, TenneT substations); data/app/ = app data
```

## Run the app

```
python -m http.server 8000      # in the repo root, then open http://localhost:8000/app/
python scripts/build_demo_data.py   # rebuild data/app/ (needs: pip install shapely scipy numpy)
python scripts/calibrate_areas.py   # then calibrate the 2026 loads to the real capaciteitskaart status
python scripts/build_supply_gaps.py # parts of Drenthe without a supply area (drawn grey)
```

The demo remembers clicks (decisions, new requests, withdrawals) in the browser. **Over → Demo terugzetten** starts fresh.

The v2 app lives in `app/`. The root `index.html`, `css/` and `js/` are the old prototype; `/` redirects to `/app/`, and `/?legacy=1` opens the old app.

## Mini glossary (Dutch → English)

| Dutch | English |
|---|---|
| netcongestie | grid congestion (the grid is full) |
| afname | offtake: taking power from the grid (consumption) |
| teruglevering / invoeding | feed-in: putting power on the grid (e.g. solar parks) |
| transportcapaciteit | transport capacity (how much the grid can carry) |
| knelpunt / beperkt / ruimte | bottleneck / limited / room |
| netbeheerder | grid operator (TenneT = high voltage; Enexis and RENDO = regional grids in Drenthe) |
| onderstation / station | substation |
| maatregel | measure (an intervention that relieves congestion) |
| pMIEK | the province's multi-year programme that prioritises energy infrastructure projects; it feeds the grid operators' investment plans |
| RES | Regional Energy Strategy (where wind and solar go) |
| investeringsplan | grid operator investment plan (every 2 years, sent to the regulator ACM) |
| wachtrij | waiting list for a grid connection |
| fictieve gegevens | fictitious (illustrative) data |
