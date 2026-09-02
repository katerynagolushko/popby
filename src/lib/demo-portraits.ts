/**
 * Curated YC / founder-casual portraits for Encode demo + landing.
 *
 * Hosted locally under /demo-portraits (512² JPEG face-crops from Unsplash).
 * Visually audited for: age ~20–35, casual-tech dress (hoodies, tees, light
 * jackets, relaxed knits) — not suits, ties, or stiff bank-corp blazers.
 * Natural / office / cafe / plain-wall backgrounds OK. Portrait quality faces
 * only; no hijabs, vacation/beach/shirtless chaos, or elderly faces.
 *
 * Mix targets (of the pool):
 * - Young white men ~50%+ (plurality)
 * - Other men ~15–20%
 * - Women ~35% (few Black women; none in this set)
 *
 * Source: Unsplash face crops (images.unsplash.com), curated locally so the
 * map never depends on live CDN allowlists.
 */

export type DemoPortraitGender = "male" | "female";

const BASE = "/demo-portraits";

function localUrl(path: string): string {
  return `${BASE}/${path}`;
}

/** Young white men — YC / founder casual. */
export const WHITE_MALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 20 },
  (_, i) => localUrl(`male/white/${String(i).padStart(2, "0")}.jpg`)
);

/** Other young men — same casual-tech bar. */
export const OTHER_MALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 8 },
  (_, i) => localUrl(`male/other/${String(i).padStart(2, "0")}.jpg`)
);

export const YOUNG_MALE_PORTRAIT_URLS: readonly string[] = [
  ...WHITE_MALE_PORTRAIT_URLS,
  ...OTHER_MALE_PORTRAIT_URLS,
];

/** Young women — founder casual; no hijabs. */
export const YOUNG_FEMALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 15 },
  (_, i) => localUrl(`female/${String(i).padStart(2, "0")}.jpg`)
);

/** Full local pool — map + landing share this; every path must exist under public/. */
export const ALL_DEMO_PORTRAIT_URLS: readonly string[] = [
  ...YOUNG_MALE_PORTRAIT_URLS,
  ...YOUNG_FEMALE_PORTRAIT_URLS,
];

const MALE_URL_SET = new Set(YOUNG_MALE_PORTRAIT_URLS);
const FEMALE_URL_SET = new Set(YOUNG_FEMALE_PORTRAIT_URLS);

export function portraitGender(url: string): DemoPortraitGender | null {
  if (MALE_URL_SET.has(url)) return "male";
  if (FEMALE_URL_SET.has(url)) return "female";
  if (/\/demo-portraits\/male\//.test(url)) return "male";
  if (/\/demo-portraits\/female\//.test(url)) return "female";
  if (
    /\/assets-person-portrait@[^/]+\/male\//.test(url) ||
    /\/portraits\/men\//.test(url)
  ) {
    return "male";
  }
  if (
    /\/assets-person-portrait@[^/]+\/female\//.test(url) ||
    /\/portraits\/women\//.test(url)
  ) {
    return "female";
  }
  return null;
}

/** Landing hero cards — same YC-casual pool as demo seeds. */
export const LANDING_CARD_PHOTOS = {
  Adam: WHITE_MALE_PORTRAIT_URLS[0]!,
  Sara: YOUNG_FEMALE_PORTRAIT_URLS[0]!,
  Maya: YOUNG_FEMALE_PORTRAIT_URLS[2]!,
  Leo: WHITE_MALE_PORTRAIT_URLS[2]!,
} as const;
