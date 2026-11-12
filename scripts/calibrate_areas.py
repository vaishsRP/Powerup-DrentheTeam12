"""Calibrate the illustrative station-area loads to today's real capaciteitskaart.

The projection map starts from today's status and changes it with the modelled growth and grid upgrades.
For that to line up with the 'Today' map, each area's 2026 load (base_*_mw) is set from the real status of
the capaciteitskaart supply areas inside it (area-weighted), keeping the illustrative capacity:

    code 0 'capacity available'          -> load = 70 % of capacity  (room)
    code 1 'limited, no queue'           -> load = 92 % of capacity  (limited)
    code 2 'under study, with queue'     -> load = 104 % of capacity (bottleneck)
    code 3 'shortage, with queue'        -> load = 110 % of capacity (bottleneck)

The status per direction is the worse of the regional and the TenneT code, as on the Today map.
MW values stay ILLUSTRATIVE: real station loads are not public. Only the status pattern is real.
Run from the repo root after build_demo_data.py:  python scripts/calibrate_areas.py
"""
import json

from shapely.geometry import shape

TARGET = {0: 0.70, 1: 0.92, 2: 1.04, 3: 1.10}
KEY = {"afname": "offtake", "teruglevering": "feed_in"}

areas = json.load(open("data/app/areas.geojson", encoding="utf-8"))
real = json.load(open("data/real/drenthe-supply-areas.geojson", encoding="utf-8"))["features"]
real = [(shape(f["geometry"]).buffer(0), f["properties"]) for f in real]


def code(p, d):
    return max(p.get(f"code_{d}") or 0, p.get(f"tennet_code_{d}") or 0)


for f in areas["features"]:
    cell, p = shape(f["geometry"]).buffer(0), f["properties"]
    for d, k in KEY.items():
        parts = [(cell.intersection(g).area, TARGET[code(rp, d)]) for g, rp in real if cell.intersects(g)]
        total = sum(a for a, _ in parts)
        if not total:
            continue
        ratio = sum(a * t for a, t in parts) / total
        p[f"base_{k}_mw"] = round(p[f"cap_{k}_mw"] * ratio, 1)
    p["calibrated_to"] = "capaciteitskaart, Netbeheer Nederland (status pattern only)"
    print(f'{p["id"]:24} offtake {p["base_offtake_mw"]:6} / {p["cap_offtake_mw"]:5}   feed-in {p["base_feed_in_mw"]:6} / {p["cap_feed_in_mw"]:5}')

json.dump(areas, open("data/app/areas.geojson", "w", encoding="utf-8"), ensure_ascii=False)

# With the higher, calibrated loads the 25 MW (illustrative) transformer upgrade in Emmen Bargermeer no longer
# leaves room for anything. Size it at 45 MW (also illustrative) so the demo keeps one on-schedule example.
SIZE = {"emmen-bargermeer": 45}
ups = json.load(open("data/app/upgrades.json", encoding="utf-8"))
for u in ups:
    if u["id"] in SIZE:
        u["mw_added_offtake"] = u["mw_added_feed_in"] = SIZE[u["id"]]
json.dump(ups, open("data/app/upgrades.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
