# data/: real open data

| File | What | Source & license | Retrieved |
|---|---|---|---|
| `drenthe-municipalities.geojson` | Borders of the 12 Drenthe municipalities (generalised; coordinates rounded to 4 decimals). Properties: `code` (CBS code), `name` | CBS *gebiedsindelingen* 2025 via PDOK WFS (`gemeente_gegeneraliseerd`). CBS open data, CC BY 4.0. Attribution: "CBS / PDOK" | 2026-11-12 |
| `drenthe-substations-osm.json` | 18 named high-voltage substations (≥110 kV) in and around Drenthe, operator TenneT: name, voltages, lat/lon, OSM id | © OpenStreetMap contributors, ODbL. Attribution required: "© OpenStreetMap contributors" | 2026-11-12 |
| `real/tennet-cables.geojson` | 457 underground high-voltage cable segments around Drenthe: status, voltage, cable id, construction year | TenneT (TenneT_Assets_Hoogspanning). Attribution: "Bron: TenneT" | 2026-11-12 |
| `real/osm-construction.geojson` | Substations under construction (empty when Overpass is unavailable) | © OpenStreetMap contributors, ODbL | 2026-11-12 |
| `real/drenthe-supply-areas.geojson` | 34 regional supply areas in Drenthe with capaciteitskaart status codes (0–3) for offtake and feed-in, queue MW and requests, plus the TenneT area status and "solved in" year. Made by `scripts/prepare_real_data.py` | Capaciteitskaart, Netbeheer Nederland (ArcGIS services behind capaciteitskaart.netbeheernederland.nl). Attribution: "Bron: Capaciteitskaart, Netbeheer Nederland" | 2026-11-12 |
| `real/drenthe-supply-gaps.geojson` | The parts of Drenthe (about 2%) not covered by any supply area above, drawn grey as "no data" on the map. Made by `scripts/build_supply_gaps.py` | Derived: CBS/PDOK municipality borders minus the capaciteitskaart supply areas | 2026-11-12 |
| `real/drenthe-hv-lines.geojson` | TenneT high-voltage lines in and around Drenthe, merged into one overhead and one underground geometry. Made by `scripts/prepare_real_data.py` | TenneT (TenneT_Assets_Hoogspanning). Attribution: "Bron: TenneT" | 2026-11-12 |
| `real/drenthe-hv-stations.geojson` | 40 TenneT station points (centroids) in and around Drenthe. Made by `scripts/prepare_real_data.py` | TenneT (TenneT_Assets_Hoogspanning). Attribution: "Bron: TenneT" | 2026-11-12 |

Notes:
- *Zeijerveen* (Assen) appears twice: once as the 220 kV yard and once as the 110 kV yard of the same site.
- *Musselkanaal Zandberg* lies just across the border in Groningen province but serves the east of Drenthe.
- Station **service areas** are not public. We approximate them as nearest-station (Voronoi) areas clipped to Drenthe. Say "approximation" in the UI.
- Station **loads and capacities are not public**. All MW values in the app are illustrative.

Wanted next (see `docs/PLAN.md` §9 and `docs/RESEARCH.md` §4):
- `capaciteitskaart-today.csv`: today's status per Drenthe area, read manually from the capaciteitskaart
- Enexis medium-voltage stations / consumption (CC-0, data.overheid.nl), if we drill down below 110 kV

## Note: stations under construction (not yet fetched)

`drenthe-substations-osm.json` only contains existing substations (`power=substation`, ≥110 kV). Planned upgrade sites such as Hoogeveen-Riegmeer, Meppel Noord and Veenoord-Boerdijk may be mapped in OpenStreetMap with the tag `construction:power=substation`. Not checked yet.

Whoever builds the map: run a second Overpass query for that tag inside Drenthe (area `name=Drenthe`, `admin_level=4`) and, if the sites exist, save them as `drenthe-substations-construction-osm.json` with the same attribution (© OpenStreetMap contributors, ODbL). Use them to draw "planned upgrade here" pins that link to the in-service years in `docs/RESEARCH.md` §9–10. If a site is not mapped, place its pin by hand from the TenneT or Enexis project pages.

Also useful: Open Infrastructure Map (openinframap.org) to eyeball stations and voltages. The full Geofabrik Drenthe extract (~60 MB) is not needed.
