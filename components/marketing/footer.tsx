import Link from "next/link";
import { Copyright } from "@/components/brand/copyright";
import { Logo } from "@/components/brand/logo";
import { siteConfig, whatsappLink } from "@/lib/config";

const linkClass = "text-white/75 transition-colors hover:text-white";

export function Footer() {
  const wa = whatsappLink("Halo Kerjalin, saya ingin bertanya tentang program agen.");
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-14 pb-8 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-white/75">
              Platform produk digital dan aplikasi berlangganan untuk UMKM, dijual lewat jaringan agen di seluruh Indonesia.
            </p>
            <div className="mt-5 grid gap-1.5 text-sm">
              {wa && (
                <a className={linkClass} href={wa} target="_blank" rel="noreferrer">
                  WhatsApp Kerjalin
                </a>
              )}
              {siteConfig.email && (
                <a className={linkClass} href={`mailto:${siteConfig.email}`}>
                  {siteConfig.email}
                </a>
              )}
              {!wa && !siteConfig.email && <p className="text-white/60">Kontak akan segera tersedia.</p>}
            </div>
          </div>

          <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:col-span-8 lg:pl-10">
            <div className="grid content-start gap-3">
              <p className="font-bold">Jelajahi</p>
              <Link className={linkClass} href="/">Beranda</Link>
              <Link className={linkClass} href="/produk">Produk</Link>
              <Link className={linkClass} href="/#cara-kerja">Cara Kerja</Link>
              <Link className={linkClass} href="/#keuntungan">Keuntungan</Link>
              <Link className={linkClass} href="/#faq">FAQ</Link>
            </div>
            <div className="grid content-start gap-3">
              <p className="font-bold">Agen</p>
              <Link className={linkClass} href="/daftar">Daftar Sekarang</Link>
              <Link className={linkClass} href="/masuk">Masuk</Link>
              <Link className={linkClass} href="/dashboard">Dashboard</Link>
            </div>
            <div className="grid content-start gap-3">
              <p className="font-bold">Legal</p>
              <Link className={linkClass} href="/syarat-ketentuan">Syarat dan Ketentuan</Link>
              <Link className={linkClass} href="/kebijakan-privasi">Kebijakan Privasi</Link>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <Copyright />. Penghasilan agen bergantung pada penjualan dan tidak dijamin.
          </p>
          <p>Peluang untuk Semua</p>
        </div>
      </div>
    </footer>
  );
}
