import type {
  CompanyType,
  HangoutFormat,
  HangoutIntent,
  Role,
} from "./types";

export const LONDON_CENTER = { lat: 51.5255, lng: -0.0877 }; // Old Street (default only)
/** Greater London — loose enough to pin anywhere in the city, not just Zone 1. */
export const LONDON_BOUNDS = {
  north: 51.7,
  south: 51.28,
  west: -0.55,
  east: 0.35,
};

export const ROLES: { value: Role; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "operator", label: "Operator" },
  { value: "investor", label: "Investor" },
  { value: "freelancer", label: "Freelancer" },
  { value: "service_provider", label: "Service provider" },
];

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "early_stage", label: "Early-stage startup" },
  { value: "scale_up", label: "Scale-up" },
  { value: "corporate", label: "Corporate" },
  { value: "vc_fund", label: "VC / fund" },
  { value: "agency", label: "Agency / consultancy" },
  { value: "independent", label: "Independent" },
  { value: "student", label: "Student / exploring" },
];

export const HANGOUT_FORMATS: { value: HangoutFormat; label: string }[] = [
  { value: "coffee", label: "Coffee / sit-down" },
  { value: "walk", label: "Walk & talk" },
  { value: "cowork", label: "Co-work" },
  { value: "activity", label: "Activity" },
];

export const HANGOUT_INTENTS: { value: HangoutIntent; label: string }[] = [
  { value: "product_feedback", label: "Product feedback" },
  { value: "brainstorm", label: "Brainstorm" },
  { value: "casual_chat", label: "Casual chat" },
  { value: "just_hang", label: "Just hang out" },
  { value: "other", label: "Something else" },
];

export const DURATIONS = [
  { value: 30 as const, label: "30 min" },
  { value: 60 as const, label: "1 hour" },
  { value: 120 as const, label: "2 hours" },
];

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function companyTypeLabel(type: CompanyType | null | undefined): string {
  if (!type) return "";
  return COMPANY_TYPES.find((c) => c.value === type)?.label ?? type;
}

export function formatLabel(format: HangoutFormat): string {
  return HANGOUT_FORMATS.find((f) => f.value === format)?.label ?? format;
}

export function intentLabel(intent: HangoutIntent): string {
  return HANGOUT_INTENTS.find((i) => i.value === intent)?.label ?? intent;
}

export function hangoutSummary(
  format: HangoutFormat,
  intent: HangoutIntent
): string {
  return `${formatLabel(format)} · ${intentLabel(intent)}`;
}

export function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
}

/** Haversine distance in metres */
export function distanceMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)}km`;
}
