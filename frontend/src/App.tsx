import { useState, useRef } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

type GeocodedPoint = { lng: number; lat: number; label: string };

function App() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('');
  const [startCoord, setStartCoord] = useState<GeocodedPoint | null>(null);
  const [endCoord, setEndCoord] = useState<GeocodedPoint | null>(null);
  const [loading, setLoading] = useState(false);
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

      mapRef.current?.fitBounds(
        [[startData.lng, startData.lat], [endData.lng, endData.lat]],
        { padding: 80, duration: 1000 }
      );

      setStatus('');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Geocoding failed');
      setStartCoord(null);
      setEndCoord(null);
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
    </div>
  );
}

export default App;
