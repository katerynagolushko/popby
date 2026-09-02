import type { Availability, Profile, Role, HangoutType } from "@/lib/types";

export const DEMO_ME_ID = "demo-me";

export type DemoPerson = {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
  availability: Availability;
  isSelf?: boolean;
};

/** Realistic demo portraits (randomuser.me — stock photos for prototypes) */
function portrait(gender: "men" | "women", id: number) {
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;
}

function expiresIn(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

type DemoSeed = {
  id: string;
  first_name: string;
  gender: "men" | "women";
  portraitId: number;
  role: Role;
  bio: string;
  lat: number;
  lng: number;
  hangout_type: HangoutType;
  hangout_note: string | null;
  duration_minutes: 30 | 60 | 120;
  minutes_left: number;
  avg_score: number;
  rating_count: number;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  luma_profile_url?: string | null;
};

const SEEDS: DemoSeed[] = [
  {
    id: "1",
    first_name: "Alex",
    gender: "men",
    portraitId: 32,
    role: "founder",
    bio: "Building in fintech. Always up for product feedback over coffee.",
    lat: 51.5255,
    lng: -0.0877,
    hangout_type: "coffee",
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
    bio: "Ex-Stripe ops. Here for walks and brainstorms.",
    lat: 51.5238,
    lng: -0.0788,
    hangout_type: "walk",
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
    bio: "Angel investor. Open to casual chats, not pitch meetings.",
    lat: 51.5315,
    lng: -0.0759,
    hangout_type: "casual_chat",
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
    bio: "Product designer between gigs. Down to co-work somewhere quiet.",
    lat: 51.5203,
    lng: -0.0936,
    hangout_type: "cowork",
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
    bio: "Climate tech. Looking for honest feedback on our GTM.",
    lat: 51.5288,
    lng: -0.0912,
    hangout_type: "product_feedback",
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
    bio: "Startup lawyer. Happy to answer quick questions, not full consults.",
    lat: 51.5221,
    lng: -0.0845,
    hangout_type: "coffee",
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
    bio: "Head of growth at a Series A. Love talking hiring and culture.",
    lat: 51.5268,
    lng: -0.0725,
    hangout_type: "brainstorm",
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
    bio: "Pre-seed VC. On the hunt for interesting founders, zero pitch decks.",
    lat: 51.5195,
    lng: -0.0812,
    hangout_type: "casual_chat",
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
    bio: "Engineer on contract. Free this afternoon, down to co-work.",
    lat: 51.5332,
    lng: -0.0885,
    hangout_type: "cowork",
    hangout_note: "WeWork lobby or anywhere with WiFi",
    duration_minutes: 120,
    minutes_left: 100,
    avg_score: 4.3,
    rating_count: 7,
    twitter_url: "https://x.com",
  },
];

function seedToPerson(seed: DemoSeed): DemoPerson {
  return {
    profile: {
      id: seed.id,
      first_name: seed.first_name,
      photo_url: portrait(seed.gender, seed.portraitId),
      role: seed.role,
      bio: seed.bio,
      linkedin_url: seed.linkedin_url ?? null,
      twitter_url: seed.twitter_url ?? null,
      luma_profile_url: seed.luma_profile_url ?? null,
      created_at: "",
      avg_score: seed.avg_score,
      rating_count: seed.rating_count,
    },
    availability: {
      id: `a${seed.id}`,
      user_id: seed.id,
      lat: seed.lat,
      lng: seed.lng,
      hangout_type: seed.hangout_type,
      hangout_note: seed.hangout_note,
      duration_minutes: seed.duration_minutes,
      expires_at: expiresIn(seed.minutes_left),
      is_active: true,
      created_at: "",
    },
  };
}

export const INITIAL_DEMO_PEOPLE: DemoPerson[] = SEEDS.map(seedToPerson);

export const DEMO_ME_PROFILE: Profile = {
  id: DEMO_ME_ID,
  first_name: "You",
  photo_url: portrait("women", 47),
  role: "founder",
  bio: "Demo profile — sign in to use your real photo.",
  linkedin_url: null,
  twitter_url: null,
  luma_profile_url: null,
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
