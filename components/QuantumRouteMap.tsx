'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

interface RouteGeometry {
  type: string;
  coordinates: number[][];
}

interface QuantumRouteMapProps {
  seller: { lat: number; lng: number };
  buyer: { lat: number; lng: number };
  routeGeometry: RouteGeometry | null;
  distanceKm: number;
  estimatedCost: number;
  durationText: string;
}

const GOLD = "#c9933a";
const GOLD_GLOW = "#e8b84a";

export default function QuantumRouteMap({
  seller,
  buyer,
  routeGeometry,
  distanceKm,
  estimatedCost,
  durationText,
}: QuantumRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [phase, setPhase] = useState<"scanning" | "routing" | "reveal">("scanning");
  const [scanProgress, setScanProgress] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);

  // Scanning phase: grid scan effect
  const startScanningPhase = useCallback(
    (map: any, maplibregl: any) => {
      setPhase("scanning");
      let progress = 0;

      const scan = () => {
        progress += 0.8;
        setScanProgress(Math.min(progress, 100));

        if (progress >= 100) {
          // Transition to routing
          setTimeout(() => startRoutingPhase(map, maplibregl), 300);
          return;
        }
        animFrameRef.current = requestAnimationFrame(scan);
      };

      // Delay start for map animation
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(scan);
      }, 2200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Routing phase: animate route drawing
  const startRoutingPhase = useCallback(
    (map: any, maplibregl: any) => {
      setPhase("routing");

      if (!routeGeometry || !routeGeometry.coordinates) {
        // No route — draw straight line
        const coords = [
          [seller.lng, seller.lat],
          [buyer.lng, buyer.lat],
        ];
        animateRoute(map, coords);
        return;
      }

      animateRoute(map, routeGeometry.coordinates);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeGeometry, seller, buyer]
  );

  const animateRoute = (map: any, fullCoords: number[][]) => {
    const branchCount = 3;
    for (let b = 0; b < branchCount; b++) {
      const branchCoords = generateBranch(fullCoords, b);
      const branchId = `branch-${b}`;

      map.addSource(branchId, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: branchCoords }, properties: {} },
      });

      map.addLayer({
        id: branchId,
        type: "line",
        source: branchId,
        paint: {
          "line-color": GOLD,
          "line-opacity": 0.15,
          "line-width": 1.5,
          "line-dasharray": [2, 4],
        },
      });
    }

    // Glow layer (wide, low opacity)
    map.addSource("route-glow", {
      type: "geojson",
      data: { type: "Feature", geometry: { type: "LineString", coordinates: [fullCoords[0]] }, properties: {} },
    });
    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "route-glow",
      paint: {
        "line-color": GOLD_GLOW,
        "line-opacity": 0.3,
        "line-width": 12,
        "line-blur": 8,
      },
    });

    // Main route layer
    map.addSource("route-main", {
      type: "geojson",
      data: { type: "Feature", geometry: { type: "LineString", coordinates: [fullCoords[0]] }, properties: {} },
    });
    map.addLayer({
      id: "route-main",
      type: "line",
      source: "route-main",
      paint: {
        "line-color": GOLD,
        "line-opacity": 0.9,
        "line-width": 3,
      },
    });

    // Particle dot layer
    map.addSource("particle", {
      type: "geojson",
      data: { type: "Feature", geometry: { type: "Point", coordinates: fullCoords[0] }, properties: {} },
    });
    map.addLayer({
      id: "particle-glow",
      type: "circle",
      source: "particle",
      paint: {
        "circle-radius": 16,
        "circle-color": GOLD_GLOW,
        "circle-opacity": 0.4,
        "circle-blur": 1,
      },
    });
    map.addLayer({
      id: "particle",
      type: "circle",
      source: "particle",
      paint: {
        "circle-radius": 5,
        "circle-color": "#fff",
        "circle-opacity": 1,
      },
    });

    // Animate
    let idx = 0;
    const step = Math.max(1, Math.floor(fullCoords.length / 150));

    const draw = () => {
      idx = Math.min(idx + step, fullCoords.length - 1);
      const sliced = fullCoords.slice(0, idx + 1);
      const progress = (idx / (fullCoords.length - 1)) * 100;
      setRouteProgress(progress);

      const geoLine = { type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: sliced }, properties: {} };
      const geoPoint = { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: fullCoords[idx] }, properties: {} };

      map.getSource("route-main")?.setData(geoLine);
      map.getSource("route-glow")?.setData(geoLine);
      map.getSource("particle")?.setData(geoPoint);

      if (idx < fullCoords.length - 1) {
        animFrameRef.current = requestAnimationFrame(draw);
      } else {
        // Remove branches, reveal result
        for (let b = 0; b < branchCount; b++) {
          if (map.getLayer(`branch-${b}`)) map.removeLayer(`branch-${b}`);
          if (map.getSource(`branch-${b}`)) map.removeSource(`branch-${b}`);
        }
        // Remove particle
        if (map.getLayer("particle")) map.removeLayer("particle");
        if (map.getLayer("particle-glow")) map.removeLayer("particle-glow");
        if (map.getSource("particle")) map.removeSource("particle");

        setTimeout(() => setPhase("reveal"), 400);
      }
    };

    animFrameRef.current = requestAnimationFrame(draw);
  };

  // Initialize map SSR-safely
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainer.current) return;

    let activeMap: any = null;

    import("maplibre-gl").then((maplibreglModule) => {
      const maplibregl = maplibreglModule.default || maplibreglModule;

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors © CARTO",
            },
          },
          layers: [{ id: "osm-tiles", type: "raster", source: "osm-tiles" }],
        },
        center: [
          (seller.lng + buyer.lng) / 2,
          (seller.lat + buyer.lat) / 2,
        ],
        zoom: 5,
        attributionControl: false,
      });

      activeMap = map;

      map.on("load", () => {
        // Fit bounds to show both points
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([seller.lng, seller.lat]);
        bounds.extend([buyer.lng, buyer.lat]);
        map.fitBounds(bounds, { padding: 80, duration: 2000 });

        // Add seller marker
        const sellerEl = createMarker("🏪", "Seller");
        new maplibregl.Marker({ element: sellerEl })
          .setLngLat([seller.lng, seller.lat])
          .addTo(map);

        // Add buyer marker
        const buyerEl = createMarker("📍", "Buyer");
        new maplibregl.Marker({ element: buyerEl })
          .setLngLat([buyer.lng, buyer.lat])
          .addTo(map);

        // Start scanning phase
        startScanningPhase(map, maplibregl);
      });
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (activeMap) {
        activeMap.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller, buyer]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-secondary/30">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-[350px]" />

      {/* Scanning overlay */}
      {phase === "scanning" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
            style={{
              top: `${scanProgress}%`,
              boxShadow: `0 0 20px ${GOLD}, 0 0 60px ${GOLD}`,
              transition: "top 0.05s linear",
            }}
          />
          {/* Status text */}
          <div className="bg-background/80 backdrop-blur-md px-6 py-3.5 rounded-xl border border-primary/30">
            <p className="text-primary text-xs font-mono animate-pulse tracking-[0.2em] uppercase">
              ◈ SCANNING SHIPPING NODES... {Math.round(scanProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* Routing overlay */}
      {phase === "routing" && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md px-4 py-3 rounded-xl border border-primary/30">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <p className="text-primary text-xs font-mono tracking-widest uppercase">
                ◈ COMPUTING TRANSIT PATH... {Math.round(routeProgress)}%
              </p>
            </div>
            <div className="mt-2.5 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${routeProgress}%`,
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD_GLOW})`,
                  boxShadow: `0 0 8px ${GOLD}`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reveal overlay */}
      {phase === "reveal" && (
        <div className="absolute bottom-4 left-4 right-4 animate-fade-in-up">
          <div className="bg-background/90 backdrop-blur-md px-6 py-5 rounded-2xl border border-primary/40 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Delivery Distance</p>
                <p className="text-2xl font-bold text-foreground font-serif">
                  {distanceKm} <span className="text-xs font-normal text-muted-foreground font-sans">km</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">🕒 Travel: {durationText}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Estimated Cost</p>
                <p className="text-2xl font-bold text-primary font-serif">
                  Rp {estimatedCost.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function createMarker(emoji: string, label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:default;">
      <div style="font-size:24px;filter:drop-shadow(0 0 6px ${GOLD});">${emoji}</div>
      <span style="font-size:10px;color:${GOLD};font-family:inherit;font-weight:700;margin-top:2px;text-shadow:0 0 4px rgba(0,0,0,0.9);letter-spacing:0.05em;">${label.toUpperCase()}</span>
    </div>
  `;
  return el;
}

function generateBranch(mainCoords: number[][], branchIndex: number): number[][] {
  const start = Math.floor(mainCoords.length * 0.2);
  const end = Math.floor(mainCoords.length * 0.6);
  const mid = Math.floor((start + end) / 2);

  const offsetScale = (branchIndex + 1) * 0.008;
  const direction = branchIndex % 2 === 0 ? 1 : -1;

  return [
    mainCoords[start],
    [
      mainCoords[mid][0] + offsetScale * direction,
      mainCoords[mid][1] + offsetScale * direction * 0.5,
    ],
    [
      mainCoords[mid][0] + offsetScale * direction * 1.5,
      mainCoords[mid][1] - offsetScale * direction * 0.3,
    ],
    mainCoords[Math.min(end, mainCoords.length - 1)],
  ];
}
