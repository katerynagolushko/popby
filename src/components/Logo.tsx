import { APP_NAME } from "@/lib/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

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
      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight text-navy ${s.text}`}
        >
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
