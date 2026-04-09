import asyncio
import hashlib
import json
import math
import os

import httpx
import redis.asyncio as redis
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

ORS_API_KEY = os.getenv("ORS_API_KEY")
FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

app = FastAPI()

cache = redis.from_url(REDIS_URL, decode_responses=True)

GEOCODE_TTL = 3600
DIRECTIONS_TTL = 86400
DETOURS_TTL = 3600


def _cache_key(prefix: str, raw: str) -> str:
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"


async def _cache_get(key: str) -> str | None:
    try:
        return await cache.get(key)
    except Exception:
        return None


async def _cache_set(key: str, value: str, ttl: int) -> None:
    try:
        await cache.set(key, value, ex=ttl)
    except Exception:
        pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@app.get("/health")
async def health():
    try:
        await cache.ping()
        cache_status = "connected"
    except Exception:
        cache_status = "unavailable"
    return {"status": "ok", "cache": cache_status}


@app.get("/geocode")
async def geocode(address: str = Query(..., min_length=1)):
    if not ORS_API_KEY:
        raise HTTPException(status_code=500, detail="ORS API key not configured")

    key = _cache_key("geo", address.strip().lower())

    cached = await _cache_get(key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openrouteservice.org/geocode/search",
            params={"api_key": ORS_API_KEY, "text": address, "size": 1},
        )
        resp.raise_for_status()

    data = resp.json()
    features = data.get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail=f"No results found for '{address}'")

    coords = features[0]["geometry"]["coordinates"]  # [lng, lat]
    label = features[0]["properties"]["label"]
    result = {"lng": coords[0], "lat": coords[1], "label": label}

    await _cache_set(key, json.dumps(result), GEOCODE_TTL)

    return result


class DirectionsRequest(BaseModel):
    coordinates: list[list[float]]


@app.post("/directions")
async def directions(req: DirectionsRequest):
    if not ORS_API_KEY:
        raise HTTPException(status_code=500, detail="ORS API key not configured")

    rounded = [[round(c, 5) for c in pair] for pair in req.coordinates]
    key = _cache_key("dir", json.dumps(rounded, separators=(",", ":")))

    cached = await _cache_get(key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            json={
                "coordinates": req.coordinates,
                "radiuses": [-1] * len(req.coordinates),
            },
            headers={"Authorization": ORS_API_KEY},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    result = resp.json()
    await _cache_set(key, json.dumps(result), DIRECTIONS_TTL)
    return result


class DetoursRequest(BaseModel):
    route_coords: list[list[float]]  # sampled [lng, lat] points along route
    tolerance_meters: int

async def _fsq_search(client: httpx.AsyncClient, lat: float, lng: float, radius: int) -> list:
    resp = await client.get(
        "https://places-api.foursquare.com/places/search",
        params={
            "ll": f"{lat},{lng}",
            "radius": radius,
            "categories": "13000,16000,10000,12000",
            "limit": 50,
            "sort": "DISTANCE",
        },
        headers={
            "Authorization": f"Bearer {FOURSQUARE_API_KEY}",
            "X-Places-Api-Version": "2025-02-05",
        },
    )
    if resp.status_code != 200:
        return []
    return resp.json().get("results", [])


@app.post("/detours")
async def get_detours(req: DetoursRequest):
    if not FOURSQUARE_API_KEY:
        raise HTTPException(status_code=500, detail="Foursquare API key not configured")

    coords = req.route_coords
    N_SAMPLES = 5
    step = max(1, (len(coords) - 1) // (N_SAMPLES - 1))
    sample_idxs = list(range(0, len(coords), step))[:N_SAMPLES]
    samples = [coords[i] for i in sample_idxs]

    search_radius = min(req.tolerance_meters, 100_000)

    rounded_samples = [[round(c, 4) for c in s] for s in samples]
    key = _cache_key("det", json.dumps({"s": rounded_samples, "r": search_radius}, separators=(",", ":")))

    cached = await _cache_get(key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        responses = await asyncio.gather(*[
            _fsq_search(client, lng_lat[1], lng_lat[0], search_radius)
            for lng_lat in samples
        ])

    seen: set[str] = set()
    raw_places = []
    for batch in responses:
        for place in batch:
            fid = place.get("fsq_place_id")
            if fid and fid not in seen:
                seen.add(fid)
                raw_places.append(place)

    results = []
    for place in raw_places:
        lat = place.get("latitude")
        lng = place.get("longitude")
        if lat is None or lng is None:
            continue
        distance_m = place.get("distance", 0)
        categories = place.get("categories", [])
        location = place.get("location", {})
        locality = location.get("locality", "")
        region = location.get("region", "")
        loc_str = f"{locality}, {region}" if locality and region else locality or region or ""
        results.append({
            "fsq_id": place["fsq_place_id"],
            "name": place["name"],
            "category": categories[0]["name"] if categories else "Place",
            "location": loc_str,
            "distance_m": distance_m,
            "lat": lat,
            "lng": lng,
        })

    await _cache_set(key, json.dumps(results), DETOURS_TTL)
    return results
