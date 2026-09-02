import type {
  Availability,
  CompanyType,
  HangoutFormat,
  HangoutIntent,
  Profile,
  Role,
} from "./types";
import { distanceMetres } from "./constants";

export const DEMO_ME_ID = "demo-me";

/** Full ranking pool size. Map only draws a nearby subsample (see DEMO_MAP_MARKER_LIMIT). */
export const DEMO_PERSON_COUNT = 500;

/**
 * MapLibre DOM markers get expensive past ~100 on mobile.
 * Ranking / suggestions always use the full DEMO_PERSON_COUNT set;
 * the map only paints the nearest DEMO_MAP_MARKER_LIMIT (plus you when live).
 */
export const DEMO_MAP_MARKER_LIMIT = 100;

export type DemoPerson = {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
  availability: Availability;
  isSelf?: boolean;
};

/** Realistic demo portraits (randomuser.me — stock photos for prototypes) */
function portrait(gender: "men" | "women", id: number) {
  return `https://randomuser.me/api/portraits/${gender}/${id % 100}.jpg`;
}

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

/** London startup / hangout clusters — weights bias toward denser tech areas. */
const CLUSTERS: { name: string; lat: number; lng: number; weight: number; spread: number }[] = [
  { name: "Shoreditch", lat: 51.5238, lng: -0.0788, weight: 14, spread: 0.012 },
  { name: "Old Street", lat: 51.5255, lng: -0.0877, weight: 13, spread: 0.01 },
  { name: "King's Cross", lat: 51.5308, lng: -0.1238, weight: 10, spread: 0.01 },
  { name: "Soho", lat: 51.5136, lng: -0.1365, weight: 9, spread: 0.008 },
  { name: "Canary Wharf", lat: 51.5054, lng: -0.0235, weight: 8, spread: 0.012 },
  { name: "Hackney", lat: 51.545, lng: -0.055, weight: 8, spread: 0.014 },
  { name: "Brixton", lat: 51.4613, lng: -0.1156, weight: 7, spread: 0.012 },
  { name: "Clapham", lat: 51.4618, lng: -0.1385, weight: 6, spread: 0.012 },
  { name: "Camden", lat: 51.539, lng: -0.1426, weight: 6, spread: 0.01 },
  { name: "London Bridge", lat: 51.5055, lng: -0.0865, weight: 6, spread: 0.009 },
  { name: "Whitechapel", lat: 51.5194, lng: -0.059, weight: 5, spread: 0.01 },
  { name: "Islington", lat: 51.5362, lng: -0.103, weight: 5, spread: 0.01 },
  { name: "Bethnal Green", lat: 51.527, lng: -0.0545, weight: 4, spread: 0.01 },
  { name: "Fitzrovia", lat: 51.5205, lng: -0.138, weight: 4, spread: 0.007 },
  { name: "South Bank", lat: 51.506, lng: -0.11, weight: 3, spread: 0.008 },
  { name: "Peckham", lat: 51.4742, lng: -0.0695, weight: 3, spread: 0.012 },
  { name: "Angel", lat: 51.532, lng: -0.105, weight: 3, spread: 0.008 },
  { name: "Spitalfields", lat: 51.5195, lng: -0.075, weight: 3, spread: 0.007 },
];

const FIRST_NAMES_MEN = [
  "Alex", "Jordan", "Tom", "Chris", "Marcus", "Leo", "Omar", "Noah", "Ryan", "Kai",
  "Ben", "Daniel", "Mateo", "Samir", "Hugo", "Felix", "Owen", "Louis", "Adrian", "Ibrahim",
  "Theo", "Nate", "Ravi", "Seb", "Callum", "Miles", "Ethan", "Jasper", "Anil", "Finn",
];

const FIRST_NAMES_WOMEN = [
  "Sam", "Priya", "Maya", "Elena", "Zara", "Aisha", "Nina", "Sofia", "Amelia", "Lara",
  "Chloe", "Yasmin", "Freya", "Ivy", "Mei", "Hannah", "Rosa", "Anya", "Leila", "Grace",
  "Tara", "Nadia", "Cara", "Lucia", "Esme", "Fatima", "Jules", "Rina", "Nora", "Ava",
];

const ROLES: Role[] = [
  "founder",
  "operator",
  "investor",
  "freelancer",
  "service_provider",
];

const COMPANY_TYPES: CompanyType[] = [
  "early_stage",
  "scale_up",
  "corporate",
  "vc_fund",
  "agency",
  "independent",
  "student",
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
  first_name: string;
  gender: "men" | "women";
  portraitId: number;
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

/** Hand-authored people near Old Street — keep a few familiar faces in the mix. */
const HAND_SEEDS: DemoSeed[] = [
  {
    id: "1",
    first_name: "Alex",
    gender: "men",
    portraitId: 32,
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
    first_name: "Sam",
    gender: "women",
    portraitId: 65,
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
    first_name: "Priya",
    gender: "women",
    portraitId: 44,
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
    first_name: "Jordan",
    gender: "men",
    portraitId: 75,
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
    first_name: "Maya",
    gender: "women",
    portraitId: 28,
    role: "founder",
    company_type: "early_stage",
    bio: "Climate tech. Looking for honest feedback on our GTM.",
    lat: 51.5288,
    lng: -0.0912,
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
    first_name: "Tom",
    gender: "men",
    portraitId: 52,
    role: "service_provider",
    company_type: "agency",
    bio: "Startup lawyer. Happy to answer quick questions, not full consults.",
    lat: 51.5221,
    lng: -0.0845,
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
    first_name: "Elena",
    gender: "women",
    portraitId: 17,
    role: "operator",
    company_type: "scale_up",
    bio: "Head of growth at a Series A. Love talking hiring and culture.",
    lat: 51.5268,
    lng: -0.0725,
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
    first_name: "Chris",
    gender: "men",
    portraitId: 61,
    role: "investor",
    company_type: "vc_fund",
    bio: "Pre-seed VC. On the hunt for interesting founders, zero pitch decks.",
    lat: 51.5195,
    lng: -0.0812,
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
    first_name: "Zara",
    gender: "women",
    portraitId: 89,
    role: "freelancer",
    company_type: "independent",
    bio: "Engineer on contract. Free this afternoon, down to co-work.",
    lat: 51.5332,
    lng: -0.0885,
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

function generateSeeds(count: number): DemoSeed[] {
  const rng = mulberry32(20260302);
  const seeds: DemoSeed[] = [...HAND_SEEDS];
  const usedNames = new Set(HAND_SEEDS.map((s) => s.first_name.toLowerCase()));

  for (let i = seeds.length; i < count; i++) {
    const gender: "men" | "women" = rng() < 0.5 ? "men" : "women";
    const names = gender === "men" ? FIRST_NAMES_MEN : FIRST_NAMES_WOMEN;
    let first = pick(rng, names);
    // Light collision avoidance so the strip doesn't look cloned
    if (usedNames.has(first.toLowerCase()) && rng() > 0.35) {
      first = pick(rng, names);
    }
    usedNames.add(first.toLowerCase());

    const cluster = weightedCluster(rng);
    const jitter = () => (rng() - 0.5) * 2 * cluster.spread;
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
      first_name: first,
      gender,
      portraitId: Math.floor(rng() * 99),
      role,
      company_type,
      bio: pick(rng, BIOS[role]),
      lat: cluster.lat + jitter(),
      lng: cluster.lng + jitter(),
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

  return seeds;
}

function seedToPerson(seed: DemoSeed): DemoPerson {
  return {
    profile: {
      id: seed.id,
      first_name: seed.first_name,
      photo_url: portrait(seed.gender, seed.portraitId),
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
  photo_url: portrait("women", 47),
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

/**
 * Subsample for MapLibre markers: always keep self, then nearest N from the
 * full ranked/unranked pool. Ranking strip still uses the full set.
 */
export function subsampleForMap(
  people: DemoPerson[],
  origin: { lat: number; lng: number },
  limit = DEMO_MAP_MARKER_LIMIT
): DemoPerson[] {
  const self = people.filter((p) => p.isSelf);
  const others = people
    .filter((p) => !p.isSelf)
    .sort(
      (a, b) =>
        distanceMetres(origin, {
          lat: a.availability.lat,
          lng: a.availability.lng,
        }) -
        distanceMetres(origin, {
          lat: b.availability.lat,
          lng: b.availability.lng,
        })
    )
    .slice(0, limit);
  return [...others, ...self];
}

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
