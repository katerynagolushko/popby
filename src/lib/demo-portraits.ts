/**
 * Curated LinkedIn-style business-casual headshots for Encode demo + landing.
 *
 * Source: Unsplash (images.unsplash.com), face-cropped 512², CORS-friendly.
 * Visually audited allowlist: professional headshots only, age ~20–40,
 * business-casual dress, no hijabs, no vacation/beach/shirtless/tourist selfies.
 * Male pool is majority young white men so the generated crowd plurality
 * lands roughly 45–55%+. Female pool keeps ≤1 Black woman.
 */

export type DemoPortraitGender = "male" | "female";

function unsplashFace(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=512&h=512&fit=crop&crop=faces&auto=format&q=80`;
}

/** Young white men — LinkedIn / business-casual. */
const WHITE_MALE_PHOTO_IDS = [
  "1500648767791-00dcc994a43e",
  "1519085360753-af0119f7cbe7",
  "1534030347209-467a5b0ad3e6",
  "1546572797-e8c933a75a1f",
  "1556474835-b0f3ac40d4d1",
  "1560250097-0b93528c311a",
  "1568316674077-d72ee56de61c",
  "1589832486202-cf43d3c2547b",
  "1590086782957-93c06ef21604",
  "1624797432677-6f803a98acb3",
  "1651684215020-f7a5b6610f23",
  "1652471943570-f3590a4e52ed",
  "1758518729286-e8d94cc231f5",
  "1770510067230-1059f0776b3a",
  "1774604269092-5cb669481519",
  "1776111842991-4a189c07e609",
  "1780733057909-e40d3f4c8cbe",
  "1781271573424-2cf70e4875cd",
  "1536896799204-08992dd73aa3",
  "1537368910025-700350fe46c7",
  "1580685006710-0ec511f33a96",
  "1591818873794-ba8279c7da8a",
  "1613742743080-a59851f3008d",
  "1644582173889-804a11fe650c",
  "1649712041612-021cf78bca23",
  "1671116559951-916ea2dba662",
  "1705645930353-0e335311ef20",
  "1758518729314-b02874db8c37",
  "1758599543136-5977bf2dd922",
  "1758691737644-ef8be18256c3",
] as const;

/** Other young men (limited diversity) — same professional bar. */
const OTHER_MALE_PHOTO_IDS = [
  "1495603889488-42d1d66e5523",
  "1588178454780-441fa5b99fa5",
  "1589386417686-0d34b5903d23",
  "1610652492500-ded49ceeb378",
  "1614023342667-6f060e9d1e04",
  "1616805765352-beedbad46b2a",
] as const;

/** Young women — LinkedIn / business-casual; ≤1 Black woman; no hijabs. */
const FEMALE_PHOTO_IDS = [
  "1494790108377-be9c29b29330",
  "1506863530036-1efeddceb993",
  "1543949806-2c9935e6aa78",
  "1573496359142-b8d87734a5a2",
  "1582896911227-c966f6e7fb93",
  "1585240975858-7264fd020798",
  "1604072366595-e75dc92d6bdc",
  "1607746882042-944635dfe10e",
  "1614786269829-d24616faf56d",
  "1616065297556-f05bc00c9a3e",
  "1620246499808-d9fe1b7858dc",
  "1627161683077-e34782c24d81",
  "1631377307475-9acfa929b062",
  "1650091903034-5f3bb37c35d2",
  "1655249493799-9cee4fe983bb",
  "1658932447761-8a59cd02d201",
  "1662104935541-aa5b6e02886d",
  "1662104935883-e9dd0619eaba",
  "1665224751641-8ea911ca2267",
  "1685760259914-ee8d2c92d2e0",
  "1689600944138-da3b150d9cb8",
  "1563132337-f159f484226c",
] as const;

export const YOUNG_MALE_PORTRAIT_URLS: readonly string[] = [
  ...WHITE_MALE_PHOTO_IDS,
  ...OTHER_MALE_PHOTO_IDS,
].map(unsplashFace);

/** White-male subset used first when filling the male quota. */
export const WHITE_MALE_PORTRAIT_URLS: readonly string[] =
  WHITE_MALE_PHOTO_IDS.map(unsplashFace);

export const YOUNG_FEMALE_PORTRAIT_URLS: readonly string[] =
  FEMALE_PHOTO_IDS.map(unsplashFace);

const MALE_URL_SET = new Set(YOUNG_MALE_PORTRAIT_URLS);
const FEMALE_URL_SET = new Set(YOUNG_FEMALE_PORTRAIT_URLS);

export function portraitGender(url: string): DemoPortraitGender | null {
  if (MALE_URL_SET.has(url)) return "male";
  if (FEMALE_URL_SET.has(url)) return "female";
  if (/\/assets-person-portrait@[^/]+\/male\//.test(url) || /\/portraits\/men\//.test(url)) {
    return "male";
  }
  if (/\/assets-person-portrait@[^/]+\/female\//.test(url) || /\/portraits\/women\//.test(url)) {
    return "female";
  }
  return null;
}

/** Landing hero cards — same LinkedIn pool as demo seeds. */
export const LANDING_CARD_PHOTOS = {
  Adam: unsplashFace("1560250097-0b93528c311a"),
  Sara: unsplashFace("1573496359142-b8d87734a5a2"),
  Maya: unsplashFace("1662104935883-e9dd0619eaba"),
  Leo: unsplashFace("1705645930353-0e335311ef20"),
} as const;
