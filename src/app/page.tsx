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
      <section className="relative z-10 flex flex-col w-full min-h-svh lg:h-full lg:min-h-0 lg:w-[44%] xl:w-[40%] px-5 pt-3 pb-4 sm:px-8 sm:pt-4 sm:pb-5 lg:px-10 lg:pt-5 lg:pb-6 xl:px-12">
        <Logo size="md" />

        <div className="flex-1 flex flex-col justify-center min-h-0 py-5 sm:py-6 lg:py-4">
          <div className="flex flex-col gap-5 sm:gap-6 max-w-xl">
            <h1 className="font-display font-extrabold text-5xl sm:text-6xl xl:text-7xl text-navy leading-[1.02] tracking-[-0.04em]">
              The <span className="hl-accent">startup</span> social network for{" "}
              <span className="hl-accent">IRL</span>
            </h1>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <p className="font-display font-semibold tracking-[-0.02em] text-[1.4rem] sm:text-[1.7rem] xl:text-[1.9rem] leading-[1.25] text-navy">
                It&apos;s time to make it easy to meet{" "}
                <span className="hl-accent">cool people</span> in the startup world
              </p>
              <p className="font-display font-semibold tracking-[-0.02em] text-[1.25rem] sm:text-[1.5rem] xl:text-[1.7rem] leading-[1.25] text-navy">
                #spontaneous hangouts
              </p>
            </div>

            {softGated && (
              <p className="text-base sm:text-lg text-navy bg-paper-2 border border-paper-3 rounded-xl px-4 py-2.5 leading-snug">
                The live map with real accounts isn&apos;t open yet. Join the
                waitlist or try the full demo with fake people across {APP_CITY}.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 pt-1">
              <Link
                href="/waitlist"
                className="popby-btn popby-btn-accent text-[1.7rem] sm:text-[2rem] xl:text-[2.15rem] px-12 sm:px-16 py-7 sm:py-8 min-h-[112px] sm:min-h-[128px] rounded-[16px]"
              >
                Join the waitlist
              </Link>
              <Link
                href="/demo"
                className="popby-btn popby-btn-navy text-[1.7rem] sm:text-[2rem] xl:text-[2.15rem] px-12 sm:px-16 py-7 sm:py-8 min-h-[112px] sm:min-h-[128px] rounded-[16px]"
              >
                Try the full demo
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-auto pt-4 sm:pt-5 text-xl sm:text-2xl text-navy/80 leading-snug max-w-xl font-medium shrink-0">
          The V1 is for London. If you want us to launch in your city,{" "}
          <Link
            href="/waitlist/city"
            className="text-navy font-semibold underline underline-offset-2 hover:text-accent"
          >
            join this waitlist
          </Link>
          .
        </p>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[42vh] sm:min-h-[48vh] lg:min-h-0 lg:h-full border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMapLoader className="absolute inset-0 h-full w-full min-h-[42vh] lg:min-h-full" />
      </section>
    </main>
  );
}
