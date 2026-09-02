/**
 * Curated LinkedIn-style business-casual headshots for Encode demo + landing.
 *
 * Hosted locally under /demo-portraits (512² JPEG). Visually audited:
 * professional / corporate headshots only, age ~20–40, business-casual dress,
 * neutral/office-ish backgrounds, no hijabs, no vacation/beach/shirtless/
 * tourist selfies, no elderly faces.
 *
 * Mix targets (of the pool):
 * - Young white men ~50%+ (plurality)
 * - Other men ~15%
 * - Women ~35% (≤1 Black woman)
 */

export type DemoPortraitGender = "male" | "female";

const BASE = "/demo-portraits";

function localUrl(path: string): string {
  return `${BASE}/${path}`;
}

/** Young white men — LinkedIn / business-casual. */
export const WHITE_MALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 24 },
  (_, i) => localUrl(`male/white/${String(i).padStart(2, "0")}.jpg`)
);

/** Other young men — same professional bar. */
export const OTHER_MALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 8 },
  (_, i) => localUrl(`male/other/${String(i).padStart(2, "0")}.jpg`)
);

export const YOUNG_MALE_PORTRAIT_URLS: readonly string[] = [
  ...WHITE_MALE_PORTRAIT_URLS,
  ...OTHER_MALE_PORTRAIT_URLS,
];

/** Young women — LinkedIn / business-casual; ≤1 Black woman; no hijabs. */
export const YOUNG_FEMALE_PORTRAIT_URLS: readonly string[] = Array.from(
  { length: 17 },
  (_, i) => localUrl(`female/${String(i).padStart(2, "0")}.jpg`)
);

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

/** Landing hero cards — same LinkedIn pool as demo seeds. */
export const LANDING_CARD_PHOTOS = {
  Adam: WHITE_MALE_PORTRAIT_URLS[0]!,
  Sara: YOUNG_FEMALE_PORTRAIT_URLS[0]!,
  Maya: YOUNG_FEMALE_PORTRAIT_URLS[2]!,
  Leo: WHITE_MALE_PORTRAIT_URLS[2]!,
} as const;
