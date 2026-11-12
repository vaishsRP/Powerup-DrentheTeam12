"""
Build the app's data files in data/app/ (the shapes are defined in docs/CONTRACT.md).

- areas.geojson : station areas = nearest-substation (Voronoi) cells around real TenneT 110 kV stations,
                  clipped to the real Drenthe border. MW values are ILLUSTRATIVE (station loads aren't public).
- upgrades.json : grid upgrades with REAL desired/feasible years from Enexis IP2026 (docs/RESEARCH.md §9);
                  MW added is illustrative.
- plans.json    : a few ILLUSTRATIVE plan cards to get started; replace/extend with the real demo set.

Run from the repo root:  pip install shapely scipy numpy   then   python scripts/build_demo_data.py
Later: when data/real/capaciteitskaart-*.geojson exists, swap the Voronoi areas for the real supply areas.
"""
import json
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import shape, Point, Polygon, mapping
from shapely.ops import unary_union

# ---------- 1. Stations: dedupe and drop near-duplicates ----------
raw = json.load(open("data/drenthe-substations-osm.json"))
stations = raw if isinstance(raw, list) else next(v for v in raw.values() if isinstance(v, list))
DROP = {"220 kV Zeijerveen",          # same site as 110 kV Zeijerveen
        "110 kV Emmen AKZO",          # ~1.4 km from Emmen Bargermeer, likely an industrial customer station
        "110 kV Coevorden Europark"}  # next to Coevorden
stations = [s for s in stations if s["name"] not in DROP]


def slug(name):
    return name.replace("110 kV ", "").lower().replace(" ", "-")


# ---------- 2. Voronoi cells clipped to Drenthe ----------
muni = json.load(open("data/drenthe-municipalities.geojson"))
drenthe = unary_union([shape(f["geometry"]) for f in muni["features"]]).buffer(0)

pts = np.array([[s["lon"], s["lat"]] for s in stations])
far = np.array([[3, 50], [3, 56], [10, 50], [10, 56]])  # far-away dummy points close every cell
vor = Voronoi(np.vstack([pts, far]))

# ILLUSTRATIVE numbers per area (MW): offtake mostly "limited", feed-in full (matches TenneT: no feed-in room)
rng = np.random.default_rng(12)
areas = []
for i, s in enumerate(stations):
    region = vor.regions[vor.point_region[i]]
    cell = Polygon([vor.vertices[v] for v in region]).intersection(drenthe)
    if cell.is_empty:
        continue  # e.g. Musselkanaal (Groningen side) if it gets no Drenthe land
    cap_off = float(rng.choice([60, 80, 100, 120]))
    cap_in = float(rng.choice([40, 60, 80]))
    areas.append({
        "type": "Feature",
        "geometry": mapping(cell.simplify(0.002)),
        "properties": {
            "id": slug(s["name"]),
            "name": s["name"].replace("110 kV ", ""),
            "station": s["name"],
            "base_offtake_mw": round(cap_off * float(rng.uniform(0.70, 0.92)), 1),
            "cap_offtake_mw": cap_off,
            "base_feed_in_mw": round(cap_in * float(rng.uniform(0.98, 1.15)), 1),
            "cap_feed_in_mw": cap_in,
            "growth_offtake": 0.03,
            "growth_feed_in": 0.02,
            "demo": True,
        },
    })
json.dump({"type": "FeatureCollection", "features": areas}, open("data/app/areas.geojson", "w"), ensure_ascii=False)
area_ids = {a["properties"]["id"] for a in areas}
print("areas:", sorted(area_ids))

# ---------- 3. Upgrades: REAL years (Enexis IP2026, RESEARCH.md §9), ILLUSTRATIVE MW ----------
U = [
    # id, area, title_nl, title_en, desired, feasible, verified(✅ in RESEARCH), lead_years, kind
    ("veenoord-boerdijk", "veenoord", "Nieuw station Veenoord-Boerdijk", "New station Veenoord-Boerdijk", 2027, 2031, True, 8, "new_station"),
    ("wijster", "wijster-oosterscheveld", "Nieuw station Wijster", "New station Wijster", 2027, 2029, True, 6, "new_station"),
    ("hoogeveen", "hoogeveen", "Hoogeveen: trafo-uitbreiding", "Hoogeveen: transformer upgrade", 2026, 2027, False, 4, "transformer"),
    ("meppel", "meppel", "Meppel: uitbreiding station", "Meppel: station extension", 2026, 2027, False, 3, "extension"),
    ("gasselte", "gasselte-kraanlanden", "Gasselte-Kraanlanden: HS-veld + trafo", "Gasselte-Kraanlanden: HV bay + transformer", 2026, 2029, False, 3, "extension"),
    ("emmen-bargermeer", "emmen-bargermeer", "Emmen Bargermeer: trafo-uitbreiding", "Emmen Bargermeer: transformer upgrade", 2027, 2029, False, 5, "transformer"),
    ("emmen-weerdinge", "weerdinge", "Emmen Weerdinge: HS-veld + trafo", "Emmen Weerdinge: HV bay + transformer", 2026, 2030, False, 4, "extension"),
    ("assen-marsdijk", "assen-marsdijk", "Assen Marsdijk: HS-veld + trafo", "Assen Marsdijk: HV bay + transformer", 2026, 2031, False, 3, "extension"),
    ("klazienaveen", "klazienaveen-zwet", "Klazienaveen Zwet: trafo-uitbreiding", "Klazienaveen Zwet: transformer upgrade", 2026, 2031, False, 3, "transformer"),
]
ADDED = {"new_station": 80, "extension": 40, "transformer": 25}  # ILLUSTRATIVE MW per upgrade type
upgrades = []
for uid, area, tnl, ten, desired, feasible, verified, lead, kind in U:
    if area not in area_ids:
        print("WARNING: upgrade", uid, "points to unknown area", area)
    upgrades.append({
        "id": uid, "area_id": area, "operator": "Enexis/TenneT", "title_nl": tnl, "title_en": ten,
        "year_desired": desired, "year_feasible": feasible, "lead_years": lead, "kind": kind,
        "mw_added_offtake": ADDED[kind], "mw_added_feed_in": ADDED[kind],   # ILLUSTRATIVE
        "source_document": "Enexis Investeringsplan 2026", "years_verified": verified,
    })
json.dump(upgrades, open("data/app/upgrades.json", "w"), ensure_ascii=False, indent=1)

# ---------- 4. A few ILLUSTRATIVE plan cards (schema: docs/DATA-SCHEMA.md) ----------
P = [
    ("p-001", "Zonnepark met batterij", "Solar park with battery", "company", "solar", 0, 25, 10, "daytime_solar", 52.72, 6.86, "Emmen", 2027, "permit"),
    ("p-002", "Uitbreiding bedrijventerrein", "Business park extension", "municipality", "business_park", 12, 0, 0, "flat", 52.71, 6.83, "Coevorden", 2028, "planned"),
    ("p-003", "Woningbouw 600 woningen", "Housing, 600 homes", "municipality", "housing", 4, 0, 0, "evening_peak", 52.99, 6.56, "Assen", 2028, "planned"),
    ("p-004", "Laadplein vrachtwagens", "Truck charging hub", "company", "charging", 8, 0, 4, "night", 52.73, 6.48, "Hoogeveen", 2029, "idea"),
    ("p-005", "Elektrolyser", "Electrolyser", "company", "hydrogen", 20, 0, 20, "flexible", 52.77, 6.92, "Emmen", 2030, "idea"),
    ("p-006", "Warmtepompen wijk", "Heat pumps, neighbourhood", "municipality", "heat", 3, 0, 0, "evening_peak", 52.69, 6.20, "Meppel", 2027, "planned"),
    ("p-007", "Elektrificatie fabriek", "Factory electrification", "company", "industry", 10, 0, 3, "flat", 52.79, 6.51, "Midden-Drenthe", 2028, "contracted"),
    ("p-008", "Zonnepark", "Solar park", "company", "solar", 0, 15, 0, "daytime_solar", 52.98, 6.80, "Aa en Hunze", 2027, "permit"),
]
cells = [(a["properties"]["id"], shape(a["geometry"])) for a in areas]
plans = []
for pid, tnl, ten, ptype, cat, off, fin, flex, prof, lat, lon, mun, yr, mat in P:
    p = Point(lon, lat)
    area = next((aid for aid, c in cells if c.contains(p)), min(cells, key=lambda c: c[1].distance(p))[0])
    plans.append({
        "id": pid, "title_nl": tnl, "title_en": ten, "party_type": ptype, "party_name": "Demo",
        "category": cat, "mw_offtake": off, "mw_feed_in": fin, "mw_flex": flex, "profile": prof,
        "lat": lat, "lon": lon, "municipality": mun, "area_id": area, "year_needed": yr, "maturity": mat,
        "confidentiality": "public", "source_document": "Demo · fictieve gegevens", "updated_at": "2026-11-12",
        "demo": True,
    })
json.dump(plans, open("data/app/plans.json", "w"), ensure_ascii=False, indent=1)
print(f"wrote {len(areas)} areas, {len(upgrades)} upgrades, {len(plans)} plans to data/app/")
