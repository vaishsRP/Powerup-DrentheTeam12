# Regionale maatregelkaart: Team 12, PowerUp Drenthe hackathon

> **Status (Thu 12 Nov, 12:30):** planning phase. No app code yet. The concept is **proposed** and gets confirmed after the 14:00 pre-pitch.
> Read this file first, then [`docs/PLAN.md`](docs/PLAN.md). Claude Code users: your Claude reads [`CLAUDE.md`](CLAUDE.md) automatically.

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

## Our idea (proposed)

**A shared register of everyone's energy plans, a "one form", that tells the region where the grid will jam, which measure helps, and by when someone must decide.**

```
1. COLLECT  → municipalities, province, companies, ProRail, water boards and grid operators submit plans in one standard form
2. SEE      → map by year: where and when each grid area runs out of room, and which plans cause it
3. DIAGNOSE → click an area: its plans, its load over the years, and the 24-hour peak-day curve
4. TEST     → apply a measure (shift timing, battery, pair solar with demand, time-block contract) and watch the curve and colour change
5. OUTPUT   → the regional measures map: per area the smartest measure, its effect, and the decision deadline for the pMIEK
```

The **visible part is a dashboard** (based on the teammate mockup: map on the left, panel on the right, tabs *Plannen / Belasting / Scenario's*). The **real product is the shared intake format**. That is TenneT's literal question.

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
data/                ← real open data we already have (municipality borders, TenneT substations)
app/                 ← (coming) the web app: Vite + React + Leaflet
```

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
