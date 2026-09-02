/**
 * Curated faker-js person portraits for the Encode demo + landing cards.
 *
 * The full 0–99 pools are heavily middle-aged/elderly. We only use a
 * visually audited allowlist of faces that clearly read ~20–40 (no grey
 * hair, no heavy wrinkles, no elderly corporate headshots).
 *
 * CDN: jsDelivr → faker-js/assets-person-portrait (1024×1024 JPEG).
 * Path segment `512` is the set name; files are 1024px.
 */

export type DemoPortraitGender = "male" | "female";

const FAKER_PORTRAIT_BASE =
  "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait@main";

/**
 * Strict young male indices — audited against the full 0–99 set.
 * Excludes e.g. Louis-style elderly suit (47) and Adrian-style grey polo (44).
 */
export const YOUNG_MALE_PORTRAIT_INDICES = [
  2, 4, 5, 7, 9, 12, 16, 18, 21, 27, 32, 34, 37, 45, 46, 48, 49, 51, 58, 63,
  66, 70, 71, 72, 74, 75, 76, 78, 81, 82, 84, 87, 88, 91, 97, 98,
] as const;

/**
 * Strict young female indices — audited; no grey hair / senior faces.
 */
export const YOUNG_FEMALE_PORTRAIT_INDICES = [
  0, 1, 2, 3, 5, 8, 10, 17, 22, 26, 28, 30, 31, 36, 40, 42, 43, 44, 45, 47,
  50, 56, 57, 58, 59, 60, 64, 65, 66, 67, 68, 72, 73, 74, 82, 84, 85, 86, 87,
  88, 89, 90, 91, 92, 94, 97, 98, 99,
] as const;

export function portraitUrl(
  gender: DemoPortraitGender,
  index: number
): string {
  return `${FAKER_PORTRAIT_BASE}/${gender}/512/${index}.jpg`;
}

/** Landing hero cards — young faces shared with pinned demo seeds. */
export const LANDING_CARD_PHOTOS = {
  Adam: portraitUrl("male", 32),
  Sara: portraitUrl("female", 65),
  Maya: portraitUrl("female", 44),
  Leo: portraitUrl("male", 75),
} as const;
