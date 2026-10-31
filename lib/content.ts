import {
  BadgeCheck,
  Banknote,
  Boxes,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Network,
  ShoppingBag,
  Store,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const navLinks = [
  { href: "#produk", label: "Produk" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#komisi", label: "Komisi" },
  { href: "#simulasi", label: "Simulasi" },
  { href: "#faq", label: "FAQ" },
];

export const benefits: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BadgeCheck, title: "Tanpa modal besar", text: "Daftar gratis, langsung bisa mulai jual" },
  { icon: Banknote, title: "Komisi menarik", text: "Dapat komisi dari setiap langganan aktif" },
  { icon: Network, title: "Bangun tim", text: "Rekrut agen & dapat bonus tim" },
  { icon: Wallet, title: "Cairkan ke rekening", text: "Ajukan penarikan kapan pun saldo siap" },
];

export const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: UserPlus,
    title: "Daftar gratis",
    text: "Buat akun agen dalam hitungan menit. Cukup email atau akun Google, tanpa biaya pendaftaran.",
  },
  {
    icon: Boxes,
    title: "Pilih layanan",
    text: "Pilih layanan SaaS yang ingin kamu tawarkan ke pelaku usaha di sekitarmu, lengkap dengan harga dan komisinya.",
  },
  {
    icon: HeartHandshake,
    title: "Jual & dapat komisi",
    text: "Setiap pelanggan yang berlangganan lewat kamu menghasilkan komisi. Ajak teman jadi agen untuk dapat bonus tim.",
  },
];

export const audiences: { icon: LucideIcon; title: string; text: string; image: string }[] = [
  {
    icon: GraduationCap,
    title: "Mahasiswa & fresh graduate",
    text: "Cari penghasilan sampingan tanpa mengganggu jadwal kuliah atau kerja.",
    image: "/images/hero-team.jpg",
  },
  {
    icon: HeartHandshake,
    title: "Ibu rumah tangga",
    text: "Berkarya dari rumah dengan waktu yang fleksibel, cukup dari ponsel.",
    image: "/images/laundry-home.jpg",
  },
  {
    icon: Laptop,
    title: "Karyawan & freelancer",
    text: "Tambah sumber pendapatan dengan jaringan dan kenalan yang sudah kamu miliki.",
    image: "/images/laptop-hands.jpg",
  },
  {
    icon: Store,
    title: "Pemilik usaha & komunitas",
    text: "Tawarkan solusi digital ke sesama pelaku UMKM dan anggota komunitasmu.",
    image: "/images/open-shop.jpg",
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Apa itu Kerjalin?",
    a: "Kerjalin adalah platform yang menjual layanan SaaS (aplikasi berlangganan) untuk UMKM, mulai dari aplikasi laundry hingga kasir dan toko online, lewat jaringan agen. Agen menawarkan layanan ke pelanggan dan mendapatkan komisi dari setiap langganan.",
  },
  {
    q: "Apakah saya perlu membayar untuk mendaftar jadi agen?",
    a: "Tidak. Pendaftaran agen gratis. Penghasilan berasal dari penjualan layanan kepada pelanggan, bukan dari biaya pendaftaran atau merekrut orang.",
  },
  {
    q: "Berapa komisi yang saya dapat?",
    a: "Komisi ditentukan oleh level agen kamu. Sebagai contoh, untuk layanan Rp 100.000 per bulan, agen level tertinggi mendapat Rp 50.000 per langganan. Besaran pastinya bisa kamu lihat di bagian Komisi dan di dashboard agen.",
  },
  {
    q: "Apa itu level agen dan bonus tim?",
    a: "Level menentukan persentase komisi, jumlah agen yang bisa kamu rekrut, dan level yang didapat tim kamu. Saat agen di timmu berhasil menjual, kamu mendapat bonus tim sesuai ketentuan level kamu, tanpa mengurangi komisi mereka.",
  },
  {
    q: "Bagaimana cara mencairkan komisi?",
    a: "Komisi masuk ke saldo di dashboard agen. Kamu cukup mengajukan penarikan ke rekening bank, lalu tim Kerjalin memprosesnya secara manual dan mengunggah bukti transfer. Minimal penarikan Rp 50.000.",
  },
  {
    q: "Kapan layanan SaaS-nya tersedia?",
    a: "Layanan pertama kami, Laundry SaaS, sedang dalam tahap akhir pengembangan. Daftar sekarang agar kamu siap jualan begitu layanan dibuka, dan jadi yang pertama membangun tim.",
  },
  {
    q: "Apakah penghasilan dijamin?",
    a: "Tidak ada jaminan penghasilan. Hasil bergantung pada usaha menawarkan layanan dan jumlah pelanggan yang berlangganan. Simulasi di situs ini hanya ilustrasi untuk membantu memahami skema komisi.",
  },
];

export const fallbackProducts = [
  {
    slug: "laundry-saas",
    name: "Laundry SaaS",
    tagline: "Kelola laundry dari order sampai nota, semua dalam satu aplikasi.",
    category: "Laundry",
    priceMonthly: 100_000,
    imageUrl: "/images/laundry-machines.jpg",
    status: "coming_soon" as const,
  },
  {
    slug: "kasir-umkm",
    name: "Kasir UMKM",
    tagline: "Mesin kasir digital untuk warung, kafe, dan toko kelontong.",
    category: "Kasir & Toko",
    priceMonthly: 75_000,
    imageUrl: "/images/pos-checkout.jpg",
    status: "coming_soon" as const,
  },
  {
    slug: "toko-online-umkm",
    name: "Toko Online UMKM",
    tagline: "Etalase online sendiri tanpa ribet, siap dibagikan ke WhatsApp.",
    category: "Kasir & Toko",
    priceMonthly: 60_000,
    imageUrl: "/images/open-shop.jpg",
    status: "coming_soon" as const,
  },
];

export const productCategoryIcon: Record<string, LucideIcon> = {
  Laundry: ShoppingBag,
  "Kasir & Toko": Store,
};
