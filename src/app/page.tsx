import Link from "next/link";
import Logo from "@/components/Logo";
import LandingHeroMapLoader from "@/components/LandingHeroMapLoader";
import WaitlistPriorityNote from "@/components/WaitlistPriorityNote";
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
      <section className="relative z-10 flex flex-col w-full min-h-svh lg:h-full lg:min-h-0 lg:w-[44%] xl:w-[40%] px-5 pt-3 pb-4 sm:px-8 sm:pt-4 sm:pb-5 lg:px-8 lg:pt-4 lg:pb-4 xl:px-12 xl:pt-5 xl:pb-5">
        <Logo size="md" />

        <div className="flex-1 flex flex-col justify-center min-h-0 py-4 sm:py-5 lg:py-2 xl:py-4">
          <div className="flex flex-col max-w-xl">
            <h1 className="font-display font-extrabold text-[clamp(2.35rem,5.2vw+0.4rem,3.75rem)] lg:text-[clamp(2.35rem,2.6vw+0.85rem,3.55rem)] xl:text-[clamp(2.75rem,2.4vw+1rem,4.25rem)] text-navy leading-[1.02] tracking-[-0.04em]">
              The <span className="hl-accent">startup</span> social network for{" "}
              <span className="hl-accent">IRL</span>
            </h1>

            <p className="mt-[clamp(1.25rem,3.5vh,2.75rem)] font-display font-semibold tracking-[-0.02em] text-[clamp(1.2rem,1.1vw+0.85rem,1.9rem)] leading-[1.45] text-navy">
              It&apos;s time to make it easy to meet{" "}
              <span className="hl-accent">cool people</span> in the startup world
            </p>

            <p className="mt-[clamp(0.85rem,2vh,1.75rem)] font-display font-semibold tracking-[-0.02em] text-[clamp(1.1rem,0.9vw+0.75rem,1.6rem)] leading-[1.35] text-navy">
              spontaneous hangouts
            </p>

            {softGated && (
              <p className="mt-5 text-base sm:text-lg text-navy bg-paper-2 border border-paper-3 rounded-xl px-4 py-2.5 leading-snug">
                The live map with real accounts isn&apos;t open yet. Join the
                waitlist or try the full demo with fake people across {APP_CITY}.
              </p>
            )}

            <div className="mt-[clamp(1.25rem,2.8vh,2.25rem)] flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
              <Link
                href="/waitlist"
                className="popby-btn popby-btn-accent landing-cta"
              >
                Join the waitlist*
              </Link>
              <Link
                href="/demo"
                className="popby-btn popby-btn-navy landing-cta"
              >
                Try the full demo
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 sm:pt-4 space-y-1.5 sm:space-y-2 max-w-xl shrink-0">
          <WaitlistPriorityNote className="text-[0.95rem] sm:text-base lg:text-[0.95rem] xl:text-base text-navy/65 leading-snug" />
          <p className="text-[0.95rem] sm:text-base lg:text-[0.95rem] xl:text-base text-navy/65 leading-snug">
            The V1 is for London. If you want us to launch in your city,{" "}
            <Link
              href="/waitlist/city"
              className="text-navy/80 font-medium underline underline-offset-2 hover:text-accent"
            >
              join this waitlist
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[42vh] sm:min-h-[48vh] lg:min-h-0 lg:h-full border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMapLoader className="absolute inset-0 h-full w-full min-h-[42vh] lg:min-h-full" />
      </section>
    </main>
  );
}
