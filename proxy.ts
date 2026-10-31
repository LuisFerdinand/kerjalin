import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Pengecekan optimistis: arahkan pengunjung tanpa cookie sesi ke halaman masuk.
 * Validasi sesi & peran yang sebenarnya dilakukan di setiap halaman / server action
 * (lihat lib/session.ts).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/masuk", request.url);
    url.searchParams.set(
      "callbackUrl",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
