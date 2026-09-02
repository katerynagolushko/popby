import { setWorkerUrl } from "maplibre-gl";

/** Must run before any MapLibre map is created (Next.js needs files in /public/maplibre). */
if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}
