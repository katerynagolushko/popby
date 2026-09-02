/** OpenFreeMap — free vector tiles, no signup, no API key. https://openfreemap.org */

export type MapStyleId = "positron" | "liberty" | "bright";

export const OPENFREEMAP_STYLES: Record<MapStyleId, string> = {
  // Clean light — closest to polished startup map look
  positron: "https://tiles.openfreemap.org/styles/positron",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
};

export const DEFAULT_MAP_STYLE: MapStyleId = "bright";

export const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
