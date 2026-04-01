# Project Overview

**MadTrips** — A road trip planner web app. The user inputs a start and end location, optional intermediate stops, and the app generates a driving route rendered on an interactive map with turn-by-turn directions.

## Current State (as of 2026-04-01)

### Working
- Full-screen Mapbox map centered on the US
- Dark frosted-glass sidebar panel (left) with:
  - Start/end location text inputs
  - Dynamic stop inputs (add/remove)
  - Route dots alongside each input, visually connected
  - "Plan Route" button with loading state and error display
- Geocoding: text addresses → lat/lng via ORS Geocoding API
- Route rendering: ORS Directions API → white line with red outline drawn on map
- Markers: cardinal red dots for start/end/stops on map
- Directions panel (right, slide-in): turn-by-turn steps with distance/duration per step
- Mobile-responsive: sidebar becomes a bottom sheet on small screens
- Both services containerized via Docker Compose

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + react-map-gl/Mapbox
- **State:** React useState (Zustand not yet implemented)
- **Backend:** FastAPI (Python 3.12) + httpx + python-dotenv
- **Routing/Geocoding:** OpenRouteService (ORS) free tier
- **POI:** Foursquare API key obtained, endpoint not yet built
- **Infrastructure:** Docker Compose (both services)
- **Fonts:** DM Serif Display (headings) + DM Sans (body) via Google Fonts

### API Keys
- `ORS_API_KEY` — set in `backend/.env`
- `FOURSQUARE_API_KEY` — set in `backend/.env` (not yet used)
- `VITE_MAPBOX_TOKEN` — set in `frontend/.env`

## Running Locally
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
