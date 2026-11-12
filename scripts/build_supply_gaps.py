"""Parts of Drenthe that the capaciteitskaart does not cover with a supply area.

The map draws these grey ("no data on the capacity map") so they don't look like empty white holes.
Input: data/real/drenthe-supply-areas.geojson (from prepare_real_data.py) and the CBS municipality borders.
Output: data/real/drenthe-supply-gaps.geojson
Run: python scripts/build_supply_gaps.py
"""
import json

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

areas = json.load(open("data/real/drenthe-supply-areas.geojson", encoding="utf-8"))
muni = json.load(open("data/drenthe-municipalities.geojson", encoding="utf-8"))
drenthe = unary_union([shape(f["geometry"]) for f in muni["features"]]).buffer(0)
covered = unary_union([shape(f["geometry"]).buffer(0) for f in areas["features"]])

# small buffer in and out removes slivers left by the simplified area borders
gaps = drenthe.difference(covered.buffer(0.0008)).buffer(-0.0006).buffer(0.0006)
parts = [p for p in getattr(gaps, "geoms", [gaps]) if p.area > 2e-5]
geom = unary_union(parts).simplify(0.0004, preserve_topology=True)

json.dump({"type": "FeatureCollection", "source": "derived: CBS municipality borders minus capaciteitskaart supply areas",
           "features": [{"type": "Feature", "properties": {}, "geometry": mapping(geom)}]},
          open("data/real/drenthe-supply-gaps.geojson", "w", encoding="utf-8"), separators=(",", ":"))
print(f"gap parts: {len(parts)}, share of Drenthe: {geom.area / drenthe.area:.1%}")
