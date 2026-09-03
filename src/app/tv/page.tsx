import type { Metadata } from "next";
import { LogoMark, AppWordmark } from "@/components/Logo";
import TvQrCode from "@/components/TvQrCode";
import { APP_DOMAIN, APP_NAME, APP_TAGLINE } from "@/lib/brand";

/** Absolute URL for phone cameras. Must stay production domain. */
const LANDING_URL = "https://hangby.me";

export const metadata: Metadata = {
  title: `${APP_NAME}: Encode screen`,
  description: APP_TAGLINE,
  robots: { index: false, follow: false },
};

/**
 * Full-viewport TV / lobby attract for Encode.
 * Landscape-first: brand + pitch on one half, QR region on the other (~50/50).
 * Open in browser fullscreen (F11) on the display.
 */
export default function TvPage() {
  return (
    <main className="tv-screen relative h-svh w-svw overflow-hidden bg-paper text-navy">
      {/* Soft brand atmosphere: cream to paper wash, no purple */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 18% 40%, rgba(255, 87, 34, 0.08), transparent 55%), radial-gradient(ellipse 55% 50% at 88% 55%, rgba(26, 31, 54, 0.06), transparent 50%), linear-gradient(165deg, #f2efe9 0%, #ebe6dc 48%, #e4dfd4 100%)",
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-row items-stretch">
        {/* Pitch: ~half the viewport */}
        <section className="tv-rise flex w-1/2 min-w-0 flex-col justify-center px-[3.25vw] py-[5vh]">
          <div className="inline-flex items-center gap-3">
            <LogoMark size={48} tone="onLight" />
            <AppWordmark
              className="text-[clamp(1.5rem,2.2vw,2.25rem)]"
              tone="onLight"
            />
          </div>

          <h1 className="mt-[4.5vh] font-display text-[clamp(2.5rem,4vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.05em]">
            <span className="block whitespace-nowrap">
              The <span className="hl-accent">first startup</span>
            </span>
            <span className="block whitespace-nowrap">
              social network for <span className="hl-accent">IRL</span>
            </span>
          </h1>

          <p className="mt-[3vh] max-w-[32ch] font-body text-[clamp(1.15rem,1.55vw,1.6rem)] font-medium leading-[1.45] text-navy/80">
            See who&apos;s free nearby and meet in person spontaneously.
          </p>
        </section>

        {/* QR region: ~half the viewport; code has padding inside */}
        <section className="tv-rise tv-rise-delay flex w-1/2 min-w-0 flex-col items-center justify-center px-[4vw] py-[5vh]">
          <div className="tv-qr-frame rounded-[1.35rem] border-[3px] border-accent/70 bg-paper p-[clamp(0.75rem,1.4vw,1.5rem)] shadow-[0_12px_40px_rgba(26,31,54,0.12)]">
            <TvQrCode
              value={LANDING_URL}
              size={520}
              className="h-[min(58vh,36vw)] w-[min(58vh,36vw)]"
            />
          </div>

          <p className="mt-[2.8vh] text-center font-display text-[clamp(1.1rem,1.5vw,1.55rem)] font-bold tracking-tight text-navy">
            Scan to join the waitlist
          </p>
          <p className="mt-2 text-center font-body text-[clamp(0.95rem,1.2vw,1.25rem)] font-medium text-navy/70">
            {APP_DOMAIN.toLowerCase()}
          </p>
        </section>
      </div>
    </main>
  );
}
