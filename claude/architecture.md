# Architecture

## Request Flow

```
User types addresses → handleSubmit()
  → GET /geocode?address= (x2 + stops, parallel)     [ORS Geocoding API]
  → POST /directions { coordinates: [[lng,lat],...] } [ORS Directions API]
  → setRouteGeoJson() → <Source>/<Layer> renders polyline on Mapbox map
  → fitBounds() using route bbox
  → setSteps() → directions panel populated
```

## Frontend Structure

All app logic lives in a single component: `frontend/src/App.tsx`

**State:**
- `start`, `end` — text inputs
- `stops` — string[] of intermediate stop inputs
- `startCoord`, `endCoord`, `stopCoords` — geocoded GeocodedPoint objects
- `routeGeoJson` — GeoJSON FeatureCollection from ORS (rendered on map)
- `steps` — turn-by-turn instruction objects from ORS response
- `loading` — disables button during API calls
- `directionsOpen` — toggles the right-side directions panel

**Map layers:**
- `routeCasing` — red line 6px (outline)
- `routeFill` — white line 3px (fill, renders on top)
- `<Marker>` components for start, stops, end

**CSS theme** (`frontend/src/index.css`):
- `--color-cardinal: #c5050c` — UW Madison red
- `--color-panel: rgba(15,15,20,0.82)` — dark frosted glass
- Custom font variables for DM Serif Display + DM Sans

## Backend Structure

Single file: `backend/app/main.py`

**Endpoints:**
- `GET /health` — liveness check
- `GET /geocode?address=` — calls ORS geocode/search, returns `{lng, lat, label}`
- `POST /directions {coordinates}` — calls ORS v2/directions/driving-car/geojson, returns GeoJSON FeatureCollection

**Key detail:** `radiuses: [-1]` passed to ORS directions — allows snapping to nearest road with unlimited radius (needed because geocoded city centers may not be on a routable road).

## Docker
```
docker-compose.yml
├── frontend  (node:20-alpine, port 5173, volume mount for hot reload)
└── backend   (python:3.12-slim, port 8000, volume mount for hot reload)
```
Both services load their respective `.env` files via `env_file`.
