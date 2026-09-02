import type {
  Availability,
  CompanyType,
  HangoutFormat,
  HangoutIntent,
  Profile,
  Role,
} from "./types";
import {
  distanceMetres,
  formatDistance,
  formatLabel,
  intentLabel,
} from "./constants";

export const DEMO_ME_ID = "demo-me";

/**
 * Full ranking pool. Kept under unique-portrait capacity so faces don't
 * obviously repeat on the map or in Top 5. Cap tracks the gendered
 * faker-js portrait pool (100 each) minus leftovers for the demo "You".
 */
export const DEMO_PERSON_COUNT = 198;

/**
 * MapLibre paints a city-wide geographic subsample (never nearest-to-Old-Street).
 * Target: medium-full density — ~50–100 readable face pins across London.
 */
export const DEMO_MAP_MARKER_LIMIT = 72;

/** Min metres between any two generated pins (city-wide). */
const MIN_PIN_GAP_M = 95;

/**
 * Map subsample: lively neighborhood clusters without full face stacks.
 * ~550m gaps keep pins separable at city zoom; allow 3 per local pocket.
 */
const MAP_LOCAL_RADIUS_M = 1400;
const MAP_MAX_LOCAL = 3;
const MAP_MIN_GAP_M = 550;

/** ~2.2km lat / ~2.8km lng cells for map display bucketing. */
const MAP_CELL_LAT = 0.02;
const MAP_CELL_LNG = 0.04;

export type DemoPerson = {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
  availability: Availability;
  isSelf?: boolean;
};

/** Simulated hangout review shown on demo profile pages. */
export type DemoReview = {
  id: string;
  reviewerName: string;
  score: number;
  comment: string;
  daysAgo: number;
};

function expiresIn(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

/** Deterministic PRNG so SSR/hydration and reloads stay stable. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffleInPlace<T>(rng: () => number, arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

type DemoGender = "male" | "female";

/** Portrait URL → gender from path (men/male vs women/female). */
export function genderFromPortraitUrl(url: string): DemoGender | null {
  if (
    /\/portraits\/men\//.test(url) ||
    /\/avatars\/male\//.test(url) ||
    /\/assets-person-portrait@[^/]+\/male\//.test(url)
  ) {
    return "male";
  }
  if (
    /\/portraits\/women\//.test(url) ||
    /\/avatars\/female\//.test(url) ||
    /\/assets-person-portrait@[^/]+\/female\//.test(url)
  ) {
    return "female";
  }
  return null;
}

/**
 * High-res professional headshots from one CDN for consistent quality.
 * faker-js person portraits via jsDelivr: 1024×1024 JPEG, 100 unique each
 * gender (indices 0–99). Path segment `512` is the set name; files are 1024px.
 * Gender is never mixed — callers take from the matching pool only.
 */
const FAKER_PORTRAIT_BASE =
  "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main";

function portraitUrl(gender: DemoGender, index: number): string {
  return `${FAKER_PORTRAIT_BASE}/${gender}/512/${index}.jpg`;
}

function buildGenderedPortraitPools(rng: () => number): {
  male: string[];
  female: string[];
} {
  const male: string[] = [];
  const female: string[] = [];
  for (let i = 0; i < 100; i++) {
    male.push(portraitUrl("male", i));
    female.push(portraitUrl("female", i));
  }
  shuffleInPlace(rng, male);
  shuffleInPlace(rng, female);
  return { male, female };
}

/**
 * London hangout clusters — near-flat weights + wide spread so East London
 * tech land doesn't eat the map. Generation and map subsample both key off these.
 */
const CLUSTERS: {
  name: string;
  lat: number;
  lng: number;
  weight: number;
  spread: number;
}[] = [
  { name: "Shoreditch", lat: 51.5238, lng: -0.0788, weight: 4, spread: 0.016 },
  { name: "Old Street", lat: 51.5255, lng: -0.0877, weight: 4, spread: 0.014 },
  { name: "King's Cross", lat: 51.5308, lng: -0.1238, weight: 5, spread: 0.016 },
  { name: "Soho", lat: 51.5136, lng: -0.1365, weight: 5, spread: 0.014 },
  { name: "Westminster", lat: 51.4994, lng: -0.133, weight: 4, spread: 0.014 },
  { name: "Canary Wharf", lat: 51.5054, lng: -0.0235, weight: 5, spread: 0.018 },
  { name: "Hackney", lat: 51.545, lng: -0.055, weight: 5, spread: 0.02 },
  { name: "Dalston", lat: 51.5485, lng: -0.075, weight: 4, spread: 0.016 },
  { name: "Brixton", lat: 51.4613, lng: -0.1156, weight: 5, spread: 0.018 },
  { name: "Clapham", lat: 51.4618, lng: -0.1385, weight: 4, spread: 0.018 },
  { name: "Camden", lat: 51.539, lng: -0.1426, weight: 5, spread: 0.016 },
  { name: "Hampstead", lat: 51.556, lng: -0.178, weight: 4, spread: 0.016 },
  { name: "London Bridge", lat: 51.5055, lng: -0.0865, weight: 4, spread: 0.014 },
  { name: "Bermondsey", lat: 51.4975, lng: -0.068, weight: 3, spread: 0.016 },
  { name: "Whitechapel", lat: 51.5194, lng: -0.059, weight: 3, spread: 0.015 },
  { name: "Islington", lat: 51.5362, lng: -0.103, weight: 4, spread: 0.015 },
  { name: "Bethnal Green", lat: 51.527, lng: -0.0545, weight: 3, spread: 0.015 },
  { name: "Fitzrovia", lat: 51.5205, lng: -0.138, weight: 3, spread: 0.012 },
  { name: "South Bank", lat: 51.506, lng: -0.11, weight: 4, spread: 0.014 },
  { name: "Peckham", lat: 51.4742, lng: -0.0695, weight: 4, spread: 0.018 },
  { name: "Angel", lat: 51.532, lng: -0.105, weight: 3, spread: 0.012 },
  { name: "Spitalfields", lat: 51.5195, lng: -0.075, weight: 3, spread: 0.012 },
  { name: "Notting Hill", lat: 51.5094, lng: -0.1965, weight: 5, spread: 0.016 },
  { name: "Battersea", lat: 51.476, lng: -0.145, weight: 4, spread: 0.016 },
  { name: "Greenwich", lat: 51.4826, lng: -0.0077, weight: 5, spread: 0.016 },
  { name: "Fulham", lat: 51.477, lng: -0.201, weight: 4, spread: 0.016 },
  { name: "Marylebone", lat: 51.522, lng: -0.155, weight: 4, spread: 0.012 },
  { name: "Wimbledon", lat: 51.421, lng: -0.208, weight: 3, spread: 0.014 },
];

/** Clearly male-coded names — paired exclusively with male portraits. */
const FIRST_NAMES_MEN = [
  "Adam", "Jake", "Tom", "Chris", "Marcus", "Leo", "Omar", "Noah", "Ryan", "James",
  "Ben", "Daniel", "Mateo", "Samir", "Hugo", "Felix", "Owen", "Louis", "Adrian", "Ibrahim",
  "Theo", "Nate", "Ravi", "Seb", "Callum", "Miles", "Ethan", "Jasper", "Anil", "Finn",
  "Reuben", "Arjun", "Luca", "Harvey", "Zach", "Idris", "Niko", "Pascal", "Will", "Yusuf",
] as const;

/** Clearly female-coded names — paired exclusively with female portraits. */
const FIRST_NAMES_WOMEN = [
  "Sara", "Priya", "Maya", "Elena", "Zara", "Aisha", "Nina", "Sofia", "Amelia", "Lara",
  "Chloe", "Yasmin", "Freya", "Ivy", "Mei", "Hannah", "Rosa", "Anya", "Leila", "Grace",
  "Tara", "Nadia", "Cara", "Lucia", "Esme", "Fatima", "Julia", "Rina", "Nora", "Ava",
  "Ines", "Sophie", "Kira", "Noor", "Bella", "Uma", "Celine", "Dalia", "Hana", "Pearl",
] as const;

const MALE_NAME_SET = new Set(
  FIRST_NAMES_MEN.map((n) => n.toLowerCase())
);
const FEMALE_NAME_SET = new Set(
  FIRST_NAMES_WOMEN.map((n) => n.toLowerCase())
);

function nameGender(firstName: string): DemoGender | null {
  const key = firstName.toLowerCase();
  if (MALE_NAME_SET.has(key)) return "male";
  if (FEMALE_NAME_SET.has(key)) return "female";
  return null;
}

const ROLES: Role[] = [
  "founder",
  "operator",
  "investor",
  "freelancer",
  "service_provider",
];

const FORMATS: HangoutFormat[] = ["coffee", "walk", "cowork", "activity"];
const INTENTS: HangoutIntent[] = [
  "product_feedback",
  "brainstorm",
  "casual_chat",
  "just_hang",
  "other",
];

const DURATIONS = [30, 60, 120] as const;

const BIOS: Record<Role, string[]> = {
  founder: [
    "Building in fintech. Free for a short coffee.",
    "Climate tech. Looking for blunt product feedback.",
    "Marketplace founder between calls. Down for a walk.",
    "Pre-seed, shipping weekly. Happy to swap notes.",
  ],
  operator: [
    "Ops at a Series A. Good for hiring and culture chats.",
    "Growth lead. Prefer walks over Zoom.",
    "Ex-FAANG ops. In town and free this afternoon.",
    "Head of CX. Looking for a casual co-work buddy.",
  ],
  investor: [
    "Angel. Casual chats only, no pitch decks.",
    "Pre-seed VC. Curious founders > slide decks.",
    "Operator-turned-investor. Coffee near Old Street.",
    "Fund associate. Happy to talk GTM, not fundraising theatre.",
  ],
  freelancer: [
    "Product designer between gigs. Quiet co-work preferred.",
    "Contract engineer. Free this afternoon if there's WiFi.",
    "Brand freelancer. Walk and talk works.",
    "Independent PM. Looking for a short brainstorm.",
  ],
  service_provider: [
    "Startup lawyer. Quick questions over espresso, not full consults.",
    "Accountant for early-stage. Happy to chat informally.",
    "Recruiter focused on eng. Coffee near Shoreditch.",
    "Agency strategist. Free for a short walk.",
  ],
};

const NOTES = [
  "Happy to roast your pitch deck",
  "Shoreditch loop, ~30 min",
  "Have a laptop, need coffee",
  "20 min max, be blunt",
  "Legal basics over espresso",
  "Just moved to London",
  "WeWork lobby or anywhere with WiFi",
  "Near the station, flexible",
  null,
  null,
  null,
];

type DemoSeed = {
  id: string;
  gender: DemoGender;
  first_name: string;
  photo_url: string;
  role: Role;
  company_type: CompanyType;
  bio: string;
  lat: number;
  lng: number;
  hangout_format: HangoutFormat;
  hangout_intent: HangoutIntent;
  hangout_note: string | null;
  duration_minutes: 30 | 60 | 120;
  minutes_left: number;
  avg_score: number;
  rating_count: number;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  luma_profile_url?: string | null;
};

/**
 * Hand-authored people. `gender` drives both name coding and portrait pool.
 * Adam/Sara portraits match the landing page cards.
 */
const HAND_SEED_BASE: Omit<DemoSeed, "photo_url">[] = [
  {
    id: "1",
    gender: "male",
    first_name: "Adam",
    role: "founder",
    company_type: "early_stage",
    bio: "Building in fintech. Always up for product feedback over coffee.",
    lat: 51.5255,
    lng: -0.0877,
    hangout_format: "coffee",
    hangout_intent: "product_feedback",
    hangout_note: "Happy to roast your pitch deck",
    duration_minutes: 60,
    minutes_left: 45,
    avg_score: 4.8,
    rating_count: 12,
    linkedin_url: "https://linkedin.com",
  },
  {
    id: "2",
    gender: "female",
    first_name: "Sara",
    role: "operator",
    company_type: "scale_up",
    bio: "Ex-Stripe ops. Here for walks and brainstorms.",
    lat: 51.5238,
    lng: -0.0788,
    hangout_format: "walk",
    hangout_intent: "brainstorm",
    hangout_note: "Shoreditch loop, ~30 min",
    duration_minutes: 30,
    minutes_left: 28,
    avg_score: 4.5,
    rating_count: 6,
    luma_profile_url: "https://lu.ma",
  },
  {
    id: "3",
    gender: "female",
    first_name: "Priya",
    role: "investor",
    company_type: "vc_fund",
    bio: "Angel investor. Open to casual chats, not pitch meetings.",
    lat: 51.5315,
    lng: -0.0759,
    hangout_format: "coffee",
    hangout_intent: "casual_chat",
    hangout_note: null,
    duration_minutes: 60,
    minutes_left: 52,
    avg_score: 5.0,
    rating_count: 23,
    linkedin_url: "https://linkedin.com",
    twitter_url: "https://x.com",
  },
  {
    id: "4",
    gender: "male",
    first_name: "Jake",
    role: "freelancer",
    company_type: "independent",
    bio: "Product designer between gigs. Down to co-work somewhere quiet.",
    lat: 51.5203,
    lng: -0.0936,
    hangout_format: "cowork",
    hangout_intent: "just_hang",
    hangout_note: "Have a laptop, need coffee",
    duration_minutes: 120,
    minutes_left: 90,
    avg_score: 4.2,
    rating_count: 4,
  },
  {
    id: "5",
    gender: "female",
    first_name: "Maya",
    role: "founder",
    company_type: "early_stage",
    bio: "Climate tech. Looking for honest feedback on our GTM.",
    lat: 51.4613,
    lng: -0.1156,
    hangout_format: "walk",
    hangout_intent: "product_feedback",
    hangout_note: "20 min max, be brutal",
    duration_minutes: 30,
    minutes_left: 22,
    avg_score: 4.9,
    rating_count: 8,
  },
  {
    id: "6",
    gender: "male",
    first_name: "Tom",
    role: "service_provider",
    company_type: "agency",
    bio: "Startup lawyer. Happy to answer quick questions, not full consults.",
    lat: 51.5055,
    lng: -0.0865,
    hangout_format: "coffee",
    hangout_intent: "casual_chat",
    hangout_note: "Legal basics over espresso",
    duration_minutes: 60,
    minutes_left: 38,
    avg_score: 4.6,
    rating_count: 15,
  },
  {
    id: "7",
    gender: "female",
    first_name: "Elena",
    role: "operator",
    company_type: "scale_up",
    bio: "Head of growth at a Series A. Love talking hiring and culture.",
    lat: 51.5308,
    lng: -0.1238,
    hangout_format: "coffee",
    hangout_intent: "brainstorm",
    hangout_note: null,
    duration_minutes: 60,
    minutes_left: 55,
    avg_score: 4.7,
    rating_count: 11,
    linkedin_url: "https://linkedin.com",
  },
  {
    id: "8",
    gender: "male",
    first_name: "Chris",
    role: "investor",
    company_type: "vc_fund",
    bio: "Pre-seed VC. On the hunt for interesting founders, zero pitch decks.",
    lat: 51.5136,
    lng: -0.1365,
    hangout_format: "walk",
    hangout_intent: "casual_chat",
    hangout_note: "Just moved to London",
    duration_minutes: 120,
    minutes_left: 75,
    avg_score: 4.4,
    rating_count: 19,
  },
  {
    id: "9",
    gender: "female",
    first_name: "Zara",
    role: "freelancer",
    company_type: "independent",
    bio: "Engineer on contract. Free this afternoon, down to co-work.",
    lat: 51.545,
    lng: -0.055,
    hangout_format: "cowork",
    hangout_intent: "just_hang",
    hangout_note: "WeWork lobby or anywhere with WiFi",
    duration_minutes: 120,
    minutes_left: 100,
    avg_score: 4.3,
    rating_count: 7,
    twitter_url: "https://x.com",
  },
];

/** Landing-page faces — reserved so demo people match those cards. */
const PINNED_HAND_PHOTOS: Record<string, string> = {
  "1": portraitUrl("male", 32),
  "2": portraitUrl("female", 65),
};

function weightedCluster(rng: () => number) {
  const total = CLUSTERS.reduce((s, c) => s + c.weight, 0);
  let r = rng() * total;
  for (const c of CLUSTERS) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return CLUSTERS[0]!;
}

function roleCompany(rng: () => number): { role: Role; company_type: CompanyType } {
  const role = pick(rng, ROLES);
  if (role === "investor") return { role, company_type: "vc_fund" };
  if (role === "founder") {
    return {
      role,
      company_type: pick(rng, ["early_stage", "early_stage", "scale_up"] as CompanyType[]),
    };
  }
  if (role === "freelancer") {
    return {
      role,
      company_type: pick(rng, ["independent", "independent", "agency"] as CompanyType[]),
    };
  }
  if (role === "service_provider") {
    return {
      role,
      company_type: pick(rng, ["agency", "independent", "corporate"] as CompanyType[]),
    };
  }
  return {
    role,
    company_type: pick(rng, [
      "scale_up",
      "early_stage",
      "corporate",
      "agency",
    ] as CompanyType[]),
  };
}

function placeNear(
  cluster: (typeof CLUSTERS)[number],
  placed: { lat: number; lng: number }[],
  rng: () => number,
  minGap = MIN_PIN_GAP_M
): { lat: number; lng: number } {
  for (let attempt = 0; attempt < 48; attempt++) {
    const scale = 1 + attempt * 0.04;
    const lat = cluster.lat + (rng() - 0.5) * 2 * cluster.spread * scale;
    const lng = cluster.lng + (rng() - 0.5) * 2 * cluster.spread * scale;
    const ok = placed.every(
      (p) => distanceMetres(p, { lat, lng }) >= minGap
    );
    if (ok) {
      const point = { lat, lng };
      placed.push(point);
      return point;
    }
  }
  // Give up on gap; still jitter so we don't stack on the centroid.
  const point = {
    lat: cluster.lat + (rng() - 0.5) * 2 * cluster.spread * 1.6,
    lng: cluster.lng + (rng() - 0.5) * 2 * cluster.spread * 1.6,
  };
  placed.push(point);
  return point;
}

/** Leftover gendered portraits for the demo "You" go-live avatar. */
let demoMeMalePool: string[] = [];
let demoMeFemalePool: string[] = [];

function generateSeeds(count: number): DemoSeed[] {
  const rng = mulberry32(20260305);
  const pools = buildGenderedPortraitPools(rng);
  const usedPhotos = new Set<string>();

  const claimPhoto = (gender: DemoGender, preferred?: string): string => {
    if (preferred) {
      const prefGender = genderFromPortraitUrl(preferred);
      if (prefGender !== gender) {
        throw new Error(`Pinned photo gender mismatch: ${preferred}`);
      }
      const list = pools[gender];
      const at = list.indexOf(preferred);
      if (at >= 0) list.splice(at, 1);
      usedPhotos.add(preferred);
      return preferred;
    }
    while (pools[gender].length > 0) {
      const url = pools[gender].shift()!;
      if (!usedPhotos.has(url)) {
        usedPhotos.add(url);
        return url;
      }
    }
    throw new Error(`Ran out of ${gender} portraits for demo crowd`);
  };

  const placed: { lat: number; lng: number }[] = [];
  const seeds: DemoSeed[] = HAND_SEED_BASE.map((base) => {
    if (nameGender(base.first_name) !== base.gender) {
      throw new Error(
        `Hand seed ${base.id} name/gender mismatch: ${base.first_name}`
      );
    }
    const cluster =
      CLUSTERS.find(
        (c) =>
          Math.abs(c.lat - base.lat) < 0.01 && Math.abs(c.lng - base.lng) < 0.01
      ) ?? weightedCluster(rng);
    const point = placeNear(cluster, placed, rng);
    const photo_url = claimPhoto(base.gender, PINNED_HAND_PHOTOS[base.id]);
    return {
      ...base,
      lat: point.lat,
      lng: point.lng,
      photo_url,
    };
  });

  const usedNames = new Set(seeds.map((s) => s.first_name.toLowerCase()));

  // Fixed ~50/50 gender quota so we never exhaust one portrait pool.
  // Reserve ≥1 leftover face per gender for the demo "You" avatar.
  const remaining = count - seeds.length;
  const handMale = seeds.filter((s) => s.gender === "male").length;
  const handFemale = seeds.filter((s) => s.gender === "female").length;
  const maxMale = pools.male.length - 1; // leave 1+ for You
  const maxFemale = pools.female.length - 1;
  let needMale = Math.min(
    maxMale,
    Math.max(0, Math.floor(count / 2) - handMale)
  );
  let needFemale = remaining - needMale;
  if (needFemale > maxFemale) {
    needFemale = maxFemale;
    needMale = remaining - needFemale;
  }
  if (needMale > maxMale) {
    needMale = maxMale;
    needFemale = remaining - needMale;
  }
  const genderQueue: DemoGender[] = [
    ...Array(needMale).fill("male"),
    ...Array(needFemale).fill("female"),
  ];
  shuffleInPlace(rng, genderQueue);

  for (let qi = 0; qi < genderQueue.length; qi++) {
    const gender = genderQueue[qi]!;
    const names = gender === "male" ? FIRST_NAMES_MEN : FIRST_NAMES_WOMEN;
    let first = pick(rng, names);
    let tries = 0;
    while (usedNames.has(first.toLowerCase()) && tries < 8) {
      first = pick(rng, names);
      tries++;
    }
    usedNames.add(first.toLowerCase());

    const photo_url = claimPhoto(gender);
    const cluster = weightedCluster(rng);
    const point = placeNear(cluster, placed, rng);
    const { role, company_type } = roleCompany(rng);
    const hangout_format = pick(rng, FORMATS);
    const hangout_intent = pick(rng, INTENTS);
    const duration_minutes = pick(rng, DURATIONS);
    const minutes_left = Math.max(
      8,
      Math.floor(duration_minutes * (0.25 + rng() * 0.7))
    );

    seeds.push({
      id: String(seeds.length + 1),
      gender,
      first_name: first,
      photo_url,
      role,
      company_type,
      bio: pick(rng, BIOS[role]),
      lat: point.lat,
      lng: point.lng,
      hangout_format,
      hangout_intent,
      hangout_note: pick(rng, NOTES),
      duration_minutes,
      minutes_left,
      avg_score: Math.round((3.8 + rng() * 1.2) * 10) / 10,
      // Prefer a few reviews so profile pages feel lived-in; 0 still allowed.
      rating_count: rng() < 0.12 ? 0 : 3 + Math.floor(rng() * 6),
      linkedin_url: rng() > 0.45 ? "https://linkedin.com" : null,
      twitter_url: rng() > 0.7 ? "https://x.com" : null,
      luma_profile_url: rng() > 0.85 ? "https://lu.ma" : null,
    });
  }

  demoMeMalePool = pools.male.filter((u) => !usedPhotos.has(u));
  demoMeFemalePool = pools.female.filter((u) => !usedPhotos.has(u));
  return seeds;
}

/**
 * Pick the demo "You" face once per go-live: ~50% male / ~50% female.
 * Uses leftover unique portraits when available; stable for that session.
 */
export function pickSessionDemoMePhoto(): string {
  const gender: DemoGender = Math.random() < 0.5 ? "male" : "female";
  const pool = gender === "male" ? demoMeMalePool : demoMeFemalePool;
  if (pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    return pool[i]!;
  }
  return portraitUrl(gender, Math.floor(Math.random() * 100));
}

function seedToPerson(seed: DemoSeed): DemoPerson {
  return {
    profile: {
      id: seed.id,
      first_name: seed.first_name,
      photo_url: seed.photo_url,
      role: seed.role,
      company_type: seed.company_type,
      bio: seed.bio,
      linkedin_url: seed.linkedin_url ?? null,
      twitter_url: seed.twitter_url ?? null,
      luma_profile_url: seed.luma_profile_url ?? null,
      socials_visibility: "public",
      onboarding_completed: true,
      created_at: "",
      avg_score: seed.avg_score,
      rating_count: seed.rating_count,
    },
    availability: {
      id: `a${seed.id}`,
      user_id: seed.id,
      lat: seed.lat,
      lng: seed.lng,
      hangout_format: seed.hangout_format,
      hangout_intent: seed.hangout_intent,
      match_preference: "nearest",
      hangout_note: seed.hangout_note,
      duration_minutes: seed.duration_minutes,
      expires_at: expiresIn(seed.minutes_left),
      is_active: true,
      created_at: "",
    },
  };
}

export const INITIAL_DEMO_PEOPLE: DemoPerson[] =
  generateSeeds(DEMO_PERSON_COUNT).map(seedToPerson);

const DEMO_PEOPLE_BY_ID = new Map(
  INITIAL_DEMO_PEOPLE.map((p) => [p.profile.id, p])
);

export function getDemoPersonById(id: string): DemoPerson | undefined {
  return DEMO_PEOPLE_BY_ID.get(id);
}

const REVIEW_COMMENTS = [
  "Showed up on time. Sharp notes on the product.",
  "Easy hang. Knew who to intro next.",
  "Honest feedback without the fluff. Would meet again.",
  "Good walk. Clear thinker, no pitch theatre.",
  "Co-worked for an hour. Quiet, useful, zero weirdness.",
  "Coffee turned into a real brainstorm. Kept it concrete.",
  "Warm but direct. Left with two things to try that week.",
  "On time, curious, and actually listened.",
  "Solid hang. Shared a hiring tip that stuck.",
  "Low ego. High signal. Exactly what I needed.",
  "Quick coffee, clear next step. Rare combo.",
  "Walked through Shoreditch talking GTM. Worth it.",
  "Made intros without forcing it. Good taste in people.",
  "Blunt on the deck, kind about it. Helped a lot.",
  "Felt like talking to someone who builds, not performs.",
  "Short hang, strong takeaways. Booked another.",
];

function hashPersonId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build 3–8 (or fewer if rating_count is low) demo reviews whose mean
 * matches the person's avg_score. Deterministic per person id.
 */
export function getDemoReviews(person: DemoPerson): DemoReview[] {
  const avg = person.profile.avg_score;
  const total = person.profile.rating_count ?? 0;
  if (avg == null || avg <= 0 || total <= 0) return [];

  const n = Math.min(Math.max(total, 1), 8);
  const rng = mulberry32(hashPersonId(person.profile.id) ^ 0x5e11);
  const self = person.profile.first_name.toLowerCase();
  const namePool = [...FIRST_NAMES_MEN, ...FIRST_NAMES_WOMEN].filter(
    (name) => name.toLowerCase() !== self
  );

  const targetSum = avg * n;
  const scores: number[] = [];
  let remainingSum = targetSum;
  let remaining = n;

  for (let i = 0; i < n - 1; i++) {
    const minS = Math.max(1, Math.ceil(remainingSum - 5 * (remaining - 1)));
    const maxS = Math.min(5, Math.floor(remainingSum - 1 * (remaining - 1)));
    const lo = Math.min(minS, maxS);
    const hi = Math.max(minS, maxS);
    const biased = Math.round(avg + (rng() - 0.5) * 1.4);
    const score = Math.min(hi, Math.max(lo, biased));
    scores.push(score);
    remainingSum -= score;
    remaining -= 1;
  }
  scores.push(Math.min(5, Math.max(1, Math.round(remainingSum))));

  // Tiny drift fix so displayed ★ avg stays honest vs the list.
  const listAvg = scores.reduce((s, x) => s + x, 0) / scores.length;
  if (Math.abs(listAvg - avg) > 0.15 && scores.length > 0) {
    const tweak = listAvg < avg ? 1 : -1;
    const idx = scores.findIndex((s) =>
      tweak > 0 ? s < 5 : s > 1
    );
    if (idx >= 0) scores[idx] = scores[idx]! + tweak;
  }

  const usedNames = new Set<string>();
  const reviews: DemoReview[] = [];
  for (let i = 0; i < n; i++) {
    let name = pick(rng, namePool);
    let tries = 0;
    while (usedNames.has(name) && tries < 12) {
      name = pick(rng, namePool);
      tries += 1;
    }
    usedNames.add(name);
    reviews.push({
      id: `r-${person.profile.id}-${i}`,
      reviewerName: name,
      score: scores[i]!,
      comment: pick(rng, REVIEW_COMMENTS),
      daysAgo: Math.floor(rng() * 45) + (i === 0 ? 0 : 1),
    });
  }

  reviews.sort((a, b) => a.daysAgo - b.daysAgo);
  return reviews;
}

/** Relative label for demo review timestamps. */
export function formatReviewWhen(daysAgo: number): string {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return "Last week";
  if (daysAgo < 35) return `${Math.floor(daysAgo / 7)} weeks ago`;
  return "About a month ago";
}

export const DEMO_ME_PROFILE: Profile = {
  id: DEMO_ME_ID,
  first_name: "You",
  // Photo is assigned 50/50 male/female at each go-live via pickSessionDemoMePhoto().
  photo_url: null,
  role: "founder",
  company_type: "early_stage",
  bio: "Demo profile. Sign in later if we open real accounts.",
  linkedin_url: null,
  twitter_url: null,
  luma_profile_url: null,
  socials_visibility: "public",
  onboarding_completed: true,
  created_at: "",
};

export function toMapPeople(people: DemoPerson[]) {
  return people.map((p) => ({
    availability: p.availability,
    first_name: p.profile.first_name,
    photo_url: p.profile.photo_url,
    role: p.profile.role,
    isSelf: p.isSelf,
    profile: p.profile,
  }));
}

/** Rank others by match preference (vibe = format/intent, else distance). */
export function rankDemoPeople(
  people: DemoPerson[],
  origin: { lat: number; lng: number },
  myLive: DemoPerson | null
): DemoPerson[] {
  const others = people.filter((p) => !p.isSelf);
  const preferVibe = myLive?.availability.match_preference === "vibe";

  return [...others].sort((a, b) => {
    if (preferVibe && myLive) {
      const score = (p: DemoPerson) => {
        let s = 0;
        if (p.availability.hangout_format === myLive.availability.hangout_format)
          s += 2;
        if (p.availability.hangout_intent === myLive.availability.hangout_intent)
          s += 3;
        return s;
      };
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
    }
    return (
      distanceMetres(origin, {
        lat: a.availability.lat,
        lng: a.availability.lng,
      }) -
      distanceMetres(origin, {
        lat: b.availability.lat,
        lng: b.availability.lng,
      })
    );
  });
}

export const DEMO_TOP_MATCH_COUNT = 5;

/** Top N matches after go-live. Product of matching = this list, not an endless strip. */
export function topDemoMatches(
  people: DemoPerson[],
  origin: { lat: number; lng: number },
  myLive: DemoPerson | null,
  count = DEMO_TOP_MATCH_COUNT
): DemoPerson[] {
  return rankDemoPeople(people, origin, myLive).slice(0, count);
}

/** Coarse cell key so nearby hangout clusters share one map-display bucket. */
function mapCellKey(lat: number, lng: number): string {
  const r = Math.floor(lat / MAP_CELL_LAT);
  const c = Math.floor(lng / MAP_CELL_LNG);
  return `${r}:${c}`;
}

function mapPinFits(
  candidate: DemoPerson,
  picked: DemoPerson[],
  usedPhotos: Set<string>
): boolean {
  const photo = candidate.profile.photo_url ?? "";
  if (photo && usedPhotos.has(photo)) return false;

  const latlng = {
    lat: candidate.availability.lat,
    lng: candidate.availability.lng,
  };

  if (
    picked.some(
      (q) =>
        distanceMetres(latlng, {
          lat: q.availability.lat,
          lng: q.availability.lng,
        }) < MAP_MIN_GAP_M
    )
  ) {
    return false;
  }

  const localCount = picked.filter(
    (q) =>
      distanceMetres(latlng, {
        lat: q.availability.lat,
        lng: q.availability.lng,
      }) < MAP_LOCAL_RADIUS_M
  ).length;
  return localCount < MAP_MAX_LOCAL;
}

/**
 * Subsample for MapLibre markers: keep self, then round-robin across coarse
 * geographic cells so zoomed-out London shows pins in many neighborhoods
 * (Camden, Brixton, Greenwich, Notting Hill, …), not one Old Street blob.
 * Fine hangout clusters still feed generation + Top 5 ranking; only the painted
 * map uses this spread. Min-gap keeps faces readable when zoomed in.
 */
export function subsampleForMap(
  people: DemoPerson[],
  _origin?: { lat: number; lng: number },
  limit = DEMO_MAP_MARKER_LIMIT
): DemoPerson[] {
  const self = people.filter((p) => p.isSelf);
  const others = people.filter((p) => !p.isSelf);

  const cellMap = new Map<string, DemoPerson[]>();
  for (const p of others) {
    const key = mapCellKey(p.availability.lat, p.availability.lng);
    const bucket = cellMap.get(key);
    if (bucket) bucket.push(p);
    else cellMap.set(key, [p]);
  }

  // Sort cells NW→SE so the round-robin order is stable across SSR/hydration.
  const cellKeys = [...cellMap.keys()].sort((a, b) => {
    const [ar, ac] = a.split(":").map(Number) as [number, number];
    const [br, bc] = b.split(":").map(Number) as [number, number];
    return br - ar || ac - bc;
  });

  const shuffleRng = mulberry32(20260306);
  const buckets = cellKeys.map((key) => {
    const bucket = cellMap.get(key)!;
    return shuffleInPlace(shuffleRng, bucket);
  });

  const picked: DemoPerson[] = [];
  const pickedIds = new Set<string>();
  const usedPhotos = new Set<string>();
  const cursors = buckets.map(() => 0);

  const tryNextFrom = (bucketIdx: number): boolean => {
    if (picked.length >= limit) return false;
    const bucket = buckets[bucketIdx]!;
    while (cursors[bucketIdx]! < bucket.length) {
      const p = bucket[cursors[bucketIdx]!]!;
      cursors[bucketIdx]!++;
      if (pickedIds.has(p.profile.id)) continue;
      if (!mapPinFits(p, picked, usedPhotos)) continue;
      picked.push(p);
      pickedIds.add(p.profile.id);
      const photo = p.profile.photo_url ?? "";
      if (photo) usedPhotos.add(photo);
      return true;
    }
    return false;
  };

  let progress = true;
  while (picked.length < limit && progress) {
    progress = false;
    for (let i = 0; i < buckets.length; i++) {
      if (picked.length >= limit) break;
      if (tryNextFrom(i)) progress = true;
    }
  }

  return [...picked, ...self];
}

/** Short reason shown on Top 5 cards. */
export function matchWhy(
  me: DemoPerson,
  other: DemoPerson,
  origin: { lat: number; lng: number }
): string {
  const metres = distanceMetres(origin, {
    lat: other.availability.lat,
    lng: other.availability.lng,
  });
  const preferVibe = me.availability.match_preference === "vibe";
  const sameFormat =
    me.availability.hangout_format === other.availability.hangout_format;
  const sameIntent =
    me.availability.hangout_intent === other.availability.hangout_intent;

  if (preferVibe) {
    if (sameFormat && sameIntent) return "Same hangout as you";
    if (sameIntent) return `Also here for ${intentLabel(other.availability.hangout_intent)}`;
    if (sameFormat) return `Also wants ${formatLabel(other.availability.hangout_format)}`;
  }

  if (metres < 180) return "Basically next to you";
  if (metres < 550) return "A short walk away";
  return `${formatDistance(metres)} from your pin`;
}

/** @deprecated use matchWhy — kept for any leftover imports */
export function vibeMatchReason(
  me: DemoPerson,
  other: DemoPerson
): string | null {
  const sameFormat =
    me.availability.hangout_format === other.availability.hangout_format;
  const sameIntent =
    me.availability.hangout_intent === other.availability.hangout_intent;
  if (sameFormat && sameIntent) return "Same format + intent";
  if (sameIntent) return "Same intent";
  if (sameFormat) return "Same format";
  return null;
}
