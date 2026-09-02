import Link from "next/link";
import Logo from "@/components/Logo";
import LandingHeroMap from "@/components/LandingHeroMap";
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
      <section className="relative z-10 flex flex-col w-full min-h-svh lg:h-full lg:min-h-0 lg:w-[44%] xl:w-[40%] px-5 pt-4 pb-5 sm:px-8 sm:pt-5 sm:pb-6 lg:px-10 lg:pt-6 lg:pb-7 xl:px-12">
        <Logo size="md" />

        <div className="mt-5 sm:mt-6 lg:mt-7 flex flex-col gap-5 sm:gap-6 min-h-0">
          <hgroup className="max-w-xl">
            <h1 className="font-display font-extrabold text-[2.35rem] sm:text-[3.15rem] xl:text-[3.85rem] text-navy leading-[1.05] tracking-[-0.04em]">
              The <span className="hl-accent">startup</span> social network for{" "}
              <span className="hl-accent">IRL</span>
            </h1>
            <p className="mt-2 sm:mt-2.5 font-display font-semibold text-xl sm:text-2xl text-navy/55 tracking-[-0.02em]">
              London Edition
            </p>
          </hgroup>

          <div className="max-w-xl space-y-5 sm:space-y-6 font-display font-semibold tracking-[-0.02em] text-[1.35rem] sm:text-[1.65rem] xl:text-[1.85rem] leading-[1.25] text-navy/85">
            <p>
              It&apos;s time to make it easy to meet{" "}
              <span className="hl-accent">cool people</span>
              <br className="hidden sm:block" /> in the{" "}
              <span className="hl-accent">startup world</span>
              <br className="hidden sm:block" /> when you are up for it
            </p>
            <p>
              See who&apos;s <span className="hl-accent">spontaneously</span> up
              for a hang
              <br className="hidden sm:block" /> and form{" "}
              <span className="hl-accent">real connection</span>,
              <br className="hidden sm:block" />{" "}
              <span className="hl-accent">no bs</span> selling upfront
            </p>
          </div>

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

        <p className="mt-auto pt-8 sm:pt-10 text-base sm:text-lg text-navy/70 leading-snug max-w-xl">
          The V1 is for London. If you want us to launch in your city,{" "}
          <Link
            href="/waitlist/city"
            className="text-navy font-medium underline underline-offset-2 hover:text-accent"
          >
            join this waitlist
          </Link>
          .
        </p>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[42vh] sm:min-h-[48vh] lg:min-h-0 lg:h-full border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMap className="absolute inset-0 h-full w-full min-h-[42vh] lg:min-h-full" />
      </section>
    </main>
  );
}
