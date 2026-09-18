import { auth as proxy } from "@/auth";

export { proxy };

export const config = {
  matcher: [
    // Protect app pages only. /api/* is excluded so data routes return
    // proper 401 JSON via requireOwnerId() instead of a 307 redirect
    // to /login (fetch callers can't handle redirects).
    // Auth.js `authorized` callback allows /login + /api/auth through.
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
