"""
Pull the REAL capaciteitskaart data for Drenthe from Netbeheer Nederland's public ArcGIS services.

Source: capaciteitskaart.netbeheernederland.nl (served by Esri Nederland on behalf of Netbeheer Nederland).
Attribution in the app/video: "Bron: Capaciteitskaart, Netbeheer Nederland".

Usage (from the repo root):  pip install requests   then   python scripts/fetch_capaciteitskaart.py
Output: data/real/raw/capaciteitskaart-<layer>.geojson   (+ prints the field names and Drenthe rows)
"""
import json
import os
import requests

BASE = "https://services.arcgis.com/nSZVuSZjHpEZZbRo/ArcGIS/rest/services"
LAYERS = {
    # name                       service                                         layer id
    "tennet-afname":            ("Capaciteitskaart_Tennet_afname",                1),
    "tennet-teruglevering":     ("Capaciteitskaart_Tennet_teruglevering",         None),  # None = look up first layer
    "regionaal-afname":         ("Capaciteitskaart_elektriciteitsnet_v2_afname",  0),
    "regionaal-teruglevering":  ("Capaciteitskaart_elektriciteitsnet_v2_teruglevering", None),
}
# Rough bounding box around Drenthe (lon/lat, WGS84)
DRENTHE_BBOX = "6.10,52.60,7.15,53.20"


def first_layer_id(service):
    meta = requests.get(f"{BASE}/{service}/FeatureServer", params={"f": "json"}, timeout=30).json()
    return meta["layers"][0]["id"]


def esri_to_geojson_geometry(g):
    if not g:
        return None
    if "rings" in g:
        # Simple conversion: treat each ring as its own polygon (good enough for display)
        return {"type": "MultiPolygon", "coordinates": [[ring] for ring in g["rings"]]}
    if "x" in g:
        return {"type": "Point", "coordinates": [g["x"], g["y"]]}
    if "paths" in g:
        return {"type": "MultiLineString", "coordinates": g["paths"]}
    return None


def fetch(service, layer_id):
    url = f"{BASE}/{service}/FeatureServer/{layer_id}/query"
    feats, offset = [], 0
    while True:
        params = {
            "where": "1=1",
            "outFields": "*",
            "geometry": DRENTHE_BBOX,
            "geometryType": "esriGeometryEnvelope",
            "inSR": 4326,
            "spatialRel": "esriSpatialRelIntersects",
            "outSR": 4326,
            "returnGeometry": "true",
            "resultOffset": offset,
            "resultRecordCount": 1000,
            "f": "json",
        }
        d = requests.get(url, params=params, timeout=60).json()
        if "error" in d:
            raise RuntimeError(d["error"])
        batch = d.get("features", [])
        feats += batch
        if not d.get("exceededTransferLimit") or not batch:
            return d.get("fields", []), feats
        offset += len(batch)


os.makedirs("data/real/raw", exist_ok=True)
for name, (service, layer_id) in LAYERS.items():
    lid = layer_id if layer_id is not None else first_layer_id(service)
    fields, feats = fetch(service, lid)
    print(f"\n=== {name}: {len(feats)} areas touching Drenthe ===")
    print("fields:", [f"{f['name']} ({f.get('alias', '')})" for f in fields])
    for f in feats[:40]:
        print({k: v for k, v in f["attributes"].items() if v not in (None, "")})
    gj = {
        "type": "FeatureCollection",
        "source": "Capaciteitskaart, Netbeheer Nederland (ArcGIS service by Esri Nederland)",
        "features": [
            {"type": "Feature", "properties": f["attributes"], "geometry": esri_to_geojson_geometry(f.get("geometry"))}
            for f in feats
        ],
    }
    with open(f"data/real/raw/capaciteitskaart-{name}.geojson", "w", encoding="utf-8") as fh:
        json.dump(gj, fh, ensure_ascii=False)
    print(f"saved data/real/raw/capaciteitskaart-{name}.geojson")
