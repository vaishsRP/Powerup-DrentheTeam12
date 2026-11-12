# Plan: Regionale maatregelkaart (Team 12, Track 2)

> Last updated: Thu 12 Nov 2026, 12:30. Items marked **[DECIDE]** are open team decisions. Don't treat them as settled.

## 1. Problem (one sentence)

Everyone's energy plans already exist. But they sit in different documents, formats and area units (municipal borders vs grid areas), with unclear certainty. So nobody sees in time where the grid will jam, while expanding a substation takes years (≈7.5 years normally, ≈4 under the 2026 emergency measures; see RESEARCH.md).

## 2. Who uses it

The regional energy planning table, not the general public:

| User | What they need from the tool |
|---|---|
| Province (pMIEK / energy coordinator) | Collect all plans in one place; prepare the pMIEK discussion; see conflicts early |
| Municipal planners (housing, business parks, heat) | Check *before* committing whether the grid can take their plan, and when |
| Grid operators (TenneT strategists, Enexis/RENDO) | Know what's coming, where, when and **how certain**, as input for the 2-yearly investment plan |
| Large users (industry, ProRail, Rijkswaterstaat, water boards) | Submit plans once (confidentially if needed); find pairing partners |

## 3. Positioning

> "The capaciteitskaart shows today. ETM and TNO's REV calculate futures. What's missing is **the front door**: one shared, always-current register of everyone's plans, wired into the pMIEK → investment-plan cycle, that says **what to do and by when**."

- We **don't** rebuild a capacity heat map, a scenario model or a simulator. Those exist (see RESEARCH.md §1).
- We **don't** build a scoring model or multi-criteria analysis. Drenthe's pMIEK framework explicitly says it is *not* a multi-criteria analysis. Scoring is also Track 5's territory.
- We **do** build the shared intake, certainty handling, deadline logic and measure suggestions, and we **export** to existing tools (ESDL/CSV).

## 4. The three deep features (proposed) [DECIDE]

1. **One form: the shared plan register.** A standard "plan card" (see [DATA-SCHEMA.md](DATA-SCHEMA.md)). It records location, MW offtake/feed-in, year needed, **maturity** (idea → planned → permit → contracted), **confidentiality** (public / partners / grid operator only) and **source document**. Plans come in via a web form or an Excel/CSV template, and can be exported as CSV (ESDL export is on the roadmap).
2. **Deadline checker.** Combines grid lead times with Drenthe's real cycle: the investment plan goes to ACM in **January**, based on the pMIEK adopted in **February** of the year before. The tool works out per plan and per area: *"Capacity needed in 2030 → must be in the pMIEK of Feb 2025 → too late for grid expansion → only measures can help."* It also flags **delayed grid upgrades** (certainty on the grid side, not just the plan side).
3. **Measures map (maatregelkaart).** Per congested area, the tool suggests measures using **real Dutch instruments**:
   - pair feed-in with offtake through cable pooling, or a group transport agreement (GTO) from 2027
   - time-block contract
   - battery
   - shift timing
   - relocate to an area with room

   You test each one on the **24-hour peak-day curve** ("Test scenario") and see the area change colour. The output is the measures map plus a structured **project sheet for the pMIEK discussion**. The sheet is input for the discussion, not a score.

Also planned:
- a **"View as" role switcher** (Municipality / Province / Grid operator / Company) to show who sees what, including confidentiality
- a **Dutch/English toggle**

## 5. Scope

**Must (by Thu night)**
- [ ] Plan-card data format plus a demo dataset (real stations and borders; illustrative MW)
- [ ] Engine: plan → grid area allocation, certainty-weighted load per area per year, capacity incl. upgrades, status (room / limited / bottleneck)
- [ ] Map with year slider (2026–2035), offtake / feed-in toggle, legend
- [ ] Area panel: plans, load-over-years chart, 24-hour peak-day curve, "evening peak vs grid limit" tiles
- [ ] Deadline checker (per area, per plan)
- [ ] Intake form (adds a plan and shows its impact immediately)
- [ ] NL/EN toggle
- [ ] Deployed URL

**Should (Fri morning, before the 11:00 freeze)**
- [ ] Measure suggestions plus "Test scenario" (apply → curve and colour update)
- [ ] CSV/Excel template import
- [ ] "View as" role switcher with confidentiality filtering
- [ ] Guided demo mode: an auto-play story with NL/EN captions, so the video can be a screen recording
- [ ] pMIEK project-sheet export (printable page / CSV)

**Could (only if ahead)**
- [ ] Shared database (e.g. Supabase) so two laptops submit to the same register live
- [ ] "What changed since the last cycle" feed

**Won't (say so honestly in the pitch: "roadmap")**
- Login and real access control, live grid data, optimisation algorithms, real ESDL export, neighbourhood-level (low-voltage) drill-down.

## 6. Architecture

**Prototype (what we build):** a static web app, with no server.
- Vite + React (JavaScript) + Leaflet maps + Lucide icons.
- Data = JSON files in the repo, following the plan-card format. New plans are saved in the browser (localStorage).
- Deployment: GitHub → Vercel (auto-deploy on push). Fallback: Netlify Drop. **[DECIDE]**

**Target architecture (what we show in the pitch):**
```
Sources                      Intake                 Register                Engine                         Outputs
(woonvisies, RES, CES,  ──►  web form / Excel  ──►  plan cards       ──►   allocate to station area  ──►  forecast map (by year)
 connection requests,        template / API         (maturity,              + certainty-weighted load       deadline warnings
 investment plans)                                  confidentiality,        + capacity & upgrades           measures map
                                                    source, version)        + 24h profiles                  pMIEK project sheet
                                                                            + measure effects               export → ESDL/ETM/REV
```

**Engine logic (proposed; validate at the pre-pitch):**
- **Area allocation:** each plan goes to the station area it lies in. Station areas are approximated as "nearest substation" (Voronoi) around **real TenneT 110/220 kV substations** (from OpenStreetMap; see `data/`).
- **Load per area per year:** base load × background growth (EVs, heat pumps, rooftop solar) + Σ (plan MW × maturity weight) for plans active by that year. Batteries and flexible plans reduce peaks.
- **Scenarios:**
  - contracted only / expected (weighted) / everything
  - grid upgrades on time / delayed
- **Capacity per year:** base capacity + upgrades whose year has arrived.
- **Status:** Room < 80 % ≤ Limited ≤ 100 % < Bottleneck. These are the teammate mockup's three levels. **[DECIDE]** Should they align to the capaciteitskaart's four categories instead?
- **Deadline:** if area X needs extra capacity by year *Y* and a grid upgrade takes *L* years, the upgrade must be in the investment plan of Jan (*Y − L*). That plan is based on the pMIEK of Feb (*Y − L − 1*). If that date has passed, the tool says "only measures can help" and points to the measures. *L* is a setting: 7.5 normal / 4 emergency.
- **24-hour curve:** each plan category has a daily profile shape: housing = evening peak 16–21h, solar = midday, charging = evening/night, industry = flat, electrolyser = flexible. A winter peak day is used for offtake, a sunny summer day for feed-in.
- **Measure effects:**
  - battery shaves the peak by its MW
  - time-block contract removes the plan's load from 16–21h
  - pairing solar + flexible demand nets them inside the area
  - shifting moves the start year
  - relocation moves the plan to the nearest area with room

## 7. Design rules

- **Base layout = teammate mockup:** title *Regionale maatregelkaart*, map on the left, panel on the right, tabs *Plannen / Belasting / Scenario's*, peak vs grid-limit tiles, 24-hour curve, "Test scenario" button, legend *Ruimte / Beperkt / Knelpunt*, "Demo · fictieve gegevens" badge.
- **TenneT palette** (sampled from TenneT's own challenge deck):

  | Use | Colour |
  |---|---|
  | navy (headings, dark UI) | `#003584` |
  | bright blue (accent, links) | `#3C8CFA` |
  | green | `#33A92F` |
  | warm grey (background) | `#F0ECEA` |
  | orange | `#FF6428` |
  | yellow | `#FAC850` |
  | steel blue | `#75A8C1` |

  Font: Arial / Helvetica, matching the TenneT deck. Their motif is a grid of dots that grow in size; use it sparingly.
- No emoji icons; use Lucide line icons. No gradients-everywhere "AI dashboard" look. Calm, readable, works in a 1080p screen recording.
- Every screen showing made-up numbers carries the **"Demo · fictieve gegevens / illustrative data"** label.

## 8. Timeline

| Time | Dev | Data & story | Video & Dutch |
|---|---|---|---|
| Thu 12:30–13:45 | pre-pitch page + script | capaciteitskaart colours for Drenthe; read RESEARCH.md | read README; confirm pitch language with organisers on Discord |
| **Thu 14:00** | **pre-pitch (all)** | | |
| Thu 14:30–18:00 | data format + engine | demo dataset (plans CSV) | review Dutch UI text as it appears |
| Thu 18:00–23:00 | map, panel, intake, NL/EN, deploy | fact-check RESEARCH.md "to verify" items; draft pitch script | draft Dutch voiceover from the script |
| Fri 08:00–11:00 | measures + Test scenario, demo mode | test the app, report bugs | storyboard the video |
| **Fri 11:00** | **feature freeze** | | |
| Fri 11:00–13:00 | bug fixes only; record screen captures | final script + architecture diagram | record voiceover |
| Fri 13:00–15:30 | support | review cuts | edit video (max 2:00, MP4) |
| **Fri ≤15:30** | | | **upload** (link appears in our Discord channel; hard deadline 16:00) |

## 9. Tasks (tick them off in this file)

**Data & story**
- [ ] Open https://capaciteitskaart.netbeheernederland.nl/ in a browser. For each Drenthe area, note today's status for **Afname** and **Teruglevering**, and for TenneT vs regional operators. Put the results in `data/capaciteitskaart-today.csv` with columns `area,level,direction,status_nl,status_en,checked_at`.
- [ ] Verify the "to verify" items in RESEARCH.md (open the source, confirm the number, add ✅).
- [ ] Draft the demo dataset following DATA-SCHEMA.md: ~25 plans across all party types, with realistic sizes. Real place names are fine; MW values are illustrative.
- [ ] Pitch script (2:00 max, ~260 words spoken) in English, for the Dutch teammate to translate.
- [ ] Architecture diagram (from §6) for the pitch.

**Video & Dutch**
- [ ] Ask the organisers on Discord: may the finale Q&A be in English? (Their site says presentations are Dutch, with experts speaking English.)
- [ ] Proofread all Dutch UI text (`app/src/i18n/nl.json` once it exists).
- [ ] Translate the pitch script into a Dutch voiceover; record it.
- [ ] Edit the video: MP4, ≤ 2:00, royalty-free music only.

**Dev**
- [ ] Pre-pitch page + speaker notes (by 13:45)
- [ ] Everything under §5 Must, then Should

## 10. Pre-pitch (Thu 14:00, 5 minutes)

| Time | Content |
|---|---|
| 0:00–1:00 | **Problem:** plans in PDFs every 2 years; different formats, area units and certainty; stations take ~7.5 years |
| 1:00–3:00 | **Concept:** the 5-step flow; the mockup as sketch |
| 3:00–4:00 | **How it differs** from capaciteitskaart / ETM / REV: we're the front door, and we feed those tools |
| 4:00–5:00 | **Questions for TenneT** (below) |

Questions to ask:
1. Do you use TNO's REV (Ruimtelijke Energie Verkenner)? What's missing for you?
2. Would you trust plan data submitted by municipalities and companies? How do you label certainty internally?
3. Who should own the register: the province?
4. Are there (even rough) numbers per substation area we may use?
5. Does our deadline logic (investment plan in January ← pMIEK of the previous February) match reality? Which lead time should we use?
6. Is this most useful at substation level (110 kV), or should it go down to medium voltage?

**→ Write the answers into this file (§12) right after the pre-pitch.**

## 11. Open decisions [DECIDE]

- [ ] Confirm concept + the 3 deep features (after pre-pitch feedback)
- [ ] Product name: "Regionale maatregelkaart" (matches the track title), with or without the sub-brand "NetRadar"
- [ ] Who speaks at the pre-pitch
- [ ] Legend: 3 levels (mockup) vs the capaciteitskaart's 4 categories
- [ ] Hosting: Vercel vs Netlify; shared database yes/no

## 12. Pre-pitch feedback (fill in after 14:00)

_(empty)_
