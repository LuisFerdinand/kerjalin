import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { MIN_WITHDRAWAL } from "@/lib/config";
import { formatIDR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan program agen Kerjalin.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Syarat & Ketentuan Program Agen" updated="Oktober 2026">
      <section>
        <h2>1. Tentang Kerjalin</h2>
        <p>
          Kerjalin adalah platform yang menjual layanan perangkat lunak berlangganan (SaaS) melalui jaringan
          agen. Dengan mendaftar sebagai agen, kamu menyetujui ketentuan di bawah ini.
        </p>
      </section>
      <section>
        <h2>2. Pendaftaran</h2>
        <ul>
          <li>Pendaftaran agen gratis. Kerjalin tidak memungut biaya pendaftaran atau biaya perekrutan.</li>
          <li>Data yang kamu berikan harus benar dan dapat dipertanggungjawabkan.</li>
          <li>Kerjalin dapat menyetujui, menolak, atau menonaktifkan akun agen sesuai kebijakan program.</li>
        </ul>
      </section>
      <section>
        <h2>3. Level, komisi, dan bonus tim</h2>
        <ul>
          <li>Setiap agen memiliki level yang menentukan persentase komisi dan bonus tim.</li>
          <li>Komisi dihitung dari penjualan layanan yang telah lunas, bukan dari pendaftaran agen.</li>
          <li>Kerjalin dapat mengubah level, persentase, dan jumlah slot downline. Perubahan berlaku untuk transaksi berikutnya.</li>
          <li>Komisi dari pesanan yang dibatalkan atau direfund akan dibatalkan.</li>
        </ul>
      </section>
      <section>
        <h2>4. Penarikan komisi</h2>
        <ul>
          <li>Saldo komisi dapat ditarik ke rekening bank atau e-wallet milikmu dengan minimal penarikan {formatIDR(MIN_WITHDRAWAL)}.</li>
          <li>Penarikan diproses secara manual oleh tim Kerjalin. Bukti transfer dapat dilihat di dashboard.</li>
          <li>Kerjalin berhak menolak penarikan bila data rekening tidak valid atau terdapat dugaan pelanggaran.</li>
        </ul>
      </section>
      <section>
        <h2>5. Larangan</h2>
        <ul>
          <li>Memberikan informasi yang menyesatkan tentang layanan atau potensi penghasilan.</li>
          <li>Menjanjikan keuntungan pasti atau meminta pembayaran sebagai syarat bergabung.</li>
          <li>Menggunakan akun orang lain atau membuat akun ganda untuk memperoleh komisi.</li>
        </ul>
      </section>
      <section>
        <h2>6. Tidak ada jaminan penghasilan</h2>
        <p>
          Penghasilan agen bergantung pada penjualan layanan dan usaha masing-masing. Kerjalin tidak
          menjamin jumlah penghasilan tertentu.
        </p>
      </section>
      <section>
        <h2>7. Perubahan ketentuan</h2>
        <p>
          Ketentuan ini dapat diperbarui sewaktu-waktu. Penggunaan akun setelah perubahan berarti kamu
          menyetujui ketentuan terbaru.
        </p>
      </section>
    </LegalPage>
  );
}
