import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE } from "@/lib/config";

/** Halaman yang boleh dituju lewat `?to=`. Tujuan lain diabaikan agar tautan ini tidak bisa dipakai mengalihkan ke situs lain. */
const ALLOWED_TARGETS = ["/produk", "/checkout", "/daftar"];

function safeTarget(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");
  if (!to) return null;
  try {
    const url = new URL(to, request.url);
    if (url.origin !== request.nextUrl.origin) return null;
    const ok = url.pathname === "/" || ALLOWED_TARGETS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
    return ok ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}

/**
 * Tautan referral agen: kerjalin.id/r/KJXXXXXX
 * Menyimpan kode di cookie (30 hari) lalu membawa pengunjung ke halaman daftar, atau ke halaman produk
 * bila tautannya memakai `?to=/produk/nama-produk` (tautan jual per produk).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  const res = NextResponse.redirect(new URL(safeTarget(request) ?? "/daftar", request.url));
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
