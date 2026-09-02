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
          <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] text-navy leading-[1.06] mb-3">
            The social network that only works IRL
          </h1>
          <p className="text-xl sm:text-2xl font-display font-semibold text-navy/80 leading-snug mb-8">
            The startup social network for IRL.
          </p>

          <div className="space-y-4 text-lg leading-relaxed text-muted max-w-xl mb-10">
            <p>
              See who&apos;s free to{" "}
              <span className="text-navy font-medium">spontaneously</span> hang
              out nearby.
            </p>
            <p>
              Connect the startup ecosystem and forge meaningful{" "}
              <span className="text-navy font-medium">human-first</span>{" "}
              connections.
            </p>
            <p>
              Don&apos;t pitch unless someone asks, or you both agreed in
              advance. You&apos;re here to make friends with people in the
              startup world.
            </p>
            <p className="text-base text-muted/90">
              No feed. No posts. No follower counts. Toggle live, pick a format,
              meet in person.
            </p>
          </div>

          {softGated && (
            <p className="text-base text-navy bg-paper-2 border border-paper-3 rounded-xl px-4 py-3 mb-8 max-w-xl leading-relaxed">
              The live map with real accounts isn&apos;t open yet. Join the
              waitlist or try the full demo with fake people across {APP_CITY}.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="/waitlist" className="popby-btn popby-btn-accent text-base px-6 py-3.5">
              Join the waitlist
            </Link>
            <Link href="/demo" className="popby-btn popby-btn-navy text-base px-6 py-3.5">
              Try the full demo
            </Link>
          </div>
        </div>

        <footer className="pt-2 space-y-2">
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
            {APP_NAME} starts in {APP_CITY}. City-wide live accounts aren&apos;t
            open yet. The demo runs the full loop with fake people.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-muted/80 underline underline-offset-2 hover:text-navy transition-colors"
          >
            Founder sign-in
          </Link>
        </footer>
      </section>

      <section className="relative w-full lg:w-[56%] xl:w-[60%] min-h-[48vh] sm:min-h-[52vh] lg:min-h-screen border-t border-paper-3 lg:border-t-0 lg:border-l">
        <LandingHeroMapLoader className="absolute inset-0 h-full w-full min-h-[48vh] lg:min-h-full" />
      </section>
    </main>
  );
}
