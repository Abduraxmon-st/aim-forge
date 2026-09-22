/**
 * The deployment origin is deliberately opt-in. Local exports have no public
 * canonical URL and remain noindex until SITE_URL is set and the app is rebuilt.
 * This is server/build-time configuration, never a browser-derived URL.
 */
export function parseSiteOrigin(value?: string): string | undefined {
  const input = value?.trim();
  if (!input) return undefined;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("SITE_URL must be an absolute HTTPS origin.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !/^https:\/\/[^/?#\\\s]+\/?$/i.test(input)
  ) {
    throw new Error(
      "SITE_URL must be an HTTPS origin without a path, query, fragment, or credentials.",
    );
  }
  return url.origin;
}

export function getSiteOrigin(): string | undefined {
  return parseSiteOrigin(process.env.SITE_URL);
}
