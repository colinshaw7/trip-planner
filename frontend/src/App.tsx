import { useState, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

type GeocodedPoint = { lng: number; lat: number; label: string };

const routeCasing: LayerProps = {
  id: 'route-casing',
  type: 'line',
  paint: { 'line-color': '#c5050c', 'line-width': 6, 'line-opacity': 0.8 },
};

const routeFill: LayerProps = {
  id: 'route-fill',
  type: 'line',
  paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-opacity': 0.95 },
};

function App() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('');
  const [startCoord, setStartCoord] = useState<GeocodedPoint | null>(null);
  const [endCoord, setEndCoord] = useState<GeocodedPoint | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [steps, setSteps] = useState<{ instruction: string; distance: number; duration: number }[]>([]);
  const mapRef = useRef<MapRef>(null);

  const handleSubmit = async () => {
    if (!start.trim() || !end.trim()) {
      setStatus('Please enter both a starting point and destination.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const [startRes, endRes] = await Promise.all([
        fetch(`http://localhost:8000/geocode?address=${encodeURIComponent(start)}`),
        fetch(`http://localhost:8000/geocode?address=${encodeURIComponent(end)}`),
      ]);

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.detail || 'Could not geocode starting point');
      }
      if (!endRes.ok) {
        const err = await endRes.json();
        throw new Error(err.detail || 'Could not geocode destination');
      }

      const startData: GeocodedPoint = await startRes.json();
      const endData: GeocodedPoint = await endRes.json();

      setStartCoord(startData);
      setEndCoord(endData);

      const dirRes = await fetch('http://localhost:8000/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: [
            [startData.lng, startData.lat],
            [endData.lng, endData.lat],
          ],
        }),
      });

      if (!dirRes.ok) {
        const err = await dirRes.json();
        throw new Error(err.detail || 'Could not fetch route');
      }

      const routeData = await dirRes.json();
      setRouteGeoJson(routeData);

      const segments = routeData.features?.[0]?.properties?.segments;
      if (segments?.[0]?.steps) {
        setSteps(segments[0].steps);
      }

      const bbox = routeData.bbox;
      if (bbox) {
        mapRef.current?.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 80, duration: 1000 }
        );
      }

      setStatus('');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Geocoding failed');
      setStartCoord(null);
      setEndCoord(null);
      setRouteGeoJson(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen relative font-body">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer {...routeCasing} />
            <Layer {...routeFill} />
          </Source>
        )}
        {startCoord && (
          <Marker longitude={startCoord.lng} latitude={startCoord.lat}>
            <div className="w-4 h-4 rounded-full bg-cardinal shadow-[0_0_10px_rgba(197,5,12,0.6)] border-2 border-white" />
          </Marker>
        )}
        {endCoord && (
          <Marker longitude={endCoord.lng} latitude={endCoord.lat}>
            <div className="w-4 h-4 rounded-full bg-cardinal shadow-[0_0_10px_rgba(197,5,12,0.6)] border-2 border-white" />
          </Marker>
        )}
      </Map>

      <div className="absolute bottom-0 left-0 w-full h-[44vh] rounded-t-2xl md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2 md:w-[22vw] md:min-w-72 md:h-[70vh] md:rounded-2xl bg-panel backdrop-blur-xl border border-panel-border shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-panel-border">
          <h2 className="font-display text-2xl text-white tracking-wide">
            MadTrips
          </h2>
          <p className="text-xs text-white/40 mt-1 font-body">
            Enter your origin and destination
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex gap-3 items-start">
            {/* Route dots */}
            <div className="flex flex-col items-center pt-3 gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cardinal shadow-[0_0_8px_rgba(197,5,12,0.5)]" />
              <div className="w-px h-3 bg-white/15" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="w-px h-3 bg-white/15" />
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="w-px h-3 bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-white/60 bg-transparent" />
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-3 flex-1">
              <input
                type="text"
                placeholder="Starting point"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cardinal focus:shadow-[0_0_0_3px_var(--color-input-focus)] transition-all duration-200"
              />
              <input
                type="text"
                placeholder="Destination"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cardinal focus:shadow-[0_0_0_3px_var(--color-input-focus)] transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-cardinal text-white rounded-lg px-4 py-3 text-sm font-semibold tracking-wide hover:bg-cardinal-dark active:scale-[0.98] transition-all duration-150 shadow-[0_2px_12px_rgba(197,5,12,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Geocoding...' : 'Plan Route'}
          </button>
          {status && (
            <p className={`text-xs mt-3 text-center ${
              startCoord && endCoord ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {status}
            </p>
          )}
        </div>
      </div>
      {/* Directions panel + tab wrapper */}
      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-300 ${
        directionsOpen ? 'right-0' : 'right-[calc(-22vw-1px)]'
      }`}>
        {/* Tab */}
        <button
          onClick={() => setDirectionsOpen(!directionsOpen)}
          className="bg-panel backdrop-blur-xl border border-panel-border border-r-0 rounded-l-lg px-1.5 py-3 text-white/60 hover:text-white transition-colors shrink-0"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${directionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Panel */}
        <div className="w-[22vw] min-w-72 h-[70vh] rounded-l-2xl bg-panel backdrop-blur-xl border border-panel-border border-r-0 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-panel-border">
            <h2 className="font-display text-2xl text-white tracking-wide">
              Directions
            </h2>
            <p className="text-xs text-white/40 mt-1 font-body">
              {steps.length > 0
                ? `${steps.length} steps`
                : 'Plan a route to see directions'}
            </p>
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </div>
                <p className="text-sm text-white/30">
                  No route yet
                </p>
                <p className="text-xs text-white/15 mt-1">
                  Plan a route to see turn-by-turn directions
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-1">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 items-start py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] font-semibold text-cardinal bg-cardinal/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 leading-snug">{step.instruction}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-white/25 tracking-wide uppercase">
                          {step.distance >= 1000
                            ? `${(step.distance / 1000).toFixed(1)} km`
                            : `${Math.round(step.distance)} m`}
                        </span>
                        <span className="text-[10px] text-white/15">|</span>
                        <span className="text-[10px] text-white/25 tracking-wide uppercase">
                          {step.duration >= 60
                            ? `${Math.round(step.duration / 60)} min`
                            : `${Math.round(step.duration)} sec`}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
