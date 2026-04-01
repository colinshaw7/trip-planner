# Next Steps

Ordered by priority. Steps 1-3 complete the core trip planning flow.

## 1. Zustand Store
Move all trip state out of `App.tsx` into a Zustand store. Currently everything is in a single component — as we add detour state this will get unwieldy.

**What moves:** `start`, `end`, `stops`, `startCoord`, `endCoord`, `stopCoords`, `routeGeoJson`, `steps`, `loading`

## 2. Detour Tolerance UI
Add a slider to the left panel for "detour tolerance" (e.g. 10–120 minutes off-route).
- Stored in state, passed to the backend when fetching detour suggestions
- Use as the search radius for Foursquare POI queries

## 3. Detour Suggestions (Foursquare)
Core differentiating feature. Backend queries Foursquare Places for POIs within a corridor around the route.

**Backend:**
- New `POST /detours` endpoint
- Build a geographic bounding box from the route bbox + tolerance
- Call Foursquare Places API `/v3/places/search` with `ll`, `radius`, and `categories`
- Score/rank results by proximity to route
- Return list of `{ name, category, distance_m, detour_minutes, lat, lng, fsq_id }`

**Frontend:**
- Detour cards rendered in the left panel below the form
- Each card shows name, category, estimated detour time
- Foursquare API key already in `backend/.env`

## 4. Toggle Detours
User clicks a detour card → it's added as a stop → route re-fetches.
- "Active" detour cards visually highlighted
- Removing a detour removes it from the stops list and re-routes

## 5. Redis Caching
Cache `/geocode` and `/directions` responses in Redis to avoid redundant API calls.
- Same coordinates = same route, no need to hit ORS again
- Cache key: hash of coordinates
- TTL: 24h for routes, 1h for geocode
- Already in the README/tech stack, just not implemented

## 6. Component Extraction
Once Zustand is in place, extract components:
- `<InputPanel>` — left sidebar
- `<DirectionsPanel>` — right sidebar
- `<DetourCard>` — individual detour suggestion
- `<RouteMap>` — map with layers and markers

## Backlog (Future)
- LLM-powered natural language detour suggestions (Claude API)
- Real-time collaborative editing (WebSockets)
- Live traffic-aware rerouting
- Saved trips (would require PostgreSQL + user auth)
