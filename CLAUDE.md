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
- Brand (Thu 12 Nov evening, replaces the TenneT palette in the demo app): **NetWijzer**, tagline *Net een stukje wijzer.* Logo `app/netwijzer-logo.png`. Colours from the logo: ink `#022A2C`, teal `#0A5353` (actions), leaf green `#39A24A` (accent); status scale green `#5DB565` / yellow `#F2C94C` / orange `#F2994A` / red `#E25A6B`; violet `#8E5BD9` = under construction. Font Plus Jakarta Sans (Arial fallback). Tokens live in `app/app.css` `:root`.
- Lucide icons, **no emoji**, no flashy gradients. It must read well in a 1080p screen recording.

## Tech (v2 app in `app/` is the demo surface)

- **Read `docs/CONTRACT.md` before writing code.** It defines the shared state, the engine functions, the data files and who owns which file.
- Demo app: `app/index.html` + `app/app.css` + `app/js/*.js` (multi-page hash router, plain JavaScript, no framework, no build step) + `data/app/*` and `data/real/*`. Leaflet 1.9.4 and Chart.js 4.4.1 from cdnjs. No backend.
- Run: `python -m http.server 8000` in the repo root → http://localhost:8000/app/
- The root `index.html`, `css/` and `js/` are the old prototype; `/` redirects to `/app/`, and `/?legacy=1` opens the old app.
- Data pipeline (Python): `scripts/build_demo_data.py` → `data/app/`; `scripts/fetch_capaciteitskaart.py` and `scripts/prepare_real_data.py` → `data/real/`.
- Deployment: GitHub Pages from `main` / root.
- Map data: real capaciteitskaart supply areas (`data/real/drenthe-supply-areas.geojson`), real TenneT HV lines/stations, and CBS/PDOK municipality borders.

## Working together in git

- `git pull --rebase` before you start and before you push. Small, focused commits with clear messages.
- Docs edits: keep the structure; tick checkboxes in PLAN.md when tasks are done.
- Don't reformat or rewrite other people's files wholesale.
- If two people need the same file, coordinate in Discord first.
