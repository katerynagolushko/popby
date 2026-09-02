"use client";

import dynamic from "next/dynamic";
import type { MapPerson } from "./PopbyMap";

const PopbyMapInner = dynamic(() => import("./PopbyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-paper-2 flex items-center justify-center text-muted">
      Loading map…
    </div>
  ),
});

export type { MapPerson };

export default PopbyMapInner;
