"use client";

import dynamic from "next/dynamic";

const LandingHeroMap = dynamic(() => import("./LandingHeroMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[42vh] bg-paper-2 flex items-center justify-center text-muted text-base">
      Loading London map…
    </div>
  ),
});

export default LandingHeroMap;
