# Next Steps

Ordered by priority. Steps 1-3 complete the core trip planning flow.

## ~~1. Zustand Store~~ ✓
## ~~2. Detour Tolerance UI~~ ✓
## ~~3. Detour Suggestions (Foursquare)~~ ✓
3.5: Pins for suggested location
## ~~4. Toggle Detours~~ ✓

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
- Autocompleted locations for input fields
- Real-time collaborative editing (WebSockets)
- Live traffic-aware rerouting
- Saved trips (would require PostgreSQL + user auth)
