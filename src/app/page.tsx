import Link from "next/link";
import Logo from "@/components/Logo";
import { APP_CITY, APP_DESCRIPTION, APP_TAGLINE } from "@/lib/brand";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Left — editorial, not centered slop */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 lg:max-w-xl">
        <Logo size="md" />

        <div className="py-12 lg:py-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
            IRL only · {APP_CITY}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] text-navy leading-[1.08] mb-6">
            {APP_TAGLINE}
          </h1>
          <p className="text-base text-muted leading-relaxed max-w-md mb-10">
            {APP_DESCRIPTION}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login" className="popby-btn popby-btn-accent">
              Get started
            </Link>
          <Link href="/demo" className="popby-btn popby-btn-accent">
            Try full demo
          </Link>
          </div>
        </div>

        <p className="text-xs text-muted hidden lg:block">
          No feed. No posts. Just people nearby who want to hang out.
        </p>
      </div>

      {/* Right — visual panel */}
      <div className="flex-1 bg-navy relative overflow-hidden min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ff5722" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="popby-card p-6 max-w-xs w-full text-left mb-6 rotate-[-2deg]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-paper-2" />
              <div>
                <p className="text-sm font-semibold text-navy">Alex</p>
                <p className="text-xs text-muted">Founder · 45m left</p>
              </div>
              <span className="ml-auto live-dot" />
            </div>
            <p className="text-sm text-navy font-medium">☕ Coffee + product feedback</p>
            <p className="text-xs text-muted mt-1">Near Old Street</p>
          </div>

          <div className="popby-card p-6 max-w-xs w-full text-left rotate-[2deg] translate-x-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-paper-2" />
              <div>
                <p className="text-sm font-semibold text-navy">Sam</p>
                <p className="text-xs text-muted">Operator · 1h left</p>
              </div>
              <span className="ml-auto live-dot" />
            </div>
            <p className="text-sm text-navy font-medium">🚶 Walk + brainstorm</p>
            <p className="text-xs text-muted mt-1">Shoreditch</p>
          </div>

          <p className="text-paper-3 text-sm mt-10 max-w-xs">
            Toggle live. Pick your vibe. See who&apos;s around. Connect IRL.
          </p>
        </div>
      </div>
    </main>
  );
}
