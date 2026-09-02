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
 * obviously repeat on the map or in Top 5.
 */
export const DEMO_PERSON_COUNT = 350;

/**
 * MapLibre paints a city-wide geographic subsample (never nearest-to-Old-Street).
 * Target: medium-full density — ~50–100 readable face pins across London.
 */
export const DEMO_MAP_MARKER_LIMIT = 72;

/** Min metres between any two generated pins (city-wide). */
const MIN_PIN_GAP_M = 95;

/**
 * Map subsample: lively neighborhood clusters without full face stacks.
 * ~700m gaps keep pins separable at city zoom; allow 2 per local pocket.
 */
const MAP_LOCAL_RADIUS_M = 1600;
const MAP_MAX_LOCAL = 2;
const MAP_MIN_GAP_M = 700;

/** ~2.2km lat / ~2.8km lng cells for map display bucketing. */
const MAP_CELL_LAT = 0.02;
const MAP_CELL_LNG = 0.04;

export type DemoPerson = {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
  availability: Availability;
  isSelf?: boolean;
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
    /\/avatars\/male\//.test(url)
  ) {
    return "male";
  }
  if (
    /\/portraits\/women\//.test(url) ||
    /\/avatars\/female\//.test(url)
  ) {
    return "female";
  }
  return null;
}

/**
 * Separate male/female portrait pools. randomuser has 100 each; xsgames adds
 * 79 more each so we can fill DEMO_PERSON_COUNT without obvious clones.
 * Gender is never mixed — callers take from the matching pool only.
 */
function buildGenderedPortraitPools(rng: () => number): {
  male: string[];
  female: string[];
} {
  const male: string[] = [];
  const female: string[] = [];
  for (let i = 0; i < 100; i++) {
    male.push(`https://randomuser.me/api/portraits/men/${i}.jpg`);
    female.push(`https://randomuser.me/api/portraits/women/${i}.jpg`);
  }
  for (let i = 0; i <= 78; i++) {
    male.push(
      `https://xsgames.co/randomusers/assets/avatars/male/${i}.jpg`
    );
    female.push(
      `https://xsgames.co/randomusers/assets/avatars/female/${i}.jpg`
    );
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

/** Male-coded first names only — paired exclusively with male portraits. */
const FIRST_NAMES_MEN = [
  "Alex", "Jordan", "Tom", "Chris", "Marcus", "Leo", "Omar", "Noah", "Ryan", "James",
  "Ben", "Daniel", "Mateo", "Samir", "Hugo", "Felix", "Owen", "Louis", "Adrian", "Ibrahim",
  "Theo", "Nate", "Ravi", "Seb", "Callum", "Miles", "Ethan", "Jasper", "Anil", "Finn",
  "Reuben", "Arjun", "Luca", "Harvey", "Zach", "Idris", "Niko", "Pascal", "Will", "Yusuf",
] as const;

/** Female-coded first names only — paired exclusively with female portraits. */
const FIRST_NAMES_WOMEN = [
  "Sam", "Priya", "Maya", "Elena", "Zara", "Aisha", "Nina", "Sofia", "Amelia", "Lara",
  "Chloe", "Yasmin", "Freya", "Ivy", "Mei", "Hannah", "Rosa", "Anya", "Leila", "Grace",
  "Tara", "Nadia", "Cara", "Lucia", "Esme", "Fatima", "Julia", "Rina", "Nora", "Ava",
  "Ines", "Sloane", "Kira", "Noor", "Bella", "Uma", "Celine", "Dalia", "Hana", "Pearl",
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
 * Alex/Sam portraits match the landing page cards.
 */
const HAND_SEED_BASE: Omit<DemoSeed, "photo_url">[] = [
  {
    id: "1",
    gender: "male",
    first_name: "Alex",
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
    first_name: "Sam",
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
    first_name: "Jordan",
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
  "1": "https://randomuser.me/api/portraits/men/32.jpg",
  "2": "https://randomuser.me/api/portraits/women/65.jpg",
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

let demoMePhotoUrl =
  "https://randomuser.me/api/portraits/women/47.jpg";

function generateSeeds(count: number): DemoSeed[] {
  const rng = mulberry32(20260305);
  const pools = buildGenderedPortraitPools(rng);
  let maleIdx = 0;
  let femaleIdx = 0;
  const nextPhoto = (gender: DemoGender) => {
    if (gender === "male") {
      return pools.male[maleIdx++] ?? pools.female[femaleIdx++]!;
    }
    return pools.female[femaleIdx++] ?? pools.male[maleIdx++]!;
  };

  const placed: { lat: number; lng: number }[] = [];
  const seeds: DemoSeed[] = HAND_SEED_BASE.map((base) => {
    // Re-place hand seeds with min-gap so they don't sit on top of each other.
    const cluster =
      CLUSTERS.find(
        (c) =>
          Math.abs(c.lat - base.lat) < 0.01 && Math.abs(c.lng - base.lng) < 0.01
      ) ?? weightedCluster(rng);
    const point = placeNear(cluster, placed, rng);
    return {
      ...base,
      lat: point.lat,
      lng: point.lng,
      photo_url: nextPhoto(base.gender),
    };
  });

  const usedNames = new Set(seeds.map((s) => s.first_name.toLowerCase()));

  for (let i = seeds.length; i < count; i++) {
    const gender: DemoGender = rng() < 0.5 ? "male" : "female";
    const names = gender === "male" ? FIRST_NAMES_MEN : FIRST_NAMES_WOMEN;
    let first = pick(rng, names);
    let tries = 0;
    while (usedNames.has(first.toLowerCase()) && tries < 8) {
      first = pick(rng, names);
      tries++;
    }
    usedNames.add(first.toLowerCase());

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
      id: String(i + 1),
      gender,
      first_name: first,
      photo_url: nextPhoto(gender),
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
      rating_count: Math.floor(rng() * 28),
      linkedin_url: rng() > 0.45 ? "https://linkedin.com" : null,
      twitter_url: rng() > 0.7 ? "https://x.com" : null,
      luma_profile_url: rng() > 0.85 ? "https://lu.ma" : null,
    });
  }

  demoMePhotoUrl = nextPhoto("female");
  return seeds;
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

export const DEMO_ME_PROFILE: Profile = {
  id: DEMO_ME_ID,
  first_name: "You",
  photo_url: demoMePhotoUrl,
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
