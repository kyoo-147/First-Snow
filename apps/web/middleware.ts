import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  appHost,
  isDashboardPath,
  isLocalDevelopmentHost,
  marketingHost
} from "./src/lib/site-hosts";

function buildRedirectUrl(protocol: string, host: string, pathname: string, search: string) {
  const target = new URL(`${protocol}//${host}`);
  target.pathname = pathname;
  target.search = search;
  return target;
}

function getRequestedProtocol(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto === "http" || forwardedProto === "https") {
    return `${forwardedProto}:`;
  }

  return request.nextUrl.protocol;
}

export function middleware(request: NextRequest) {
  const requestHostHeader =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const requestHost = requestHostHeader.split(":")[0].toLowerCase();
  const { pathname, search } = request.nextUrl;
  const protocol = getRequestedProtocol(request);

  if (!requestHost || isLocalDevelopmentHost(requestHost)) {
    return NextResponse.next();
  }

  if (requestHost === appHost) {
    if (pathname === "/") {
      return NextResponse.redirect(buildRedirectUrl(protocol, appHost, "/dashboard", search));
    }

    if (!isDashboardPath(pathname)) {
      return NextResponse.redirect(buildRedirectUrl(protocol, marketingHost, pathname, search));
    }

    return NextResponse.next();
  }

  if (requestHost === marketingHost && isDashboardPath(pathname)) {
    return NextResponse.redirect(buildRedirectUrl(protocol, appHost, pathname, search));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
