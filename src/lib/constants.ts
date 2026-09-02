import type { HangoutType, Role } from "./types";

export const LONDON_CENTER = { lat: 51.5255, lng: -0.0877 }; // Old Street
export const LONDON_BOUNDS = {
  north: 51.65,
  south: 51.42,
  west: -0.25,
  east: 0.05,
};

export const ROLES: { value: Role; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "operator", label: "Operator" },
  { value: "investor", label: "Investor" },
  { value: "freelancer", label: "Freelancer" },
  { value: "service_provider", label: "Service provider" },
];

export const HANGOUT_TYPES: { value: HangoutType; label: string; emoji: string }[] = [
  { value: "product_feedback", label: "Product feedback", emoji: "💡" },
  { value: "cowork", label: "Co-work", emoji: "💻" },
  { value: "walk", label: "Walk", emoji: "🚶" },
  { value: "coffee", label: "Coffee / drinks", emoji: "☕" },
  { value: "casual_chat", label: "Just hang out", emoji: "😄" },
  { value: "brainstorm", label: "Brainstorm", emoji: "🧠" },
  { value: "other", label: "Something else", emoji: "✨" },
];

export const DURATIONS = [
  { value: 30 as const, label: "30 min" },
  { value: 60 as const, label: "1 hour" },
  { value: 120 as const, label: "2 hours" },
];

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function hangoutLabel(type: HangoutType): string {
  const h = HANGOUT_TYPES.find((t) => t.value === type);
  return h ? `${h.emoji} ${h.label}` : type;
}

export function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
}
