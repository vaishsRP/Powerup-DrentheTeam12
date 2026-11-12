# Ground-reality research

> Collected Thu 12 Nov 2026. **Status markers:**
> ✅ = we checked the source text ourselves · 🔎 = reported with a source, **to verify before using it in the pitch or video**.
> Rule: no number goes into the pitch unless it has a ✅.

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
  - No new feed-in room.
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
