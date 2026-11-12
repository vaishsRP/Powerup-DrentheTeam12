"""
Fetch REAL high-voltage grid infrastructure around Drenthe for the map's infrastructure layer.

1. TenneT high-voltage assets (stations, lines, cables) from TenneT's public ArcGIS service
   "TenneT_Assets_Hoogspanning". Attribution: "Bron: TenneT".
2. Substations under construction from OpenStreetMap (tag construction:power=substation), see data/README.md.
   Attribution: "© OpenStreetMap contributors" (ODbL).

Usage (repo root):  pip install requests   then   python scripts/fetch_grid_infrastructure.py
Output (state.js and map.js pick these up when present):
  data/real/tennet-cables.geojson     underground high-voltage cables touching Drenthe
  data/real/osm-construction.geojson  substations under construction in Drenthe
Prints each layer's fields so you can check what came back.
"""
import json
import os
import requests

TENNET = "https://services-eu1.arcgis.com/WjozPuR5ROn6NZE8/arcgis/rest/services/TenneT_Assets_Hoogspanning/FeatureServer"
BBOX = "6.10,52.60,7.15,53.20"  # around Drenthe, WGS84
os.makedirs("data/real", exist_ok=True)


def esri_geom(g):
    if not g:
        return None
    if "paths" in g:
        return {"type": "MultiLineString", "coordinates": g["paths"]}
    if "rings" in g:
        return {"type": "MultiPolygon", "coordinates": [[r] for r in g["rings"]]}
    if "x" in g:
        return {"type": "Point", "coordinates": [g["x"], g["y"]]}
    return None


def query(layer_id):
    feats, offset = [], 0
    while True:
        d = requests.get(f"{TENNET}/{layer_id}/query", params={
            "where": "1=1", "outFields": "*", "geometry": BBOX, "geometryType": "esriGeometryEnvelope",
            "inSR": 4326, "outSR": 4326, "spatialRel": "esriSpatialRelIntersects", "returnGeometry": "true",
            "resultOffset": offset, "resultRecordCount": 1000, "f": "json"}, timeout=60).json()
        if "error" in d:
            raise RuntimeError(d["error"])
        batch = d.get("features", [])
        feats += batch
        if not d.get("exceededTransferLimit") or not batch:
            return d.get("geometryType", ""), d.get("fields", []), feats
        offset += len(batch)


# ---------- 1. TenneT layers ----------
meta = requests.get(TENNET, params={"f": "json"}, timeout=30).json()
lines, stations = [], []
for lyr in meta.get("layers", []):
    gtype, fields, feats = query(lyr["id"])
    print(f"\n[{lyr['id']}] {lyr['name']}: {len(feats)} features ({gtype})")
    print("  fields:", [f["name"] for f in fields])
    for f in feats[:3]:
        print("  e.g.", {k: v for k, v in f["attributes"].items() if v not in (None, "")})
    out = [{"type": "Feature", "properties": {**f["attributes"], "_layer": lyr["name"]}, "geometry": esri_geom(f.get("geometry"))}
           for f in feats]
    (lines if gtype == "esriGeometryPolyline" else stations).extend(out)

KEEP = ("OBJECTID", "STATUS", "AANLEGJAAR", "NETSCHAKELID", "OBJECTTYPE", "SPANNINGSNIVEAU", "_layer", "Shape__Length")


def rounded_geom(g):
    if not g:
        return None
    if g.get("type") == "MultiLineString":
        return {"type": "MultiLineString", "coordinates": [[[round(x, 5), round(y, 5)] for x, y in path] for path in g["coordinates"]]}
    return g


cables = [
    {
        "type": "Feature",
        "properties": {k: f["properties"].get(k) for k in KEEP},
        "geometry": rounded_geom(f.get("geometry")),
    }
    for f in lines
    if f["properties"].get("_layer") == "Hoogspanning kabel (ondergronds)"
]
with open("data/real/tennet-cables.geojson", "w", encoding="utf-8") as fh:
    json.dump({"type": "FeatureCollection", "source": "TenneT (TenneT_Assets_Hoogspanning) — underground high-voltage cables", "features": cables}, fh, ensure_ascii=False)
print(f"saved data/real/tennet-cables.geojson ({len(cables)})")

# ---------- 2. OSM substations under construction ----------
q = """[out:json][timeout:60];
area["name"="Drenthe"]["admin_level"="4"]->.d;
nwr["construction:power"="substation"](area.d);
out center tags;"""
try:
    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": q}, timeout=90).json()
    fs = []
    for e in r.get("elements", []):
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        if lat:
            fs.append({"type": "Feature", "properties": e.get("tags", {}), "geometry": {"type": "Point", "coordinates": [lon, lat]}})
    with open("data/real/osm-construction.geojson", "w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "source": "© OpenStreetMap contributors (ODbL)", "features": fs}, fh, ensure_ascii=False)
    print(f"\nOSM substations under construction: {len(fs)}")
    for f in fs:
        print("  ", f["properties"].get("name"), f["properties"].get("voltage"), f["geometry"]["coordinates"])
except Exception as e:  # Overpass is sometimes busy; not essential
    print("\nOverpass failed (try again later):", e)
    with open("data/real/osm-construction.geojson", "w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "source": "© OpenStreetMap contributors (ODbL) — construction query failed", "features": []}, fh, ensure_ascii=False)
    print("saved empty data/real/osm-construction.geojson")
