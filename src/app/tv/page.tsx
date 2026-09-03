import type { Metadata } from "next";
import { LogoMark, AppWordmark } from "@/components/Logo";
import TvQrCode from "@/components/TvQrCode";
import { APP_DOMAIN, APP_NAME, APP_TAGLINE } from "@/lib/brand";

/** Absolute URL for phone cameras — must stay production domain. */
const LANDING_URL = "https://hangby.me";

export const metadata: Metadata = {
  title: `${APP_NAME} — Encode screen`,
  description: APP_TAGLINE,
  robots: { index: false, follow: false },
};

/**
 * Full-viewport TV / lobby attract for Encode.
 * Landscape-first: brand + pitch left, large landing QR right.
 * Open in browser fullscreen (F11) on the display.
 */
export default function TvPage() {
  return (
    <main className="tv-screen relative h-svh w-svw overflow-hidden bg-paper text-navy">
      {/* Soft brand atmosphere — cream → paper wash, no purple */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 18% 40%, rgba(255, 87, 34, 0.08), transparent 55%), radial-gradient(ellipse 55% 50% at 88% 55%, rgba(26, 31, 54, 0.06), transparent 50%), linear-gradient(165deg, #f2efe9 0%, #ebe6dc 48%, #e4dfd4 100%)",
        }}
      />

      <div className="relative z-10 flex h-full w-full items-center gap-[4vw] px-[5vw] py-[4.5vh]">
        {/* Pitch */}
        <section className="tv-rise flex min-w-0 flex-1 flex-col justify-center pr-[2vw]">
          <div className="inline-flex items-center gap-4">
            <LogoMark size={72} tone="onLight" />
            <AppWordmark className="text-[clamp(2.75rem,4.2vw,4.5rem)]" tone="onLight" />
          </div>

          <h1 className="mt-[5.5vh] max-w-[18ch] font-display text-[clamp(3.25rem,6.2vw,7rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
            The <span className="hl-accent">startup</span> social network for{" "}
            <span className="hl-accent">IRL</span>
          </h1>

          <p className="mt-[3.5vh] max-w-[28ch] font-display text-[clamp(1.35rem,2.1vw,2.35rem)] font-semibold leading-[1.35] tracking-[-0.02em] text-navy/85">
            See who&apos;s free nearby. Meet in person — no feed, no posts.
          </p>
        </section>

        {/* Scan target */}
        <section className="tv-rise tv-rise-delay flex shrink-0 flex-col items-center justify-center">
          <div className="tv-qr-frame rounded-[1.35rem] border-[3px] border-accent/70 bg-paper p-[1.1vw] shadow-[0_12px_40px_rgba(26,31,54,0.12)]">
            <TvQrCode
              value={LANDING_URL}
              size={420}
              className="h-[min(42vh,28vw)] w-[min(42vh,28vw)]"
            />
          </div>

          <p className="mt-[2.8vh] text-center font-display text-[clamp(1.25rem,1.9vw,2rem)] font-bold tracking-tight text-navy">
            Scan to join the waitlist
          </p>
          <p className="mt-2 text-center font-body text-[clamp(1rem,1.35vw,1.45rem)] font-medium text-navy/70">
            {APP_DOMAIN.toLowerCase()}
          </p>
        </section>
      </div>
    </main>
  );
}
