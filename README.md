# trip-planner
Trip planning application so I can avoid paying for AAA

## Tech Stack

### Frontend
- **React** w/ **TypeScript** — UI framework
- **Mapbox GL JS** (`react-map-gl`) — interactive map
- **Zustand** — lightweight state management for trip/route/detour state
- **Tailwind CSS** — utility-first CSS framework

### Backend
- **FastAPI** (Python) — async REST API, auto-generated OpenAPI docs
- **Redis** — caching route computations and API responses to reduce external API calls

### External APIs
- **OpenRouteService** — route calculation between waypoints (free, open-source, built on OpenStreetMap)
- **Foursquare Places API** — point-of-interest data for detour suggestions (100k requests/month free tier)

### Infrastructure
- **Docker** — containerized development and deployment

### Backlog
- LLM-powered natural language detour suggestions (Claude API)