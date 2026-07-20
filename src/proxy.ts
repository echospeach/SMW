import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/studio",
  "/automation",
  "/accounts",
  "/calendar",
  "/billing",
];
const AUTH_PAGES = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isAuthPage && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
