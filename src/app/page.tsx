import Link from "next/link";
import Logo from "@/components/Logo";
import WaitlistForm from "@/components/WaitlistForm";
import { APP_CITY, APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  const params = await searchParams;
  const softGated = params.gate === "map";

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 lg:max-w-2xl lg:overflow-y-auto">
        <Logo size="md" />

        <div className="py-10 lg:py-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            {APP_CITY} · early access
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] text-navy leading-[1.08] mb-6">
            {APP_TAGLINE}
          </h1>
          <p className="text-lg leading-relaxed text-muted max-w-lg mb-4">
            LinkedIn feels like a graveyard. Strangers pitch you before they know
            you. {APP_NAME} is for human social connection among startup people in{" "}
            {APP_CITY}: less loneliness, more hanging out in person.
          </p>
          <p className="text-lg leading-relaxed text-muted max-w-lg mb-8">
            No feed, no posts, no follower counts. Go live when you&apos;re free,
            pick a format, see who&apos;s nearby, connect, then meet. If you want
            to pitch someone, say that up front. Cold selling strangers is the
            thing people are already sick of. Connection comes first.
          </p>

          {softGated && (
            <p className="text-base text-navy bg-paper-2 border border-paper-3 rounded-xl px-3 py-2.5 mb-6 max-w-lg leading-relaxed">
              The live map with real accounts isn&apos;t open yet. Join the waitlist
              or try the full demo with fake people across London.
            </p>
          )}

          <div className="mb-10 max-w-lg">
            <h2 className="text-lg font-semibold text-navy mb-3">How it works</h2>
            <div className="space-y-3 text-base leading-relaxed text-muted">
              <p>
                <span className="font-medium text-navy">1. Go live.</span> Pick
                coffee, walk, co-work, or activity, how long you&apos;re free, and
                roughly where you are.
              </p>
              <p>
                <span className="font-medium text-navy">2. See who&apos;s free.</span>{" "}
                Live people show on the map. Rank by closest or by vibe match.
              </p>
              <p>
                <span className="font-medium text-navy">3. Meet IRL.</span> Send a
                connect, chat if they accept, hang out, then rate each other.
              </p>
            </div>
          </div>

          <WaitlistForm className="mb-8 max-w-lg" />

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/demo" className="popby-btn popby-btn-accent">
              Try the full demo
            </Link>
            <Link href="/login" className="popby-btn popby-btn-ghost text-sm">
              Sign in (founders)
            </Link>
          </div>
        </div>

        <p className="text-base text-muted max-w-lg leading-relaxed pt-4">
          City-wide live accounts are not open yet. The demo runs the whole loop
          with fake people across {APP_CITY}. Waitlist + demo for Encode.
        </p>
      </div>

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Adam"
                className="w-10 h-10 rounded-full object-cover bg-paper-2"
              />
              <div>
                <p className="text-base font-semibold text-navy">Adam</p>
                <p className="text-base text-muted">Founder · 45m left</p>
              </div>
              <span className="ml-auto live-dot" />
            </div>
            <p className="text-base text-navy font-medium">Coffee · product feedback</p>
            <p className="text-base text-muted mt-1">Near Old Street</p>
          </div>

          <div className="popby-card p-6 max-w-xs w-full text-left rotate-[2deg] translate-x-4">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://randomuser.me/api/portraits/women/65.jpg"
                alt="Sara"
                className="w-10 h-10 rounded-full object-cover bg-paper-2"
              />
              <div>
                <p className="text-base font-semibold text-navy">Sara</p>
                <p className="text-base text-muted">Operator · 1h left</p>
              </div>
              <span className="ml-auto live-dot" />
            </div>
            <p className="text-base text-navy font-medium">Walk · brainstorm</p>
            <p className="text-base text-muted mt-1">Shoreditch</p>
          </div>

          <p className="text-base text-paper-3 mt-10 max-w-sm leading-relaxed">
            Real people, free right now, a short walk away. Meet them offline.
          </p>
        </div>
      </div>
    </main>
  );
}
