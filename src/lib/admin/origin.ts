export type FormOriginResult =
  | { ok: true }
  | { ok: false; reason: "cross_site" | "unverifiable" };

export function checkAdminFormOrigin(request: Request): FormOriginResult {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) {
    return fetchSite === "same-origin"
      ? { ok: true }
      : { ok: false, reason: "cross_site" };
  }

  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return { ok: false, reason: "unverifiable" };

  try {
    const requestUrl = new URL(request.url);
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
    const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : requestUrl.protocol.slice(0, -1);
    const host = request.headers.get("host") || requestUrl.host;
    const effectiveOrigin = new URL(`${protocol}://${host}`).origin;

    return new URL(origin).origin === effectiveOrigin
      ? { ok: true }
      : { ok: false, reason: "cross_site" };
  } catch {
    return { ok: false, reason: "unverifiable" };
  }
}
