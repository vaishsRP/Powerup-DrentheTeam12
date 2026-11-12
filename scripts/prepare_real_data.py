"""
Turn the big raw downloads in data/real/raw/ into small, Drenthe-only files the map can load fast.

Inputs (from scripts/fetch_capaciteitskaart.py and scripts/fetch_grid_infrastructure.py):
  data/real/raw/capaciteitskaart-regionaal-afname.geojson   regional supply areas (Enexis/RENDO/Liander), status codes
  data/real/raw/capaciteitskaart-tennet-afname.geojson      TenneT congestion areas, status codes + "solved in year"
  data/real/raw/tennet-lines.geojson                         TenneT HV lines and cables
  data/real/raw/tennet-stations.geojson                      TenneT stations, masts, transition points
Outputs (small enough to commit and load in the browser):
  data/real/drenthe-supply-areas.geojson   supply areas clipped to Drenthe, with regional + TenneT status, queues, solved-in year
  data/real/drenthe-hv-lines.geojson       HV overhead lines and underground cables around Drenthe (no lightning wires)
  data/real/drenthe-hv-stations.geojson    TenneT HV stations around Drenthe

Status codes (capaciteitskaart): 0 = capacity available, no queue · 1 = limited, no queue ·
2 = area under investigation, with queue · 3 = shortage of transport capacity, with queue.
Sources: Capaciteitskaart, Netbeheer Nederland (services by Esri Nederland) · TenneT (TenneT_Assets_Hoogspanning).

Run from the repo root:  pip install shapely   then   python scripts/prepare_real_data.py
"""
import json
from datetime import datetime, timezone
from shapely.geometry import shape, Polygon, MultiPolygon, mapping, box
from shapely.ops import unary_union

RAW = "data/real/raw"
OUT = "data/real"


def load(name):
    return json.load(open(f"{RAW}/{name}", encoding="utf-8"))


def signed_area(ring):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])) / 2


def polygon_from_rings(geom):
    """The fetch scripts stored every Esri ring as its own polygon. Rebuild real polygons:
    Esri outer rings run clockwise (negative signed area), holes counter-clockwise."""
    rings = [p[0] for p in geom["coordinates"]] if geom["type"] == "MultiPolygon" else geom["coordinates"]
    outers = [Polygon(r) for r in rings if len(r) >= 4 and signed_area(r) < 0]
    holes = [Polygon(r) for r in rings if len(r) >= 4 and signed_area(r) >= 0]
    if not outers:  # orientation not as expected: fall back to all rings as outers
        outers, holes = [Polygon(r) for r in rings if len(r) >= 4], []
    polys = []
    for o in outers:
        inner = [h.exterior.coords for h in holes if o.contains(h.representative_point())]
        polys.append(Polygon(o.exterior.coords, inner).buffer(0))
    return unary_union(polys)


# ---------- Drenthe border ----------
muni = json.load(open("data/drenthe-municipalities.geojson", encoding="utf-8"))
drenthe = unary_union([shape(f["geometry"]) for f in muni["features"]]).buffer(0)
around = box(*drenthe.buffer(0.08).bounds)  # lines/stations slightly beyond the border

# ---------- TenneT congestion areas (for the TenneT part of each supply area's status) ----------
tennet = []
for f in load("capaciteitskaart-tennet-afname.geojson")["features"]:
    p = f["properties"]
    if not p.get("congestiegebied_afname") and not p.get("congestiegebied_opwek"):
        continue
    g = polygon_from_rings(f["geometry"]).simplify(0.002)
    if g.intersects(around):
        tennet.append((g, p))
print("TenneT areas around Drenthe:", [p.get("congestiegebied_afname") for _, p in tennet])

# ---------- regional supply areas, clipped to Drenthe ----------
areas = []
for f in load("capaciteitskaart-regionaal-afname.geojson")["features"]:
    p = f["properties"]
    if not p.get("voedingsgebied_id") or p.get("voedingsgebied_naam") in (None, "0"):
        continue
    g = polygon_from_rings(f["geometry"])
    if not g.intersects(drenthe):
        continue
    g = g.intersection(drenthe).simplify(0.0006, preserve_topology=True)
    if g.is_empty or g.area < 1e-6:
        continue
    pt = g.representative_point()
    tp = next((q for tg, q in tennet if tg.contains(pt)), {})
    props = {
        "id": f"{p['voedingsgebied_id']}-{p.get('OBJECTID')}",
        "name": p["voedingsgebied_naam"], "operator": p.get("RNB"),
        "code_afname": p.get("afname"), "code_teruglevering": p.get("opwek"),
        "queue_afname_mw": p.get("wachtrij_afname"), "queue_teruglevering_mw": p.get("wachtrij_invoeding"),
        "requests_afname": p.get("unieke_verzoeken_afname"), "requests_teruglevering": p.get("unieke_verzoeken_invoeding"),
        "tennet_area": tp.get("congestiegebied_afname") or tp.get("congestiegebied_opwek"),
        "tennet_code_afname": tp.get("afname"), "tennet_code_teruglevering": tp.get("opwek"),
        "tennet_solved_afname": tp.get("jaartal_opgelost_afname"), "tennet_solved_teruglevering": tp.get("jaartal_opgelost_invoeding"),
        "tennet_queue_afname_mw": tp.get("wachtrij_afname"), "tennet_queue_teruglevering_mw": tp.get("wachtrij_invoeding"),
    }
    if isinstance(g, (Polygon, MultiPolygon)):
        areas.append({"type": "Feature", "properties": props, "geometry": mapping(g)})
json.dump({"type": "FeatureCollection", "source": "Capaciteitskaart, Netbeheer Nederland", "features": areas},
          open(f"{OUT}/drenthe-supply-areas.geojson", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"supply areas in Drenthe: {len(areas)}")


def year(ms):
    try:
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).year if ms else None
    except (OverflowError, OSError, ValueError):
        return None


# ---------- HV lines and cables (no lightning wires) ----------
lines = []
for f in load("tennet-lines.geojson")["features"]:
    p = f["properties"]
    if p.get("_layer") == "Bliksemdraad" or not f.get("geometry"):
        continue
    g = shape(f["geometry"])
    if not g.intersects(around):
        continue
    lines.append({"type": "Feature", "geometry": mapping(g.simplify(0.0002)), "properties": {
        "kind": "cable" if "kabel" in p["_layer"].lower() else "overhead",
        "status": p.get("STATUS"), "built": year(p.get("AANLEGJAAR")), "id": p.get("OBJECTIDENTIFIER")}})
# merge the many mast-to-mast segments into one geometry per kind (much faster to draw)
from shapely.ops import linemerge
merged = []
for kind in ("overhead", "cable"):
    segs = [shape(f["geometry"]) for f in lines if f["properties"]["kind"] == kind]
    if segs:
        g = linemerge(unary_union(segs))
        merged.append({"type": "Feature", "geometry": mapping(g.simplify(0.0003)),
                       "properties": {"kind": kind, "status": "In service", "segments": len(segs)}})
lines = merged
json.dump({"type": "FeatureCollection", "source": "TenneT", "features": lines},
          open(f"{OUT}/drenthe-hv-lines.geojson", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"HV lines/cables around Drenthe: {[(f['properties']['kind'], f['properties']['segments']) for f in lines]}")

# ---------- HV stations ----------
stations = []
for f in load("tennet-stations.geojson")["features"]:
    p = f["properties"]
    if p.get("_layer") != "Hoogspanning station" or not f.get("geometry"):
        continue
    g = shape(f["geometry"]) if f["geometry"]["type"] == "Point" else polygon_from_rings(f["geometry"]).centroid  # station footprint → centre point
    if around.contains(g):
        stations.append({"type": "Feature", "geometry": mapping(g), "properties": {
            "name": p.get("OBJECTOMSCHRIJVING") or p.get("OBJECTIDENTIFIER"), "status": p.get("STATUS"), "built": year(p.get("AANLEGJAAR"))}})
json.dump({"type": "FeatureCollection", "source": "TenneT", "features": stations},
          open(f"{OUT}/drenthe-hv-stations.geojson", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"HV stations around Drenthe: {len(stations)}")
