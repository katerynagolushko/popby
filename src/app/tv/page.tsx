import type { Metadata } from "next";
import Image from "next/image";
import TvQrCode from "@/components/TvQrCode";
import { APP_DOMAIN, APP_NAME, APP_TAGLINE } from "@/lib/brand";

const LANDING_URL = "https://hangby.me";

export const metadata: Metadata = {
  title: `${APP_NAME}: Encode screen`,
  description: APP_TAGLINE,
  robots: { index: false, follow: false },
};

export default function TvPage() {
  return (
    <>
      <style>{`body:has(.tv-screen)::before { display: none; }`}</style>
      <main className="tv-screen relative h-svh w-svw overflow-hidden bg-paper text-navy">
        <Image
          src="/tv-left-artwork.png"
          alt=""
          aria-hidden
          width={1176}
          height={830}
          priority
          unoptimized
          draggable={false}
          className="pointer-events-none absolute left-0 top-[3.765432%] h-[82.407407%] w-[65.677083%]"
        />
        <Image
          src="/tv-right-artwork.png"
          alt=""
          aria-hidden
          width={1093}
          height={1136}
          priority
          unoptimized
          draggable={false}
          className="pointer-events-none absolute left-[54.038083%] top-[2.08784%] h-[82.222222%] w-[44.479167%]"
        />

        <TvQrCode
          value={LANDING_URL}
          size={466}
          className="absolute left-[59.663194%] top-[10.492593%] h-auto w-[32.341667%]"
        />

        <section className="sr-only">
          <h1>The first startup social network for IRL</h1>
          <p>See who&apos;s free nearby and meet in person spontaneously.</p>
          <p>Scan to join the waitlist</p>
          <p>{APP_DOMAIN.toLowerCase()}</p>
        </section>
      </main>
    </>
  );
}
