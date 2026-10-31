import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Bagaimana Kerjalin mengumpulkan dan menggunakan data pribadi kamu.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Kebijakan Privasi" updated="Oktober 2026">
      <section>
        <h2>1. Data yang kami kumpulkan</h2>
        <ul>
          <li>Data akun: nama, email, nomor WhatsApp, kota, dan foto profil bila kamu masuk dengan Google.</li>
          <li>Data pencairan: nama bank atau e-wallet, nomor rekening, dan nama pemilik rekening.</li>
          <li>Data aktivitas: penjualan, komisi, struktur tim, dan riwayat penarikan.</li>
        </ul>
      </section>
      <section>
        <h2>2. Cara kami menggunakan data</h2>
        <ul>
          <li>Mengelola akun agen, menghitung komisi, dan memproses penarikan.</li>
          <li>Menampilkan struktur tim kepada upline dan admin sesuai peran masing-masing.</li>
          <li>Menghubungi kamu terkait program dan layanan Kerjalin.</li>
        </ul>
      </section>
      <section>
        <h2>3. Berbagi data</h2>
        <p>
          Kami tidak menjual data pribadi. Data disimpan pada penyedia infrastruktur yang kami gunakan
          (basis data, penyimpanan gambar, dan layanan masuk dengan Google) hanya untuk menjalankan
          layanan. Upline dapat melihat nama dan level agen di timnya, tetapi tidak data rekening.
        </p>
      </section>
      <section>
        <h2>4. Keamanan</h2>
        <p>
          Password disimpan dalam bentuk hash dan akses ke data dibatasi sesuai peran. Meski demikian,
          tidak ada sistem yang sepenuhnya bebas risiko, jadi jaga kerahasiaan akunmu.
        </p>
      </section>
      <section>
        <h2>5. Hak kamu</h2>
        <p>
          Kamu dapat memperbarui data di halaman Profil, atau meminta penghapusan akun dengan
          menghubungi kami{siteConfig.email ? ` di ${siteConfig.email}` : ""}.
        </p>
      </section>
    </LegalPage>
  );
}
