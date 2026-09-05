/** Accept http(s) URLs or known social profile paths; reject bare @handles. */

const SOCIAL_HOST_RE =
  /^(?:www\.)?(linkedin\.com|x\.com|twitter\.com|instagram\.com)$/i;

const SOCIAL_PATH_RE =
  /^(?:www\.)?(linkedin\.com|x\.com|twitter\.com|instagram\.com)\/.+/i;

export const SOCIAL_LINK_ERROR =
  "Need a LinkedIn, X, or Instagram link (full URL, not a handle).";

export function isValidSocialLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("@")) return false;
  if (/\s/.test(trimmed)) return false;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      return Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  if (SOCIAL_PATH_RE.test(trimmed)) {
    try {
      const url = new URL(`https://${trimmed}`);
      return SOCIAL_HOST_RE.test(url.hostname);
    } catch {
      return false;
    }
  }

  return false;
}
