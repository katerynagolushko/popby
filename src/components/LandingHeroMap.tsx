"use client";

import "@/lib/maplibre-setup";
import { useEffect, useRef, useState } from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LONDON_CENTER } from "@/lib/constants";
import {
  DEFAULT_MAP_STYLE,
  OPENFREEMAP_STYLES,
} from "@/lib/map-tiles";

type LandingPerson = {
  name: string;
  role: string;
  timeLeft: string;
  formatIntent: string;
  area: string;
  photo: string;
  lat: number;
  lng: number;
  cardClass: string;
};

const PEOPLE: LandingPerson[] = [
  {
    name: "Adam",
    role: "Founder",
    timeLeft: "45m left",
    formatIntent: "Coffee · product feedback",
    area: "Near Old Street",
    photo:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main/male/512/32.jpg",
    lat: 51.5256,
    lng: -0.0877,
    cardClass:
      "top-[8%] left-[6%] sm:left-[8%] rotate-[-2.5deg] landing-card-in",
  },
  {
    name: "Sara",
    role: "Operator",
    timeLeft: "1h left",
    formatIntent: "Walk · brainstorm",
    area: "Shoreditch",
    photo:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main/female/512/65.jpg",
    lat: 51.5225,
    lng: -0.078,
    cardClass:
      "top-[12%] right-[5%] sm:right-[8%] rotate-[2deg] landing-card-in landing-card-delay-1",
  },
  {
    name: "Maya",
    role: "Investor",
    timeLeft: "30m left",
    formatIntent: "Co-work · casual chat",
    area: "King's Cross",
    photo:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main/female/512/44.jpg",
    lat: 51.5308,
    lng: -0.1238,
    cardClass:
      "bottom-[22%] left-[4%] sm:left-[10%] rotate-[1.5deg] landing-card-in landing-card-delay-2",
  },
  {
    name: "Leo",
    role: "Freelancer",
    timeLeft: "2h left",
    formatIntent: "Activity · just hang",
    area: "London Bridge",
    photo:
      "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main/male/512/75.jpg",
    lat: 51.5055,
    lng: -0.0865,
    cardClass:
      "bottom-[14%] right-[4%] sm:right-[7%] rotate-[-1.5deg] landing-card-in landing-card-delay-3",
  },
];

function createPin(photoUrl: string) {
  const el = document.createElement("div");
  el.className = "popby-marker";
  el.style.pointerEvents = "none";
  const img = document.createElement("img");
  img.src = photoUrl;
  img.alt = "";
  img.loading = "lazy";
  img.onerror = () => {
    img.remove();
    el.textContent = "?";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontWeight = "700";
    el.style.color = "white";
  };
  el.appendChild(img);
  return el;
}

function ProfileCard({ person }: { person: LandingPerson }) {
  return (
    <div
      className={`absolute z-20 w-[min(100%,15.5rem)] pointer-events-none landing-card-in ${person.positionClass} ${person.delayClass}`}
    >
      <div
        className={`popby-card p-4 text-left shadow-lg ${person.rotateClass}`}
      >
        <div className="flex items-center gap-3 mb-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photo}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-paper-2"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold text-navy truncate">
              {person.name}
            </p>
            <p className="text-sm text-muted truncate">
              {person.role} · {person.timeLeft}
            </p>
          </div>
          <span className="ml-auto live-dot shrink-0" />
        </div>
        <p className="text-sm font-medium text-navy">{person.formatIntent}</p>
        <p className="text-sm text-muted mt-0.5">{person.area}</p>
      </div>
    </div>
  );
}
export default function LandingHeroMap({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLES[DEFAULT_MAP_STYLE],
      center: [LONDON_CENTER.lng - 0.02, LONDON_CENTER.lat - 0.005],
      zoom: 12.1,
      interactive: false,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    const markers: Marker[] = [];

    map.on("load", () => {
      map.resize();
      PEOPLE.forEach((person) => {
        const marker = new Marker({
          element: createPin(person.photo),
          anchor: "center",
        })
          .setLngLat([person.lng, person.lat])
          .addTo(map);
        markers.push(marker);
      });
      setReady(true);
    });

    map.on("error", (e) => {
      console.error("Landing map error:", e.error?.message ?? e);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    const fallback = window.setTimeout(() => setReady(true), 600);

    return () => {
      window.clearTimeout(fallback);
      ro.disconnect();
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden bg-paper-2 ${className}`}
      aria-hidden={!ready}
    >
      <div className="popby-map absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Soft edges so floating cards sit on the map cleanly */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-navy/25 via-transparent to-navy/10" />
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-paper/40 to-transparent lg:from-transparent" />

      {PEOPLE.map((person) => (
        <ProfileCard key={person.name} person={person} />
      ))}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-center text-sm sm:text-base text-navy/80 bg-paper/85 backdrop-blur-sm px-4 py-2 rounded-lg max-w-[90%] leading-snug landing-card-in landing-card-delay-3">
        Go live, see who matches nearby, meet in person.
      </p>
    </div>
  );
}
