import { APP_NAME_LEAD, APP_NAME_TAIL } from "@/lib/brand";

export type WordmarkTone = "onLight" | "onDark";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  /** onLight: navy Hangby (cream/paper). onDark: white Hangby (navy bg). me stays orange. */
  tone?: WordmarkTone;
  className?: string;
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

/** Hangby + me — tone adapts lead color for light vs navy backgrounds */
export function AppWordmark({
  className = "",
  tone = "onLight",
}: {
  className?: string;
  tone?: WordmarkTone;
}) {
  const onDark = tone === "onDark";
  // Inline color so navy headers never lose white Hangby if a utility is purged.
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span
        className={onDark ? "text-white" : "text-navy"}
        style={onDark ? { color: "#ffffff" } : undefined}
      >
        {APP_NAME_LEAD}
      </span>
      <span className="text-accent">{APP_NAME_TAIL}</span>
    </span>
  );
}

/** Custom mark — speech-bubble + map pin, not emoji */
export function LogoMark({
  size = 32,
  tone = "onLight",
}: {
  size?: number;
  tone?: WordmarkTone;
}) {
  // On navy headers the square would vanish if it stayed navy — use cream so the mark reads.
  const square = tone === "onDark" ? "#f2efe9" : "#1a1f36";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill={square} />
      <path
        d="M14 16c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4h-6l-4 4v-4h-2c-2.2 0-4-1.8-4-4v-8z"
        fill="#ff5722"
      />
      <circle cx="24" cy="22" r="3" fill="#1a1f36" />
      <path
        d="M24 28v6"
        stroke="#1a1f36"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M21 34h6"
        stroke="#1a1f36"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  size = "md",
  showWordmark = true,
  tone = "onLight",
  className = "",
}: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={s.icon} tone={tone} />
      {showWordmark && <AppWordmark className={s.text} tone={tone} />}
    </div>
  );
}
