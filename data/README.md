# data/: real open data

| File | What | Source & license | Retrieved |
|---|---|---|---|
| `drenthe-municipalities.geojson` | Borders of the 12 Drenthe municipalities (generalised; coordinates rounded to 4 decimals). Properties: `code` (CBS code), `name` | CBS *gebiedsindelingen* 2025 via PDOK WFS (`gemeente_gegeneraliseerd`). CBS open data, CC BY 4.0. Attribution: "CBS / PDOK" | 2026-11-12 |
| `drenthe-substations-osm.json` | 18 named high-voltage substations (≥110 kV) in and around Drenthe, operator TenneT: name, voltages, lat/lon, OSM id | © OpenStreetMap contributors, ODbL. Attribution required: "© OpenStreetMap contributors" | 2026-11-12 |

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
