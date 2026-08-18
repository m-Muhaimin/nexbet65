import { NextRequest, NextResponse } from "next/server";

import { verifySession } from "@/lib/auth";
import { sessionCookieFromRequest } from "@/lib/session";

const PROTECTED_PREFIXES = ["/lobby", "/games"];
const PUBLIC_ROUTES = ["/register", "/sign-in"];
const PUBLIC_ASSET_PREFIXES = ["/assets/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = sessionCookieFromRequest(req);
  const user = await verifySession(token);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  ) && !pathname.match(/\.(js|css|html|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/);

  const isPublicAuth = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isPublicAuth && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/lobby";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/lobby/:path*",
    "/games/:path*",
    "/profile/:path*",
    "/register/:path*",
    "/sign-in/:path*",
  ],
};
