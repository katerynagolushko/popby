"use client";

import "@/lib/maplibre-setup";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LONDON_CENTER } from "@/lib/constants";
import {
  OTHER_MALE_PORTRAIT_URLS,
  WHITE_MALE_PORTRAIT_URLS,
  YOUNG_FEMALE_PORTRAIT_URLS,
} from "@/lib/demo-portraits";
import {
  DEFAULT_MAP_STYLE,
  OPENFREEMAP_STYLES,
} from "@/lib/map-tiles";

/** Desktop card layout is authored on this artboard, then scaled as a unit. */
const ARTBOARD = { w: 900, h: 960 };
const CARD_W = 248;

type LandingPerson = {
  name: string;
  role: string;
  timeLeft: string;
  formatIntent: string;
  area: string;
  photo: string;
  lat: number;
  lng: number;
  /** Artboard x (px) — desktop only */
  x: number;
  /** Artboard y (px) — desktop only */
  y: number;
  rotateClass: string;
  delayClass: string;
};

const PEOPLE: LandingPerson[] = [
  {
    name: "Adam",
    role: "Founder",
    timeLeft: "45m left",
    formatIntent: "Coffee · product feedback",
    area: "Near Old Street",
    photo: WHITE_MALE_PORTRAIT_URLS[0]!,
    lat: 51.5256,
    lng: -0.0877,
    x: 36,
    y: 44,
    rotateClass: "rotate-[-2.5deg]",
    delayClass: "",
  },
  {
    name: "Sara",
    role: "Operator",
    timeLeft: "1h left",
    formatIntent: "Walk · brainstorm",
    area: "Shoreditch",
    photo: YOUNG_FEMALE_PORTRAIT_URLS[0]!,
    lat: 51.5225,
    lng: -0.078,
    x: 620,
    y: 52,
    rotateClass: "rotate-[2deg]",
    delayClass: "landing-card-delay-1",
  },
  {
    name: "Maya",
    role: "Investor",
    timeLeft: "30m left",
    formatIntent: "Co-work · casual chat",
    area: "King's Cross",
    photo: YOUNG_FEMALE_PORTRAIT_URLS[2]!,
    lat: 51.5308,
    lng: -0.1238,
    x: 52,
    y: 700,
    rotateClass: "rotate-[1.5deg]",
    delayClass: "landing-card-delay-2",
  },
  {
    name: "Leo",
    role: "Freelancer",
    timeLeft: "2h left",
    formatIntent: "Activity · just hang",
    area: "London Bridge",
    photo: WHITE_MALE_PORTRAIT_URLS[2]!,
    lat: 51.5055,
    lng: -0.0865,
    x: 620,
    y: 730,
    rotateClass: "rotate-[-1.5deg]",
    delayClass: "landing-card-delay-3",
  },
  {
    name: "Nina",
    role: "Founder",
    timeLeft: "50m left",
    formatIntent: "Coffee · brainstorm",
    area: "Soho",
    photo: YOUNG_FEMALE_PORTRAIT_URLS[4]!,
    lat: 51.5136,
    lng: -0.1365,
    x: 48,
    y: 270,
    rotateClass: "rotate-[-1deg]",
    delayClass: "landing-card-delay-2",
  },
  {
    name: "Tom",
    role: "Operator",
    timeLeft: "1h left",
    formatIntent: "Walk · product feedback",
    area: "Hackney",
    photo: WHITE_MALE_PORTRAIT_URLS[5]!,
    lat: 51.545,
    lng: -0.055,
    x: 560,
    y: 380,
    rotateClass: "rotate-[2.5deg]",
    delayClass: "landing-card-delay-3",
  },
  {
    name: "Priya",
    role: "Service provider",
    timeLeft: "40m left",
    formatIntent: "Co-work · just hang",
    area: "Canary Wharf",
    photo: YOUNG_FEMALE_PORTRAIT_URLS[6]!,
    lat: 51.5054,
    lng: -0.0235,
    x: 340,
    y: 210,
    rotateClass: "rotate-[-2deg]",
    delayClass: "landing-card-delay-1",
  },
  {
    name: "Jake",
    role: "Founder",
    timeLeft: "25m left",
    formatIntent: "Activity · casual chat",
    area: "Borough",
    photo: OTHER_MALE_PORTRAIT_URLS[1]!,
    lat: 51.5045,
    lng: -0.0865,
    x: 160,
    y: 460,
    rotateClass: "rotate-[1deg]",
    delayClass: "landing-card-delay-2",
  },
];

const SWIPE_THRESHOLD = 56;

function createPin(photoUrl: string) {
  const el = document.createElement("div");
  el.className = "popby-marker";
  el.style.pointerEvents = "none";
  const img = document.createElement("img");
  img.src = photoUrl;
  img.alt = "";
  // Eager: MapLibre positions markers with transforms, so lazy never fires.
  img.loading = "eager";
  img.decoding = "async";
  img.onerror = () => {
    if (!el.isConnected) return;
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

function CardFace({
  person,
  className = "",
}: {
  person: LandingPerson;
  className?: string;
}) {
  return (
    <div className={`popby-card p-4 text-left shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.photo}
          alt=""
          className="w-10 h-10 rounded-full object-cover object-top bg-paper-2"
        />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-navy truncate">
            {person.name}
          </p>
          <p className="text-lg text-navy/70 truncate">
            {person.role} · {person.timeLeft}
          </p>
        </div>
        <span className="ml-auto live-dot shrink-0" />
      </div>
      <p className="text-lg font-medium text-navy">{person.formatIntent}</p>
      <p className="text-lg text-navy/70 mt-0.5">{person.area}</p>
    </div>
  );
}

function DesktopProfileCard({ person }: { person: LandingPerson }) {
  return (
    <div
      className={`absolute z-20 pointer-events-none landing-card-in ${person.delayClass}`}
      style={{ left: person.x, top: person.y, width: CARD_W }}
    >
      <CardFace person={person} className={person.rotateClass} />
    </div>
  );
}

/**
 * Fixed artboard of cards, uniformly scaled to fit the map panel.
 * Browser zoom / laptop widths change the scale, not relative card gaps.
 */
function DesktopCardsArtboard({ people }: { people: LandingPerson[] }) {
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(width / ARTBOARD.w, height / ARTBOARD.h, 1.08));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="absolute inset-0 hidden sm:block pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Inner fit box leaves room for the bottom caption pill */}
      <div ref={fitRef} className="absolute inset-x-1 top-2 bottom-16">
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            width: ARTBOARD.w,
            height: ARTBOARD.h,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {people.map((person) => (
            <DesktopProfileCard key={person.name} person={person} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile-only swipe deck over the map — quick, no extra deps. */
function MobileSwipeDeck({ people }: { people: LandingPerson[] }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const draggingRef = useRef(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + people.length) % people.length);
      dragXRef.current = 0;
      setDragX(0);
    },
    [people.length]
  );

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    setDragging(true);
    startX.current = e.clientX;
    dragXRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const x = e.clientX - startX.current;
    dragXRef.current = x;
    setDragX(x);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const x = dragXRef.current;
    if (x <= -SWIPE_THRESHOLD) go(1);
    else if (x >= SWIPE_THRESHOLD) go(-1);
    else {
      dragXRef.current = 0;
      setDragX(0);
    }
  }

  const current = people[index]!;
  const next = people[(index + 1) % people.length]!;
  const rot = dragging ? dragX / 28 : 0;

  return (
    <div className="absolute inset-x-0 top-[12%] z-20 flex flex-col items-center gap-3 px-5 sm:hidden pointer-events-none">
      <div
        className="relative w-[min(100%,17.5rem)] h-[9.5rem] pointer-events-auto select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="region"
        aria-roledescription="carousel"
        aria-label="People free to hang nearby. Swipe to see more."
      >
        <div
          className="absolute inset-0 scale-[0.94] translate-y-2 opacity-70"
          aria-hidden
        >
          <CardFace person={next} className="rotate-[1.5deg]" />
        </div>
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translateX(${dragX}px) rotate(${rot}deg)`,
            transition: dragging ? "none" : "transform 0.22s ease-out",
          }}
        >
          <CardFace person={current} className="rotate-[-1.5deg] shadow-xl" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 pointer-events-none" aria-hidden>
        {people.map((p, i) => (
          <span
            key={p.name}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-4 bg-accent" : "w-1.5 bg-navy/30"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-navy/65 bg-paper/80 backdrop-blur-sm px-2.5 py-1 rounded-md pointer-events-none">
        Swipe for more
      </p>
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

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-navy/25 via-transparent to-navy/10" />
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-paper/40 to-transparent lg:from-transparent" />

      {/* Desktop / tablet: artboard-scaled cards (composition stays frozen) */}
      <DesktopCardsArtboard people={PEOPLE} />

      {/* Phone: swipeable deck */}
      <MobileSwipeDeck people={PEOPLE} />

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-center text-lg text-navy/80 bg-paper/85 backdrop-blur-sm px-4 py-2 rounded-lg max-w-[90%] leading-snug landing-card-in landing-card-delay-3 pointer-events-none">
        Go live, see who matches nearby, meet in person.
      </p>
    </div>
  );
}
