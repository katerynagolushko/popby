import Link from "next/link";
import Logo from "@/components/Logo";
import LandingHeroMapLoader from "@/components/LandingHeroMapLoader";
import { APP_CITY } from "@/lib/brand";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  const params = await searchParams;
  const softGated = params.gate === "map";

  return (
    <main className="min-h-svh flex flex-col lg:flex-row lg:h-svh lg:overflow-hidden">
      <section className="relative z-10 flex flex-col w-full min-h-svh lg:h-full lg:min-h-0 lg:w-[44%] xl:w-[40%] px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7 xl:px-12">
        <Logo size="md" />

        <div className="flex-1 flex flex-col justify-center gap-5 sm:gap-6 lg:gap-7 min-h-0 py-4 sm:py-5">
          <hgroup className="max-w-[18ch]">
            <h1 className="font-display font-extrabold text-[2.35rem] sm:text-[3.15rem] xl:text-[3.85rem] text-navy leading-[0.98] tracking-[-0.04em]">
              The <span className="hl-accent">startup</span> social network for{" "}
              <span className="hl-accent">IRL</span>
            </h1>
            <p className="mt-2 sm:mt-3 font-display font-bold text-[1.35rem] sm:text-[1.85rem] xl:text-[2.35rem] text-accent leading-[1.05] tracking-[-0.03em]">
              London Edition
            </p>
          </hgroup>

          <ul className="space-y-3 sm:space-y-3.5 text-[1.05rem] sm:text-xl leading-snug text-navy/85 max-w-xl font-display font-semibold tracking-[-0.02em] list-none pl-0">
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              See who&apos;s free to{" "}
              <span className="hl-accent">spontaneously</span> hang out nearby.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              Connect the startup ecosystem with{" "}
              <span className="hl-accent">human-first</span> connections.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              Don&apos;t pitch unless asked. You&apos;re here to make{" "}
              <span className="hl-accent">friends</span>.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              It&apos;s time to make it easy to meet{" "}
              <span className="hl-accent">cool people</span> when you are up for
              it
            </li>
          </ul>

          {softGated && (
            <p className="text-base sm:text-lg text-navy bg-paper-2 border border-paper-3 rounded-xl px-4 py-2.5 max-w-xl leading-snug">
              The live map with real accounts isn&apos;t open yet. Join the
              waitlist or try the full demo with fake people across {APP_CITY}.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
            <Link
              href="/waitlist"
              className="popby-btn popby-btn-accent text-[1.35rem] sm:text-[1.55rem] px-10 sm:px-14 py-5 sm:py-6 min-h-[88px] sm:min-h-[98px] rounded-[14px]"
            >
              Join the waitlist
            </Link>
            <Link
              href="/demo"
              className="popby-btn popby-btn-navy text-[1.35rem] sm:text-[1.55rem] px-10 sm:px-14 py-5 sm:py-6 min-h-[88px] sm:min-h-[98px] rounded-[14px]"
            >
              Try the full demo
            </Link>
          </div>
        </div>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[42vh] sm:min-h-[48vh] lg:min-h-0 lg:h-full border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMapLoader className="absolute inset-0 h-full w-full min-h-[42vh] lg:min-h-full" />
      </section>
    </main>
  );
}
