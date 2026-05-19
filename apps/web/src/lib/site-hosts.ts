const DEFAULT_MARKETING_URL = "https://agentkid.io.vn";
const DEFAULT_APP_URL = "https://app.agentkid.io.vn";

function getConfiguredOrigin(rawValue: string | undefined, fallback: string) {
  if (!rawValue) {
    return fallback;
  }

  try {
    return new URL(rawValue).origin;
  } catch {
    return fallback;
  }
}

function getHostFromOrigin(origin: string) {
  return new URL(origin).host.toLowerCase();
}

export const marketingSiteUrl = getConfiguredOrigin(
  process.env.NEXT_PUBLIC_MARKETING_URL,
  DEFAULT_MARKETING_URL
);

export const appSiteUrl = getConfiguredOrigin(
  process.env.NEXT_PUBLIC_APP_URL,
  DEFAULT_APP_URL
);

export const marketingHost = getHostFromOrigin(marketingSiteUrl);
export const appHost = getHostFromOrigin(appSiteUrl);

function buildProtocolRelativeUrl(host: string, pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `//${host}${normalizedPath}`;
}

export function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function getMarketingHref(pathname = "/") {
  return buildProtocolRelativeUrl(marketingHost, pathname);
}

export function getAppHref(pathname = "/") {
  return buildProtocolRelativeUrl(appHost, pathname);
}

export function isLocalDevelopmentHost(host: string) {
  const normalizedHost = host.toLowerCase();
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost.endsWith(".local")
  );
}
