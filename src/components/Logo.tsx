import { APP_NAME_LEAD, APP_NAME_TAIL } from "@/lib/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

/** Hangby (navy) + me (orange) — use anywhere the app name is shown as a wordmark */
export function AppWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span className="text-navy">{APP_NAME_LEAD}</span>
      <span className="text-accent">{APP_NAME_TAIL}</span>
    </span>
  );
}

/** Custom mark — speech-bubble + map pin, not emoji */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill="#1a1f36" />
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
  className = "",
}: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={s.icon} />
      {showWordmark && <AppWordmark className={s.text} />}
    </div>
  );
}
