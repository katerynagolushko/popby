import Link from "next/link";
import Logo from "@/components/Logo";
import LandingHeroMapLoader from "@/components/LandingHeroMapLoader";
import { APP_CITY, APP_NAME } from "@/lib/brand";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ gate?: string }>;
}) {
  const params = await searchParams;
  const softGated = params.gate === "map";

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <section className="relative z-10 flex flex-col justify-between w-full lg:w-[44%] xl:w-[40%] px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14 xl:px-14">
        <Logo size="md" />

        <div className="py-10 lg:py-12 flex-1 flex flex-col justify-center">
          <h1 className="font-display font-extrabold text-[2.65rem] sm:text-[3.5rem] xl:text-[4.35rem] text-navy leading-[0.98] tracking-[-0.04em] mb-10 max-w-[14ch]">
            The{" "}
            <span className="hl-accent">startup</span> social network for{" "}
            <span className="hl-accent">IRL!!!!</span>
          </h1>

          <ul className="space-y-7 sm:space-y-8 text-xl sm:text-2xl leading-snug text-navy/85 max-w-xl mb-10 font-display font-semibold tracking-[-0.02em] list-none pl-0">
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              See who&apos;s free to{" "}
              <span className="hl-accent">spontaneously</span> hang out nearby.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              Connect the startup ecosystem with{" "}
              <span className="hl-mint">human-first</span> connections.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              Don&apos;t pitch unless asked. You&apos;re here to make{" "}
              <span className="hl-accent">friends</span>.
            </li>
            <li className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-navy/35">
              No feed. No posts. No followers. Toggle{" "}
              <span className="hl-mint">live</span>, meet in person.
            </li>
          </ul>

          {softGated && (
            <p className="text-lg text-navy bg-paper-2 border border-paper-3 rounded-xl px-4 py-3 mb-8 max-w-xl leading-relaxed">
              The live map with real accounts isn&apos;t open yet. Join the
              waitlist or try the full demo with fake people across {APP_CITY}.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="/waitlist" className="popby-btn popby-btn-accent text-xl px-8 min-h-[56px]">
              Join the waitlist
            </Link>
            <Link href="/demo" className="popby-btn popby-btn-navy text-xl px-8 min-h-[56px]">
              Try the full demo
            </Link>
          </div>
        </div>

        <footer className="pt-2">
          <p className="text-lg text-navy/70 leading-relaxed max-w-xl">
            {APP_NAME} starts in {APP_CITY}. City-wide live accounts aren&apos;t
            open yet. The demo runs the full loop with fake people.
          </p>
        </footer>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[48vh] sm:min-h-[52vh] lg:min-h-screen border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMapLoader className="absolute inset-0 h-full w-full min-h-[48vh] lg:min-h-full" />
      </section>
    </main>
  );
}
