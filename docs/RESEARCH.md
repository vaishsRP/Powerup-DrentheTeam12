# Ground-reality research

> Collected Thu 12 Nov 2026. **Status markers:**
> ✅ = we checked the source text ourselves · 🔎 = reported with a source, **to verify before using it in the pitch or video**.
> Rule: no number goes into the pitch unless it has a ✅.

## 0. Official source list from the challenge owner ("Bronnen – track 2")

| Source | Status | Key takeaway |
|---|---|---|
| [TenneT: Provincie Drenthe](https://www.tennet.eu/nl/projecten/provincies/drenthe) | ✅ read (saved from a browser; the site blocks scripts) | See §7: offtake is limited, feed-in has **no room**, plus TenneT's Drenthe projects |
| [TenneT: Netcongestie](https://www.tennet.eu/nl/het-hoogspanningsnet/netcongestie) | ✅ read | Up to €40 bn/yr economic damage in NL; €65 bn TenneT investment over 10 yrs; 8 measures (see §7) |
| [TenneT: Investeringsplannen](https://www.tennet.eu/nl/over-tennet/publicaties/investeringsplannen) | ✅ page read; annexes ⏳ | IP looks **15 years ahead**, updated **every 2 years**; the IP2026 draft went to ACM on **5 Jan 2026**, final in **April 2026** |
| [Provincie Drenthe: Energietransitie](https://www.provincie.drenthe.nl/onderwerpen/natuur-milieu/energietransitie/) | ✅ | pMIEK 1.0 (2023), 2.0, plan of approach 3.0 (July 2025); Drents Actieprogramma Netcongestie |
| [Energievisie Drenthe 2050 (PDF)](https://www.provincie.drenthe.nl/publish/pages/143437/energievisie_2050_een_bouwsteen_voor_de_omgevingsvisie.pdf) | ✅ key items checked | Peak load ×3–5 by 2050 (see §7) |
| [Drentse Energie Aanpak](https://energievoordrenthe.nl/default.aspx) | ✅ | Partnership page; no data |
| [ESR: Energievisies](https://www.energiesysteemenruimte.nl/hulpmiddelen/energievisies/default.aspx) | ✅ | Leads to RVO *Bouwstenen energievisie* and *Handleiding pMIEK*: the de facto project format (see §8) |
| [Netbeheer Nederland: explainer](https://www.netbeheernederland.nl/publicatie/explainer-de-energie-infrastructuur-het-fundament-van-onze-maatschappij) | ⏳ | |
| [Netbeheer Nederland: Prioriteren en reserveren](https://www.netbeheernederland.nl/prioriteren-reserveren) | ⏳ | |
| [Capaciteitskaart: Totaal / Afname](https://capaciteitskaart.netbeheernederland.nl/totaal/afname) | ✅ legend (see §5) | |
| [Enexis investeringsplan 2026 (PDF)](https://edge-www.enexis.nl/v1/media/edge/images/project/enexisnl/enexisnl/over-ons-pdf/enexis-netbeheer-investeringsplan-2026-definitief.pdf) | ⏳ | |

## 1. What already exists (don't rebuild these)

| Tool / process | What it does | Gap we can fill | Status |
|---|---|---|---|
| **Integraal programmeren** (integrated programming) | A 2-yearly cycle, led by each province, agreed by IPO/VNG/Netbeheer Nederland/ministries. Produces a provincial energy vision, a pMIEK and an implementation plan. [RVO](https://www.rvo.nl/onderwerpen/energiesysteem/integraal-programmeren) | Runs on documents and meetings, with no shared data layer | 🔎 |
| **pMIEK Drenthe** | The grid operators supply a long list of projects. A working group weighs them on societal impact (impact if late, geographic spread, size of contribution, multiple sectors). Municipalities reflect on the selection; the provincial executive decides. [Drenthe framework (PDF)](https://www.provincie.drenthe.nl/publish/pages/143092/bijlage_5_afwegingskader.pdf) | Plans arrive as lists and PDFs; no machine-readable link to grid areas or certainty | ✅ framework text checked |
| **Capaciteitskaart** (Netbeheer Nederland) | National map of transport capacity *today*, separately for offtake and feed-in, for TenneT vs regional operators. [Map](https://capaciteitskaart.netbeheernederland.nl/) · [information model](https://netbeheer-nederland.github.io/im-capaciteitskaart) | Shows the present and pending requests, not government plans or the future | ✅ legend text (see §5) |
| **ETM: Energy Transition Model** (Quintel) | Free scenario model from municipality to national level. Netbeheer Nederland's II3050 "Koersvaste Middenweg" scenario has been worked out per province in ETM. [NBNL explanation](https://www.netbeheernederland.nl/sites/default/files/2025-11/toelichting_provinciale_uitwerkingen_km-scenario_v5.0.pdf) | Annual volumes, not per location or per project | 🔎 |
| **REV: Ruimtelijke Energie Verkenner** (TNO). ⚠️ **Closest to our idea.** | Calculates demand and supply from sectoral, spatial and autonomous plans; checks the fit against **substation capacity**; tests variants in *where and when*; shows bottlenecks at a glance. Supports exchange between governments and grid operators. TNO itself says it **needs further development**. [TNO paper (PDF)](https://publications.tno.nl/publication/34645457/miBNA7ti/TNO-2025-M12493.pdf) | An expert calculation tool, not a shared multi-party intake. **Position ourselves as the front door that feeds REV/ETM, not as a competitor.** | ✅ TNO text checked |
| **ESDL / MapEditor / ESSIM** (TNO) | An open language for describing energy systems, plus a map editor and a simulator. Used in RES and heat-planning pilots. [ESDL docs](https://energytransition.gitbook.io/esdl) | Expert tooling; little uptake by governments. **Good export target for us.** | 🔎 |
| **Klimaatmonitor** (Rijkswaterstaat) | Municipal energy and renewables statistics | Looks backward only, with data lagging by years | 🔎 |
| **CES / Cluster 6** | Cluster energy strategies of industry, incl. dispersed industry ("cluster 6"). Grid operators need location, capacity, likelihood and date, but that data is commercially sensitive. PBL recommends a "data safe house". [PBL](https://www.pbl.nl/nieuws/2022/verduurzaming-industrie-concurrentiegevoelige-gegevens-nodig-voor-planning-energie-infrastructuur) | → our **confidentiality level per plan** | 🔎 |

## 2. Pain points practitioners report

- **No common data format.** TNO calls for shared vocabulary and indicators, a uniform way of planning and reporting, and a uniform digital data format. Regional plans can't be added up. [TNO](https://publications.tno.nl/publication/34645457/miBNA7ti/TNO-2025-M12493.pdf) ✅ (partly checked)
- **Process is overloaded, fragmented, opaque and non-committal.** Prioritisation is poorly justified; grid-capacity info is shared too little; prioritised projects often don't actually get priority. [PBL, Nov 2025](https://www.pbl.nl/node/9913) 🔎
- **Different scales.** Municipal borders ≠ substation service areas (TNO, same paper). ✅
- **Timing.** Drenthe: grid investment plans go to ACM in **January**, based partly on the pMIEK adopted in **February of the year before** (Drenthe framework). ✅
- **Lead times.** Expanding an existing 220/110 kV station takes ≈7.5 years, ≈4 with the 2026 emergency measures. A new 110 kV connection takes ≈10 years, ≈6 with the measures. [Solarmagazine, Sept 2026](https://solarmagazine.nl/nieuws-zonne-energie/i44755/uitbreiding-stroomnet-voortaan-grotendeels-zonder-vergunning-kabinet-dringt-vertraging-fors-terug) 🔎. The HackPack says permit procedures alone can take 5–7 years ✅.
- **Drenthe now:**
  - No new feed-in room (✅ confirmed by TenneT's own Drenthe page; see §7).
  - New **Wijster 220 kV** station expected **2029**; **Veenoord-Boerdijk 380 kV** expected **2031** (two years late).
  - The new transformer at Assen Zeijerveen added offtake capacity only.

  [Solarmagazine, Dec 2025](https://solarmagazine.nl/nieuws-zonne-energie/i42429/ruimte-voor-teruglevering-op-stroomnet-groningen-wachtlijst-drenthe-en-overijssel-blijft) 🔎
- **Bottlenecks depend on each other across voltage levels.** At Emmen Bargermeer, Enexis found medium-voltage room it cannot release because TenneT's grid is congested. [Solarmagazine](https://solarmagazine.nl/nieuws-zonne-energie/i44927/enexis-meldt-33-nieuwe-knelpunten-op-stroomnet-in-5-provincies-gebieden-kleuren-oranje-op-capaciteitskaart) 🔎
- **Energy follows spatial planning instead of shaping it.** Grid operators want an "energy test" for spatial plans. [NBNL vision on energy planning (PDF)](https://www.netbeheernederland.nl/sites/default/files/2025-11/251023_nbnl_visie_energieplanologie.pdf) 🔎
- **National status (autumn 2026):**
  - ~15,000 requests on regional waiting lists.
  - One integrated waiting list with priority for public functions since 1 July 2026.
  - From 1 Oct 2026, municipalities can request capacity earlier for planned housing and schools.

  [Omgevingsweb](https://omgevingsweb.nl/beleid/netcongestie-van-crisisaanpak-naar-structurele-sturing/) 🔎
- **HackPack facts** ✅:
  - Evening peak 16:00–21:00.
  - Regional waiting lists: >14,000 offtake requests (~9,130 MW) and >8,500 feed-in requests (~4,590 MW).
  - Grid operators invest >€8 billion per year.
  - The ACM prioritisation framework applies from mid-2026.

## 3. Real congestion-relief instruments (use these exact names)

Source: [ACM overview of congestion measures, 30 Apr 2025 (PDF)](https://bouwstenen.nl/sites/default/files/uploads/overzicht-netcongestiemaatregelen-acm_0.pdf) 🔎, unless noted otherwise.

| Dutch name | What it is | Use in our tool |
|---|---|---|
| **Cable pooling** | Wind, solar and storage share one grid connection | Pair supply plans with a battery |
| **Groepstransportovereenkomst (GTO)** | A group of users shares one capacity amount: the energy-hub contract. Available from **2027** ([ACM](https://www.acm.nl/nl/publicaties/codebesluit-groepstransportovereenkomst)) | Pair feed-in and offtake in one area / business park |
| **Tijdsblokgebonden transportrecht** | Regional grids: transport only in agreed time blocks | Take a demand plan out of the 16–21h peak |
| **Tijdsduurgebonden transportrecht** | TenneT grid: transport during ≥85 % of hours, ~50 % cheaper | Large users on the TenneT grid |
| **Volledig variabel transportrecht** (formerly "non-firm ATO") | Capacity announced day-ahead, ~50 % cheaper | Flexible demand (e.g. electrolyser) |
| **Congestiemanagement / CBC** | Redispatch or a capacity-limitation contract, via a congestion service provider (CSP). Participation is obligatory for connections ≥ 1 MW | Large users |
| **GOPACS** | The platform where flexibility for congestion is offered | Mention as the market channel |
| **Maatschappelijk prioriteren** | ACM priority categories: (1) congestion relievers such as batteries, (2) safety, (3) basic needs | Batteries get priority |
| **Time-of-use network tariffs** | In force for TenneT; in preparation for regional grids | Background |

## 4. Open data we can use

| Data | Format / access | Status in repo |
|---|---|---|
| Municipality borders 2025 (CBS via PDOK) | GeoJSON, open | ✅ `data/drenthe-municipalities.geojson` |
| TenneT HV substations (≥110 kV) in and around Drenthe | OpenStreetMap (Overpass API), ODbL | ✅ `data/drenthe-substations-osm.json` |
| Capaciteitskaart status today | Website blocks scripts. **Read it manually in a browser** (task in PLAN.md §9) | ⏳ |
| Enexis medium-voltage station locations | [data.overheid.nl](https://data.overheid.nl/dataset/enexis-poi-data), ZIP, CC-0 | not yet |
| Enexis aggregated consumption | [data.overheid.nl](https://data.overheid.nl/dataset/enexis-verbruiksdata), CSV | not yet |
| Enexis congestion reports per area | PDFs, e.g. [Hoogeveen feed-in](https://www.enexis.nl/-/media/enexis-nl/pdf-documents/congestieonderzoeken/drenthe/congestiemanagementrapport-invoeding-hoogeveen-ms01-herziening-17-oktober-2024.pdf) | not yet (good for realistic numbers) |
| Klimaatmonitor per municipality | [data.overheid.nl](https://data.overheid.nl/dataset/9081-klimaatmonitor---database) download | not yet |
| RES Drenthe | Target 3.45 TWh, ~58 % reached in 2025 [(progress doc)](https://raad.tynaarlo.nl/documenten/Bijlage-1-Voortgangsdocument-RES-regio-Drenthe-2025.pdf) | 🔎 |
| Station load per substation in Drenthe | **Not public.** Use illustrative numbers, clearly labelled | — |
| RENDO open data | None found | — |

## 5. Capaciteitskaart legend (exact wording) ✅

| Dutch | English |
|---|---|
| Transportcapaciteit beschikbaar zonder wachtrij | Transport capacity available, no queue |
| Transportcapaciteit beperkt beschikbaar zonder wachtrij | Transport capacity limited, no queue |
| Gebied is in onderzoek met wachtrij | Area under investigation, with queue |
| Tekort aan transportcapaciteit met wachtrij | Transport capacity shortage, with queue |

The map has tabs *Totaal / Regionale Netbeheerder / TenneT* and a toggle *Afname / Teruglevering* (offtake / feed-in). Its colours were not machine-readable; TenneT's challenge deck shows the map in red / orange / yellow / uncoloured.

## 6. Gaps nobody fills well (our opportunity)

1. A **shared, structured plan register**: the "one form" (TNO and PBL both ask for it).
2. **Certainty on both sides**: plan maturity *and* grid-upgrade certainty or delay.
3. **Timeline clash / deadline detection** tied to the real pMIEK → investment-plan cycle. The research found this nowhere else.
4. **Plan-level matching** of feed-in and offtake in the same station area, with the right instrument (cable pooling, GTO, time-block contract, battery).
5. **A structured project sheet for the pMIEK discussion.** It supports the conversation; it is *not* a score.
6. **Confidentiality per record**: a light version of the "data safe house".

## 7. Drenthe facts from TenneT and the province (pitch-ready ✅)

**TenneT's Drenthe page** (tennet.eu, saved 12 Nov 2026):
- **Offtake:** Drenthe is "relatively good". Since **January 2025** there has again been **limited room** on the high-voltage grid, so a large part of Drenthe is **yellow** on the capaciteitskaart. ✅
- **Feed-in: no room.** The latest feed-in congestion study (**December 2025**) found no room, so **no new solar or wind parks can be connected at the moment**. ✅
- The Drenthe grid was largely built in the **1960s** and is "historically lightly built". ✅
- **TenneT's approach has three parts:**
  - *uitbreiden* (extend): new HV and MV stations and connections
  - *verzwaren* (upgrade): higher-capacity components
  - *deelnetten* (sub-grids): **three sub-grids** connected to the 220 kV and 380 kV grids

  ✅
- **Biggest challenges per TenneT:** availability of skilled people and materials, and long procedures. TenneT discusses progress with province, municipalities and partners in the **Energy Board**. ✅
- **Projects listed:**
  - Gasselte Kraanlanden: expansion and renewal of an HV station *(planning)*
  - Station Hoogeveen Riegmeer: new HV station *(active)*
  - Elektriciteitsstation Meppel Noord: new HV station *(active)*
  - Deelnet Emmen: grid reinforcement *(planning)*
  - Drents Overijsselse Netversterking: grid reinforcement, Drenthe and Overijssel *(planning)*

  ✅ The list has a second page that we haven't captured yet. News items also mention **Wijster** (Council of State ruling on its zoning plan, May 2026), **Veenoord-Boerdijk** (mast construction, Sept 2026), **Assen Zeijerveen**, and a **limited release of HV capacity in Groningen and Drenthe (19 Oct 2026)**.

**TenneT's Netcongestie page:**
- Economic damage from congestion in NL: **up to €40 bn per year**. ✅
- TenneT invests **€65 bn in the next 10 years** in the national HV grid. ✅
- **TenneT's own 8 measures:**
  1. build a lot
  2. the national congestion programme (LAN)
  3. load the existing grid more heavily
  4. split the grid into *deelnetten* (sub-grids)
  5. innovation (using the grid's "emergency lane", dynamic line rating)
  6. GOPACS
  7. energy hubs
  8. new contract forms

  ✅
- *Spitsmijden* ("peak avoiding") = flexible electricity use: use power during the day instead of in the evening. ✅

**Energievisie Drenthe 2050 (province, Oct 2025):**
- "The energy transition in Drenthe leads roughly to a **tripling to quintupling of peak load** on the electricity grid" (without extra measures). ✅
- Other numbers, 🔎 (not yet checked against the PDF):
  - 2023 use 11.85 TWh, 27 % renewable
  - 2050 demand 8.8 TWh, with electricity rising from 2.41 to 5.29 TWh
  - RES target 3.45 TWh in 2030
- **Named hydrogen and heat locations** (🔎, good for realistic demo plans):
  - hydrogen backbone at Emmen, with branches to Hoogeveen, Meppel and Coevorden
  - electrolysis projects in Emmen and Nieuw-Buinen
  - Attero Wijster residual heat to Hoogeveen, Beilen and Assen
- **The province does not choose locations.** Location choices belong to the regional partnership of municipalities, province and partners. 🔎
- Provincial council: concentrate on 2–3 strategic locations first; "not every company can be facilitated everywhere". 🔎

## 8. The de facto standard for project data: RVO *Handleiding pMIEK* (June 2024) ✅

There is **no** fixed format for energy visions. RVO *Bouwstenen* says "the structure of an energy vision is not fixed". But the national **pMIEK manual** prescribes what each project needs. Our plan card builds on this.

- **Project list** (mandatory fields): name, location, infrastructure type and size, planning (delivery year and phases), parties and roles, whether it was already in a previous pMIEK. 🔎 field list
- **Projectfiche** (project sheet), ✅ exists as Annex 3. Contents: description, the societal development it enables, which grid-operator investment plan it targets (IP2026 / IP2028 / later), project phase, dependencies, agreements, competent authority (*bevoegd gezag*).
- **Official project phases** ✅:

  | Dutch phase | English | What it means |
  |---|---|---|
  | *onderzoeksagenda* | research agenda | questions can't be answered yet |
  | *verkenningsproject* | exploration | energy demand or location not settled |
  | *concreet project* | concrete | location known; in the grid operator's investment plan; no project decision yet |
  | *realisatiefase* | realisation | investment decision taken |
- **The pMIEK should not contain every project.** Our register is broader; "in pMIEK" is a flag on a plan. 🔎
- **Recommendations in the manual** (from TNO, PBL and RVO): a **joint provincial database with confidentiality**, **uniform data formats** for grid operators, aggregation agreements, and source citation. This is exactly our concept. 🔎 exact wording
- **RVO *Bouwstenen*:** structuring choices can be *inventariserend* (list them), ***agenderend*** (state **who must decide what, and by when**) or *sturend* (decide now). ✅ Our deadline checker automates *agenderen*.

## 9. Enexis investment plan 2026: the province asked for our tool ⭐

Source: [Enexis Investeringsplan 2026 (PDF, 257 pp.)](https://edge-www.enexis.nl/v1/media/edge/images/project/enexisnl/enexisnl/over-ons-pdf/enexis-netbeheer-investeringsplan-2026-definitief.pdf). Page numbers are PDF pages.

**The key quote (✅ checked word for word, consultation responses annex, ~p.195).** In its formal response to the draft plan, the **Province of Drenthe** wrote (translated):
> "For the province and municipalities it is crucial to know **at IBN level [in-service date] when and where capacity becomes available**, so that spatial decisions and phasing can be based on it. … We ask Enexis to **explicitly mark projects that are delayed (e.g. with a red/orange indication)**, give them a concrete acceleration path, and include a **fixed quarterly report** to the province and municipalities on **progress, changes and required administrative decisions**."

Enexis replied that the investment plan "is a **static document updated only once every two years**", so it is not suitable for that. ✅ The Municipality of Groningen similarly complained the plan is at "too high an aggregation level" (~p.226, 🔎).
→ **The province's own request is our product spec.** Pitch line: *"The province asked for this in writing. The investment plan can't do it. A live shared register can."*

**Lead times (Enexis, ~p.62):**
- Transformer upgrade: just under **1 year** (excluding initiation). ✅
- Extending an existing station: **~4 years** (13 + 29 + 18 months). ✅
- New HV/MV station: **~7 years**, plus initiation. 🔎

**Real Drenthe station dates (Enexis IP2026 tables).** "Desired" = when the bottleneck must be solved; "feasible" = when Enexis can deliver, including TenneT's part (*maakbare IBN*). **Lead** = expected project duration in years. Opdracht = commissioned; Studie = study. ✅ = checked against the source table; others 🔎.

| Station / project | Measure | Status | Desired | Feasible | Lead (yrs) |
|---|---|---|---|---|---|
| Veenoord-Boerdijk (new station) | new HV/MV station | Opdracht | 2027 | **2031** ✅ | 8 ✅ |
| Wijster (new station) | new HV/MV station | Opdracht | 2027 | **2029** ✅ | 6 ✅ |
| Hoogeveen | transformer upgrade + MV | Opdracht | 2026 | 2027 (+2 yrs, permits) | 4 |
| Meppel / Meppel Noord | extension / new station | Opdracht | 2026 / 2027 | 2027 / 2028 | 3 / 7 |
| Gasselte-Kraanlanden | HV bay + transformer | Opdracht | 2026 | 2029 | 3 |
| Emmen Bargermeer | transformer upgrade | Studie | 2027 | 2029 | 5 |
| Emmen Weerdinge | HV bay + transformer | Studie | 2026 | 2030 | 4 |
| Assen Marsdijk | HV bay + transformer | Studie | 2026 | 2031 | 3 |
| Veenoord | transformer upgrade | Studie | 2026 | 2031 | 4 |
| Klazienaveen Zwet | transformer upgrade | Studie | 2026 | 2031 | 3 |
| Omgeving Assen (pMIEK) | new station | Studie | 2030 | 2035 | 7 |
| Omgeving Coevorden | new station | Studie | 2030 | >2035 | 7 |

The table also lists MW shortfall ranges across 3 scenarios (e.g., Hoogeveen offtake 26.8–57.8 MW) 🔎. These can replace some of our illustrative numbers. Overall, in Drenthe the desired date is often **2026** while the feasible date is **2029–2031**.

**How grid operators plan (🔎 unless marked):**
- **Cycle:** investment plan every 2 years, 10-year horizon. Draft around 1 Nov → ACM on 1 Jan → approval by 1 Apr. The next one, **IP2028**, is the first under the new Energy Act.
- **Certainty:** "high certainty for the first 3 years (regional operators) to 5 years (national); the rest only qualitative".
- **Priority order:**
  1. bottlenecks from autonomous growth
  2. **projects the provinces marked as pMIEK** ✅ (p.29)
  3. the rest, by energy not served

  Exploratory pMIEK projects were "not yet concrete enough" to be prioritised ✅ (p.32). → **Plan maturity matters.**
- **Inputs used:**
  - RES
  - province surveys for neighbourhood-level housing data
  - municipal heat visions (Transitievisie Warmte) and surveys
  - IBIS (the business parks database)
  - waiting-list data
  - CES
  - ElaadNL (EV charging forecasts)

  Our register would replace several separate surveys with one intake.
- **Delays:** more than 40 of ~90 major projects are delayed, on average by more than a year. Main cause: spatial procedures (permits, zoning, land).

**Prioritising and reserving** ([Netbeheer Nederland](https://www.netbeheernederland.nl/prioriteren-reserveren), 🔎):
- **Reserving capacity for small users ended on 1 July 2026.** Everyone is now on one waiting list, ordered by social function: congestion relievers / safety / basic needs (incl. housing and education). **→ Don't build a "reserve capacity" feature.**
- Municipalities and provinces get an exception to **apply earlier for future housing and education projects**. The details are still being worked out.
- Keep two queues separate in the tool: **grid-expansion priority** (pMIEK → investment plan) vs **customer waiting-list priority** (ACM framework).
- "Prioritising is about order, not extra capacity."

**Vocabulary:**

| Dutch | English |
|---|---|
| IBN (inbedrijfname) | in-service date |
| maakbare IBN | feasible in-service date |
| uiterlijk startmoment | latest start date |
| doorlooptijd | lead time |
| maakbaarheidsgat | feasibility gap |
| autonome groei | autonomous growth |
| jaar van optreden | year the bottleneck occurs |
| verkenningsproject | exploratory project |
| zienswijze | consultation response |
| netbewust bouwen | grid-aware building |
