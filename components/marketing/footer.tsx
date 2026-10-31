import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Copyright } from "@/components/brand/copyright";
import { siteConfig, whatsappLink } from "@/lib/config";

export function Footer() {
  const wa = whatsappLink("Halo Kerjalin, saya ingin bertanya tentang program agen.");
  return (
    <footer className="bg-navy text-cream/80">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo tone="light" tagline />
            <p className="mt-5 text-sm leading-relaxed text-cream/70">
              Platform layanan SaaS dengan jaringan agen untuk pelaku UMKM Indonesia. Peluang
              penghasilan untuk semua.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Jelajahi</h3>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li><Link className="hover:text-white" href="/#produk">Produk</Link></li>
              <li><Link className="hover:text-white" href="/#cara-kerja">Cara kerja</Link></li>
              <li><Link className="hover:text-white" href="/#komisi">Skema komisi</Link></li>
              <li><Link className="hover:text-white" href="/#faq">Pertanyaan umum</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Agen</h3>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li><Link className="hover:text-white" href="/daftar">Daftar jadi agen</Link></li>
              <li><Link className="hover:text-white" href="/masuk">Masuk</Link></li>
              <li><Link className="hover:text-white" href="/produk">Katalog layanan</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Kontak</h3>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {wa && (
                <li>
                  <a className="inline-flex items-center gap-2 hover:text-white" href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </li>
              )}
              {siteConfig.email && (
                <li>
                  <a className="inline-flex items-center gap-2 hover:text-white" href={`mailto:${siteConfig.email}`}>
                    <Mail className="size-4" /> {siteConfig.email}
                  </a>
                </li>
              )}
              {!wa && !siteConfig.email && <li className="text-cream/60">Segera hadir</li>}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <Copyright />. Seluruh hak cipta dilindungi.
            </span>
            <Link className="hover:text-white" href="/syarat-ketentuan">Syarat & Ketentuan</Link>
            <Link className="hover:text-white" href="/kebijakan-privasi">Kebijakan Privasi</Link>
          </p>
          <p className="max-w-xl sm:text-right">
            Penghasilan agen bergantung pada penjualan layanan dan tidak dijamin. Pendaftaran agen
            gratis, tanpa biaya perekrutan.
          </p>
        </div>
      </div>
    </footer>
  );
}
