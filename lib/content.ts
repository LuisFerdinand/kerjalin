export const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#keuntungan", label: "Keuntungan" },
  { href: "/#faq", label: "FAQ" },
];

/** Tiga langkah dari daftar sampai komisi masuk. */
export const steps = [
  {
    title: "Daftar Gratis",
    text: "Buat akun dalam hitungan menit. Admin menyetujui akunmu, lalu dashboard agen langsung terbuka.",
  },
  {
    title: "Pilih Produk",
    text: "Pilih produk yang cocok dengan teman dan pelangganmu, lalu salin link referral milikmu.",
  },
  {
    title: "Mulai Bagikan",
    text: "Promosikan lewat WhatsApp, media sosial, atau jaringan pribadi. Komisi dihitung otomatis dan masuk ke saldo.",
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Apa itu Kerjalin?",
    a: "Kerjalin menjual aplikasi berlangganan (SaaS) dan layanan digital untuk UMKM, seperti aplikasi laundry, kasir, dan toko online, lewat jaringan agen. Agen menawarkan produk ke pelanggan dan mendapat komisi dari setiap langganan.",
  },
  {
    q: "Apakah saya perlu membayar untuk mendaftar?",
    a: "Tidak. Pendaftaran agen gratis. Penghasilan berasal dari penjualan produk kepada pelanggan, bukan dari biaya pendaftaran atau perekrutan.",
  },
  {
    q: "Berapa komisi yang saya dapat?",
    a: "Komisi ditentukan level agen. Untuk produk Rp 100.000 per bulan, agen level tertinggi mendapat Rp 50.000 per langganan. Besaran tiap level ada di bagian Keuntungan dan di dashboard agen.",
  },
  {
    q: "Apa itu level dan bonus tim?",
    a: "Level menentukan persentase komisi, jumlah agen yang bisa kamu rekrut, dan level rekrutanmu. Saat agen di timmu berhasil menjual, kamu mendapat bonus tim tanpa mengurangi komisi mereka.",
  },
  {
    q: "Bagaimana cara mencairkan komisi?",
    a: "Komisi masuk ke saldo di dashboard. Ajukan penarikan ke rekening bank atau e-wallet, lalu tim Kerjalin mentransfer secara manual dan mengunggah bukti transfer. Minimal penarikan Rp 50.000.",
  },
  {
    q: "Kapan produknya tersedia?",
    a: "Produk pertama, Laundry SaaS, sedang dalam tahap akhir pengembangan dan produk lain menyusul. Daftar sekarang agar siap berjualan begitu dibuka dan jadi yang pertama membangun tim.",
  },
  {
    q: "Apakah penghasilan dijamin?",
    a: "Tidak ada jaminan penghasilan. Hasil bergantung pada usaha menawarkan produk dan jumlah pelanggan yang berlangganan. Simulasi di situs ini hanya gambaran untuk memahami skema komisi.",
  },
];

/** Cadangan bila database belum bisa dibaca. */
export const fallbackProducts = [
  {
    slug: "laundry-saas",
    name: "Laundry SaaS",
    tagline: "Kelola laundry dari order sampai nota, semua dalam satu aplikasi.",
    categoryName: "Laundry",
    priceMonthly: 100_000,
    imageUrl: "/images/laundry-machines.jpg",
    status: "coming_soon" as const,
  },
  {
    slug: "kasir-umkm",
    name: "Kasir UMKM",
    tagline: "Mesin kasir digital untuk warung, kafe, dan toko kelontong.",
    categoryName: "Kasir & Toko",
    priceMonthly: 75_000,
    imageUrl: "/images/umkm-kasir.jpg",
    status: "coming_soon" as const,
  },
  {
    slug: "toko-online-umkm",
    name: "Toko Online UMKM",
    tagline: "Etalase online sendiri tanpa ribet, siap dibagikan ke WhatsApp.",
    categoryName: "Kasir & Toko",
    priceMonthly: 60_000,
    imageUrl: "/images/umkm-toko.jpg",
    status: "coming_soon" as const,
  },
];
