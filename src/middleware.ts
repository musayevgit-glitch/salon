import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, clientAddress, rateLimitHeaders, rateLimits } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Better Auth owns this handler. Limit only state-changing auth operations;
  // session reads must stay cheap and reliable for normal navigation.
  if (request.method === "POST" && pathname.startsWith("/api/auth/")) {
    const result = checkRateLimit("auth", clientAddress(request.headers), rateLimits.authentication);
    if (!result.allowed) {
      return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429, headers: rateLimitHeaders(result) });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/auth/:path*"] };
