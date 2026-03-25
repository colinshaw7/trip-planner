import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

ORS_API_KEY = os.getenv("ORS_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/geocode")
async def geocode(address: str = Query(..., min_length=1)):
    if not ORS_API_KEY:
        raise HTTPException(status_code=500, detail="ORS API key not configured")

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
    return {"lng": coords[0], "lat": coords[1], "label": label}
