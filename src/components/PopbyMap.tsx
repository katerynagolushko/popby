"use client";

import "@/lib/maplibre-setup";
import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LONDON_CENTER } from "@/lib/constants";
import {
  DEFAULT_MAP_STYLE,
  OPENFREEMAP_STYLES,
} from "@/lib/map-tiles";
import type { Availability } from "@/lib/types";

export interface MapPerson {
  availability: Availability;
  first_name: string;
  photo_url: string | null;
  role: string;
  isSelf?: boolean;
}

interface PopbyMapProps {
  people: MapPerson[];
  center?: [number, number];
  zoom?: number;
  pickMode?: boolean;
  pickedLocation?: [number, number] | null;
  onPickLocation?: (lat: number, lng: number) => void;
  onPersonClick?: (person: MapPerson) => void;
  className?: string;
}

function createMarkerElement(photoUrl: string | null, isSelf: boolean) {
  const el = document.createElement("div");
  el.className = `popby-marker ${isSelf ? "popby-marker-self" : ""}`;
  if (photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = "";
    img.loading = "lazy";
    el.appendChild(img);
  } else {
    el.textContent = "?";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontWeight = "700";
    el.style.color = "white";
    el.style.background = "#ff5722";
  }
  return el;
}

export default function PopbyMap({
  people,
  center = [LONDON_CENTER.lat, LONDON_CENTER.lng],
  zoom = 14,
  pickMode = false,
  pickedLocation = null,
  onPickLocation,
  onPersonClick,
  className = "",
}: PopbyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const peopleMarkersRef = useRef<Marker[]>([]);
  const pickMarkerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPickLocation);
  const onPersonClickRef = useRef(onPersonClick);
  const pickModeRef = useRef(pickMode);
  const [mapReady, setMapReady] = useState(false);

  onPickRef.current = onPickLocation;
  onPersonClickRef.current = onPersonClick;
  pickModeRef.current = pickMode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLES[DEFAULT_MAP_STYLE],
      center: [center[1], center[0]],
      zoom,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // Show markers quickly even while tiles finish loading
    window.setTimeout(() => setMapReady(true), 400);

    if (!pickModeRef.current) {
      map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    }

    map.on("load", () => {
      map.resize();
      setMapReady(true);
    });

    map.on("error", (e) => {
      console.error("MapLibre error:", e.error?.message ?? e);
    });

    // Fallback if load event is missed (React strict mode / HMR)
    const readyPoll = window.setInterval(() => {
      if (map.loaded()) {
        setMapReady(true);
        map.resize();
        window.clearInterval(readyPoll);
      }
    }, 150);
    window.setTimeout(() => window.clearInterval(readyPoll), 8000);

    map.on("click", (e) => {
      if (pickModeRef.current && onPickRef.current) {
        onPickRef.current(e.lngLat.lat, e.lngLat.lng);
      }
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      setMapReady(false);
      peopleMarkersRef.current.forEach((m) => m.remove());
      pickMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.jumpTo({ center: [center[1], center[0]], zoom });
  }, [center, zoom, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    peopleMarkersRef.current.forEach((m) => m.remove());
    peopleMarkersRef.current = [];

    people.forEach((person) => {
      const el = createMarkerElement(person.photo_url, !!person.isSelf);
      el.style.cursor = "pointer";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onPersonClickRef.current?.(person);
      });

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([person.availability.lng, person.availability.lat])
        .addTo(map);

      peopleMarkersRef.current.push(marker);
    });
  }, [people, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    pickMarkerRef.current?.remove();
    pickMarkerRef.current = null;

    if (!pickedLocation) return;

    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;background:#1a1f36;border:3px solid #2ecc87;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);";

    pickMarkerRef.current = new Marker({ element: el, anchor: "center" })
      .setLngLat([pickedLocation[1], pickedLocation[0]])
      .addTo(map);
  }, [pickedLocation, mapReady]);

  return (
    <div className={`popby-map relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {pickMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-sm text-muted shadow-lg border border-paper-3 pointer-events-none">
          Tap the map to set your spot
        </div>
      )}
    </div>
  );
}
