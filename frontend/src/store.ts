import { create } from 'zustand';

export type GeocodedPoint = { lng: number; lat: number; label: string };
export type Step = { instruction: string; distance: number; duration: number };

interface TripState {
  // Input fields
  start: string;
  end: string;
  stops: string[];
  // Geocoded coordinates
  startCoord: GeocodedPoint | null;
  endCoord: GeocodedPoint | null;
  stopCoords: GeocodedPoint[];
  // Route data
  routeGeoJson: GeoJSON.FeatureCollection | null;
  steps: Step[];
  // Request state
  loading: boolean;

  // Actions
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  setStops: (stops: string[]) => void;
  setRouteCoords: (start: GeocodedPoint, end: GeocodedPoint, stops: GeocodedPoint[]) => void;
  setRouteResult: (geoJson: GeoJSON.FeatureCollection, steps: Step[]) => void;
  setLoading: (v: boolean) => void;
  clearRoute: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  start: '',
  end: '',
  stops: [],
  startCoord: null,
  endCoord: null,
  stopCoords: [],
  routeGeoJson: null,
  steps: [],
  loading: false,

  setStart: (v) => set({ start: v }),
  setEnd: (v) => set({ end: v }),
  setStops: (stops) => set({ stops }),
  setRouteCoords: (startCoord, endCoord, stopCoords) => set({ startCoord, endCoord, stopCoords }),
  setRouteResult: (routeGeoJson, steps) => set({ routeGeoJson, steps }),
  setLoading: (v) => set({ loading: v }),
  clearRoute: () => set({ startCoord: null, endCoord: null, stopCoords: [], routeGeoJson: null, steps: [] }),
}));
