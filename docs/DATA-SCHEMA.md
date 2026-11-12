# The plan card: the shared intake format ("one form")

> **Status: draft v0.1. Proposed, open for team comments.** This is the core of our answer to TenneT's question.
> Design principle: **as few fields as possible** that a municipal planner can fill in within 5 minutes, but enough for a grid operator to calculate with.
> **What exists:** the national **RVO *Handleiding pMIEK*** (June 2024) prescribes a project list and a *projectfiche* (project sheet) for infrastructure projects, with four official phases. They are Word/PDF templates, not data. The same manual recommends a joint provincial database with confidentiality and uniform data formats (see RESEARCH.md §8).
> **Our plan card = the projectfiche turned into live, shared, machine-readable data**, extended to the *developments* behind the grid projects: housing, solar parks, industry. Grid upgrades use the official pMIEK phases. Export to ESDL is on the roadmap, so existing tools (REV, ETM) can read it.

## 1. Plan card (one row = one plan)

| Field | Type | Required | Example | Notes |
|---|---|---|---|---|
| `id` | string | yes | `p-emmen-007` | stable id |
| `title_nl` | string | yes | `Elektrolyser Emmen` | shown in Dutch UI |
| `title_en` | string | yes | `Electrolyser Emmen` | shown in English UI |
| `party_type` | enum | yes | `company` | `province` · `municipality` · `grid_operator` · `company` · `public_body` |
| `party_name` | string | yes | `Gemeente Emmen` | Who submits (companies may be anonymised in public view) |
| `category` | enum | yes | `hydrogen` | see §3 |
| `mw_offtake` | number | yes* | `50` | Peak MW taken from the grid (0 if none) |
| `mw_feed_in` | number | yes* | `0` | Peak MW fed into the grid (0 if none) |
| `mw_flex` | number | no | `0` | MW of peak it can shave or shift (batteries, flexible demand) |
| `profile` | enum | yes | `flexible` | 24h shape: `evening_peak` · `daytime_solar` · `wind` · `flat` · `night` · `flexible` |
| `lat`, `lon` | number | yes | `52.765`, `6.930` | Location; the station area is derived from this |
| `municipality` | string | yes | `Emmen` | CBS municipality name |
| `year_needed` | integer | yes | `2029` | First year the grid capacity is needed |
| `maturity` | enum | yes | `planned` | `idea` · `planned` · `permit` · `contracted`, see §2 |
| `confidentiality` | enum | yes | `grid_operator_only` | `public` · `partners` · `grid_operator_only` |
| `source_document` | string | yes | `Cluster-energiestrategie 2025` | Where this plan is written down today |
| `source_url` | string | no | | link if public |
| `impact_if_late_nl/_en` | text | no | | for the pMIEK discussion (Drenthe framework question) |
| `sectors` | list | no | `industry;mobility` | for the pMIEK question "does it serve multiple sectors?" |
| `updated_at` | date | yes | `2026-11-12` | for the "what changed since last cycle" feed |
| `societal_goal_nl/_en` | text | no | | the societal development this enables (projectfiche field) |
| `competent_authority` | string | no | `Gemeente Emmen` | *bevoegd gezag*: who grants permits (projectfiche field) |
| `dependencies` | list | no | `g-emmen-deelnet` | ids of plans or grid upgrades this depends on |
| `in_pmiek` | boolean | no | `false` | flag only: the pMIEK should not contain every plan |

\* At least one of `mw_offtake` / `mw_feed_in` / `mw_flex` must be > 0.

## 2. Maturity levels and default weights

| Maturity | Meaning | Default weight in the "expected" scenario |
|---|---|---|
| `idea` | Mentioned in a vision or strategy; no location or decision | 0.25 |
| `planned` | In an adopted plan or programme; location roughly known | 0.5 |
| `permit` | Permit applied for or granted | 0.75 |
| `contracted` | Connection or transport contract signed / investment decision taken | 0.95 |

Scenarios:
- **contracted only** (most conservative)
- **expected** (weighted)
- **everything** (all at 100 %)

Weights are a setting. **Validate them with TenneT.**

## 3. Categories

| `category` | NL label | Typical `profile` |
|---|---|---|
| `housing` | Woningbouw | evening_peak |
| `heat` | Warmtetransitie (warmtepompen / warmtenet) | evening_peak |
| `business_park` | Bedrijventerrein | flat |
| `industry` | Elektrificatie industrie | flat |
| `charging` | Laadplein | evening_peak / night |
| `rail` | Spoor (tractie) | flat |
| `hydrogen` | Elektrolyser (waterstof) | flexible |
| `solar` | Zonnepark | daytime_solar |
| `wind` | Windpark | wind |
| `battery` | Batterij | flexible |
| `other` | Overig | flat |

## 4. Grid upgrades (submitted by grid operators)

| Field | Type | Example |
|---|---|---|
| `id` | string | `g-wijster-220` |
| `station` | string | `Wijster` |
| `operator` | enum | `TenneT` · `Enexis` · `RENDO` |
| `title_nl` / `title_en` | string | `Nieuw 220 kV-station Wijster` |
| `year_expected` | integer | `2029` |
| `mw_added_offtake` / `mw_added_feed_in` | number | illustrative |
| `pmiek_phase` | enum | `research_agenda` · `exploration` · `concrete` · `realisation`. These are the **official pMIEK phases** (RVO Handleiding pMIEK; see RESEARCH.md §8) |
| `target_ip` | enum | `IP2026` · `IP2028` · `later`: which grid-operator investment plan it is in or targets (projectfiche field) |
| `delay_years` | number | `2` (grid-side certainty: shows delayed upgrades) |
| `source_document` | string | `Investeringsplan 2026` |

## 5. Station areas (derived, not submitted)

| Field | Example | Notes |
|---|---|---|
| `id`, `name` | `emmen-bargermeer`, `Emmen Bargermeer` | real station names (OpenStreetMap / TenneT) |
| `base_offtake_mw`, `base_feed_in_mw` | | 2026 peak, **illustrative** (station load isn't public) |
| `cap_offtake_mw`, `cap_feed_in_mw` | | 2026 capacity, **illustrative** |
| `growth_offtake`, `growth_feed_in` | `0.025` | background growth per year (EVs, heat pumps, rooftop solar) |

## 6. CSV template (header row)

```csv
id,title_nl,title_en,party_type,party_name,category,mw_offtake,mw_feed_in,mw_flex,profile,lat,lon,municipality,year_needed,maturity,confidentiality,source_document,source_url,impact_if_late_nl,impact_if_late_en,sectors,updated_at
```

Governments work in Excel, so the same columns work as an `.xlsx` template.

## 7. Export targets (roadmap; mention in the pitch, don't build fully)

- **CSV**: a per-area, per-year load forecast for grid operators' investment planning.
- **pMIEK project sheet**: one page per area or plan, answering Drenthe's discussion questions.
- **ESDL**: map categories to ESDL asset types (check the [ESDL docs](https://energytransition.gitbook.io/esdl)) so REV, ETM and ESSIM can read our register.
