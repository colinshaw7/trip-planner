import { create } from 'zustand';

export type GeocodedPoint = { lng: number; lat: number; label: string };
export type Step = { instruction: string; distance: number; duration: number };
export type DetourSuggestion = {
  fsq_id: string;
  name: string;
  category: string;
  location: string;
  distance_m: number;
  detour_minutes: number;
  lat: number;
  lng: number;
};

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
  // Detours
  detourTolerance: number;
  detours: DetourSuggestion[];
  // Request state
  loading: boolean;

  // Actions
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  setStops: (stops: string[]) => void;
  setRouteCoords: (start: GeocodedPoint, end: GeocodedPoint, stops: GeocodedPoint[]) => void;
  setRouteResult: (geoJson: GeoJSON.FeatureCollection, steps: Step[]) => void;
  setDetourTolerance: (v: number) => void;
  setDetours: (detours: DetourSuggestion[]) => void;
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
  detourTolerance: 30,
  detours: [],
  loading: false,

  setStart: (v) => set({ start: v }),
  setEnd: (v) => set({ end: v }),
  setStops: (stops) => set({ stops }),
  setRouteCoords: (startCoord, endCoord, stopCoords) => set({ startCoord, endCoord, stopCoords }),
  setRouteResult: (routeGeoJson, steps) => set({ routeGeoJson, steps }),
  setDetourTolerance: (v) => set({ detourTolerance: v }),
  setDetours: (detours) => set({ detours }),
  setLoading: (v) => set({ loading: v }),
  clearRoute: () => set({ startCoord: null, endCoord: null, stopCoords: [], routeGeoJson: null, steps: [], detours: [] }),
}));
