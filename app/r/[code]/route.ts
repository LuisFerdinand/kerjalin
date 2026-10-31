import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE } from "@/lib/config";

/**
 * Tautan referral agen: kerjalin.id/r/KJXXXXXX
 * Menyimpan kode di cookie (30 hari) lalu membawa pengunjung ke halaman daftar.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  const res = NextResponse.redirect(new URL("/daftar", request.url));
  if (clean) {
    res.cookies.set(REF_COOKIE, clean, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return res;
}
