"use client";

import "@/lib/maplibre-setup";
import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LONDON_BOUNDS, LONDON_CENTER } from "@/lib/constants";
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

/** Stable default — a fresh `[lat, lng]` each render would re-trigger jumpTo. */
const DEFAULT_CENTER: [number, number] = [
  LONDON_CENTER.lat,
  LONDON_CENTER.lng,
];

const LONDON_MAX_BOUNDS: [[number, number], [number, number]] = [
  [LONDON_BOUNDS.west, LONDON_BOUNDS.south],
  [LONDON_BOUNDS.east, LONDON_BOUNDS.north],
];

function showMarkerFallback(el: HTMLDivElement) {
  el.replaceChildren();
  el.textContent = "?";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.fontWeight = "700";
  el.style.color = "white";
  el.style.background = "#ff5722";
}

/**
 * MapLibre markers use CSS transforms; `loading="lazy"` often never intersects,
 * so the accent circle stays empty. Eager-load + one retry; ignore aborts on detach.
 */
function createMarkerElement(photoUrl: string | null, isSelf: boolean) {
  const el = document.createElement("div");
  el.className = `popby-marker ${isSelf ? "popby-marker-self" : ""}`;
  if (photoUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.referrerPolicy = "no-referrer";
    let retried = false;
    img.onerror = () => {
      if (!el.isConnected) return;
      if (!retried) {
        retried = true;
        // Bust any stale cache entry; keep the same public path.
        img.src = `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}v=1`;
        return;
      }
      showMarkerFallback(el);
    };
    img.src = photoUrl;
    el.appendChild(img);
  } else {
    showMarkerFallback(el);
  }
  return el;
}

function sameView(
  a: { lat: number; lng: number; zoom: number } | null,
  lat: number,
  lng: number,
  zoom: number
) {
  if (!a) return false;
  return (
    Math.abs(a.lat - lat) < 1e-7 &&
    Math.abs(a.lng - lng) < 1e-7 &&
    a.zoom === zoom
  );
}

export default function PopbyMap({
  people,
  center = DEFAULT_CENTER,
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
  const lastJumpRef = useRef<{ lat: number; lng: number; zoom: number } | null>(
    null
  );
  /** After the user pans or places a pin, stop auto-recentering. */
  const userTookControlRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  onPickRef.current = onPickLocation;
  onPersonClickRef.current = onPersonClick;
  pickModeRef.current = pickMode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    userTookControlRef.current = false;
    lastJumpRef.current = {
      lat: center[0],
      lng: center[1],
      zoom,
    };

    const map = new Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLES[DEFAULT_MAP_STYLE],
      center: [center[1], center[0]],
      zoom,
      attributionControl: { compact: true },
      ...(pickMode
        ? {
            maxBounds: LONDON_MAX_BOUNDS,
            minZoom: 10,
          }
        : {}),
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

    map.on("dragstart", () => {
      if (pickModeRef.current) userTookControlRef.current = true;
    });

    map.on("click", (e) => {
      if (pickModeRef.current && onPickRef.current) {
        userTookControlRef.current = true;
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
      pickMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const lat = center[0];
    const lng = center[1];

    // In pick mode, GPS may update the initial center once — but never fight the user.
    if (pickMode && userTookControlRef.current) return;
    if (sameView(lastJumpRef.current, lat, lng, zoom)) return;

    lastJumpRef.current = { lat, lng, zoom };
    map.jumpTo({ center: [lng, lat], zoom });
  }, [center, zoom, mapReady, pickMode]);

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

    if (!pickedLocation) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [pickedLocation[1], pickedLocation[0]];

    if (pickMarkerRef.current) {
      pickMarkerRef.current.setLngLat(lngLat);
      return;
    }

    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;background:#1a1f36;border:3px solid #2ecc87;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:grab;";

    const marker = new Marker({
      element: el,
      anchor: "center",
      draggable: pickMode,
    })
      .setLngLat(lngLat)
      .addTo(map);

    if (pickMode) {
      marker.on("dragstart", () => {
        userTookControlRef.current = true;
      });
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        userTookControlRef.current = true;
        onPickRef.current?.(ll.lat, ll.lng);
      });
    }

    pickMarkerRef.current = marker;
  }, [pickedLocation, mapReady, pickMode]);

  return (
    <div className={`popby-map relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {pickMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-lg text-muted shadow-lg border border-paper-3 pointer-events-none">
          Tap or drag the pin to set your spot
        </div>
      )}
    </div>
  );
}
