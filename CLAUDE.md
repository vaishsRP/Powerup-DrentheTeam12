# CLAUDE.md: instructions for Claude Code sessions in this repo

You are helping **Team 12** in the PowerUp Drenthe grid-congestion hackathon (Track 2, challenge owner TenneT). It runs **12–13 Nov 2026** (CET), with a hard deadline of **Fri 13 Nov 16:00** for a ≤2:00 MP4 pitch video. Three people share this repo, each possibly with their own Claude session. Read these files before doing anything:

1. `README.md`: event, deadlines, idea, roles, glossary
2. `docs/PLAN.md`: scope, features, architecture, engine logic, timeline, tasks, **open decisions**
3. `docs/RESEARCH.md`: what already exists, pain points, instruments, data sources (with ✅ / 🔎 status)
4. `docs/DATA-SCHEMA.md`: the plan card (shared intake format)
5. `docs/CONTRACT.md`: how the app fits together (state, engine, data files, file ownership)

## Who you might be working for

| Person | Role | Typical asks |
|---|---|---|
| Dev (`vaishsRP`) | code: data format, engine, web app, deployment | build features, fix bugs |
| Data & story (non-Dutch) | demo data, fact-checking, pitch script, diagrams | research, verify sources, draft CSVs and scripts |
| Video & Dutch (Dutch speaker) | Dutch text, voiceover, video edit | proofread NL strings, translate the script |

Two of the three teammates **do not speak Dutch**. When you summarise Dutch sources for them, translate into English.

## Hard rules

1. **Bilingual UI.** Every user-visible string goes through the i18n dictionaries (`nl` + `en`). Never hardcode visible text. Dutch is the default language. When you write Dutch text yourself, add it to the list in `docs/PLAN.md` §9 for proofreading by the Dutch teammate. Machine-sounding Dutch will be noticed by a Dutch jury.
2. **Data honesty.**
   - Real data comes only from sources listed in `docs/RESEARCH.md` / `data/README.md`.
   - Everything else is **illustrative** and the UI must say so ("Demo · fictieve gegevens").
   - Never invent facts, numbers, organisations' positions or quotes for the pitch. Any number in the pitch needs a ✅ source in RESEARCH.md.
   - Don't name real companies as owners of fictional plans.
3. **No scoring / multi-criteria model.** Drenthe's pMIEK framework explicitly rejects a multi-criteria analysis, and scoring is Track 5's territory. We support the discussion (facts, deadlines, measures); we don't rank projects with points.
4. **Don't rebuild existing tools** (capaciteitskaart, ETM, TNO's REV, ESSIM). We are the shared intake and planning layer that *feeds* them. See PLAN.md §3.
5. **Public repo.** Never commit:
   - the hackathon PDFs (the TenneT deck is copyrighted)
   - Discord content or upload links
   - personal data or names of organiser/TenneT staff
   - API keys or `.env` files
6. **Concept decisions belong to the team.** Items marked **[DECIDE]** in PLAN.md are open. Don't change the concept, the three deep features or the design direction on your own; propose instead. After the pre-pitch (Thu 14:00), feedback goes into PLAN.md §12 and wins over earlier assumptions.
7. **Scope discipline.** Build the "Must" list in PLAN.md §5 before anything else. **Feature freeze: Fri 11:00.** After that, only bug fixes.

## Design rules (summary; details in PLAN.md §7)

- Base layout = the teammate mockup:
  - title *Regionale maatregelkaart*
  - map on the left, panel on the right, with tabs *Plannen / Belasting / Scenario's*
  - peak vs grid-limit tiles and a 24-hour curve
  - a "Test scenario" button
  - legend *Ruimte / Beperkt / Knelpunt*
- TenneT palette: navy `#003584`, blue `#3C8CFA`, green `#33A92F`, warm grey `#F0ECEA`, orange `#FF6428`, yellow `#FAC850`. Font Arial/Helvetica.
- Lucide icons, **no emoji**, no flashy gradients. It must read well in a 1080p screen recording.

## Tech (decided Thu 14:10: simple static page instead of Vite + React)

- **Read `docs/CONTRACT.md` before writing code.** It defines the shared state, the engine functions, the data files and who owns which file.
- One static page: `index.html` + `css/style.css` + `js/*.js` (plain JavaScript, no framework, no build step) + `data/app/*`. Leaflet 1.9.4 and Chart.js 4.4.1 from cdnjs. No backend.
- Run: `python -m http.server 8000` in the repo root → http://localhost:8000
- Data pipeline (Python): `scripts/build_demo_data.py` → `data/app/`; `scripts/fetch_capaciteitskaart.py` → `data/real/` (real capaciteitskaart areas).
- Deployment: GitHub Pages from `main` / root.
- Map data: `data/drenthe-municipalities.geojson` (CBS 2025 borders) and `data/drenthe-substations-osm.json` (real TenneT 110/220 kV stations). Station areas = nearest-station (Voronoi) approximation until the real capaciteitskaart areas are in.

## Working together in git

- `git pull --rebase` before you start and before you push. Small, focused commits with clear messages.
- Docs edits: keep the structure; tick checkboxes in PLAN.md when tasks are done.
- Don't reformat or rewrite other people's files wholesale.
- If two people need the same file, coordinate in Discord first.
