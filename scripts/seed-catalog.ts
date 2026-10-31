import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";

type SeedProduct = Omit<typeof products.$inferInsert, "categoryId"> & { categorySlug: string };

const SEED_CATEGORIES = [
  { slug: "laundry", name: "Laundry", description: "Aplikasi untuk usaha laundry kiloan dan satuan.", sortOrder: 1 },
  { slug: "kasir-toko", name: "Kasir & Toko", description: "Kasir digital dan toko online untuk UMKM.", sortOrder: 2 },
  { slug: "kuliner", name: "Kuliner", description: "Menu digital dan pemesanan untuk warung, kafe, dan resto.", sortOrder: 3 },
  { slug: "jasa-booking", name: "Jasa & Booking", description: "Jadwal dan reservasi online untuk salon, barbershop, dan jasa lainnya.", sortOrder: 4 },
  { slug: "bisnis-keuangan", name: "Bisnis & Keuangan", description: "Pembukuan dan tagihan sederhana untuk pemilik usaha.", sortOrder: 5 },
  { slug: "digital-kreatif", name: "Digital & Kreatif", description: "Halaman profil usaha dan alat promosi online.", sortOrder: 6 },
];

/** Foto bawaan lama yang sudah diganti, untuk memperbarui produk yang dibuat dari seed sebelumnya. */
const LEGACY_IMAGES: Record<string, string> = {
  "/images/pos-checkout.jpg": "/images/umkm-warung.jpg",
  "/images/open-shop.jpg": "/images/umkm-toko.jpg",
};

/** Contoh isi katalog. Ganti dengan data produk yang sebenarnya lewat panel admin. */
const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "laundry-saas",
    sku: "KJ-LDY-001",
    categorySlug: "laundry",
    name: "Laundry SaaS",
    tagline: "Kelola laundry dari order sampai nota, semua dalam satu aplikasi.",
    description:
      "Aplikasi manajemen laundry untuk outlet kiloan maupun satuan. Catat order dalam hitungan detik, cetak nota dan struk, pantau status cucian dari masuk sampai diambil, dan kirim pengingat ke pelanggan lewat WhatsApp.\n\nPemilik usaha bisa melihat omzet harian, cucian yang belum selesai, dan pelanggan yang paling sering datang tanpa membuka buku catatan. Satu langganan bisa dipakai untuk beberapa outlet dan karyawan.",
    priceMonthly: 100_000,
    pricingPlans: [
      { months: 1, price: 100_000, label: "Bulanan" },
      { months: 3, price: 285_000, label: "3 bulan" },
      { months: 6, price: 540_000, label: "6 bulan" },
      { months: 12, price: 1_000_000, label: "Tahunan" },
    ],
    imageUrl: "/images/laundry-machines.jpg",
    gallery: ["/images/laundry-shop.jpg", "/images/laundry-folding.jpg", "/images/laundry-home.jpg"],
    features: [
      "Order kiloan dan satuan",
      "Nota dan struk otomatis",
      "Status cucian real-time",
      "Pengingat WhatsApp ke pelanggan",
      "Laporan harian dan bulanan",
      "Banyak outlet dan karyawan",
    ],
    specs: [
      { label: "Platform", value: "Web dan Android" },
      { label: "Outlet", value: "Hingga 3 outlet per langganan" },
      { label: "Pengguna", value: "Pemilik dan kasir" },
      { label: "Laporan", value: "Harian, mingguan, bulanan" },
      { label: "Dukungan", value: "WhatsApp, hari kerja" },
    ],
    faqs: [
      {
        q: "Apakah bisa dipakai untuk laundry satuan?",
        a: "Bisa. Kamu dapat mengatur tarif per kilo maupun per potong, lengkap dengan layanan tambahan seperti setrika saja.",
      },
      {
        q: "Berapa outlet yang boleh didaftarkan?",
        a: "Satu langganan mendukung hingga tiga outlet. Outlet tambahan bisa ditambahkan dengan langganan lain.",
      },
      {
        q: "Bagaimana pelanggan tahu cuciannya selesai?",
        a: "Aplikasi dapat mengirim pesan WhatsApp otomatis saat status cucian berubah menjadi selesai.",
      },
    ],
    badge: "Produk pertama",
    featured: true,
    releaseNote: "Segera dibuka untuk agen",
    status: "coming_soon",
    sortOrder: 1,
  },
  {
    slug: "kasir-umkm",
    sku: "KJ-POS-001",
    categorySlug: "kasir-toko",
    name: "Kasir UMKM",
    tagline: "Mesin kasir digital untuk warung, kafe, dan toko kelontong.",
    description:
      "Aplikasi kasir (POS) sederhana untuk pelaku UMKM. Catat penjualan tunai dan QRIS, kelola stok barang, dan lihat laporan penjualan kapan saja dari ponsel.\n\nStruk digital dikirim ke pelanggan, sehingga kamu tidak perlu printer di awal usaha.",
    priceMonthly: 75_000,
    pricingPlans: [
      { months: 1, price: 75_000, label: "Bulanan" },
      { months: 3, price: 213_750, label: "3 bulan" },
      { months: 12, price: 765_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-warung.jpg",
    gallery: ["/images/umkm-kasir.jpg"],
    features: ["Katalog dan stok produk", "Transaksi tunai dan QRIS", "Laporan penjualan", "Struk digital"],
    specs: [
      { label: "Platform", value: "Web dan Android" },
      { label: "Produk", value: "Hingga 1.000 item" },
      { label: "Pembayaran", value: "Tunai dan QRIS" },
    ],
    faqs: [
      {
        q: "Apakah perlu printer struk?",
        a: "Tidak wajib. Struk bisa dikirim digital lewat WhatsApp, dan printer bisa ditambahkan kemudian.",
      },
    ],
    featured: true,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 2,
  },
  {
    slug: "toko-online-umkm",
    sku: "KJ-SHP-001",
    categorySlug: "kasir-toko",
    name: "Toko Online UMKM",
    tagline: "Etalase online sendiri tanpa ribet, siap dibagikan ke WhatsApp.",
    description:
      "Buat toko online dengan katalog, keranjang, dan checkout lewat WhatsApp. Cocok untuk pelaku UMKM yang ingin berjualan lebih luas tanpa membangun situs dari nol.",
    priceMonthly: 60_000,
    pricingPlans: [
      { months: 1, price: 60_000, label: "Bulanan" },
      { months: 12, price: 612_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-toko.jpg",
    gallery: ["/images/umkm-buka.jpg"],
    features: ["Katalog produk", "Checkout via WhatsApp", "Domain sendiri", "Statistik pengunjung"],
    specs: [
      { label: "Platform", value: "Web" },
      { label: "Domain", value: "Subdomain gratis, domain sendiri opsional" },
    ],
    faqs: [],
    featured: false,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 3,
  },
  {
    slug: "menu-digital-kafe",
    sku: "KJ-FNB-001",
    categorySlug: "kuliner",
    name: "Menu Digital Resto & Kafe",
    tagline: "Menu QR yang bisa diubah kapan saja, pesanan masuk lewat WhatsApp.",
    description:
      "Ganti buku menu cetak dengan menu digital. Pelanggan memindai kode QR di meja, melihat foto dan harga terbaru, lalu memesan lewat WhatsApp.\n\nPemilik bisa mengubah harga dan menandai menu habis tanpa mencetak ulang, serta melihat menu yang paling sering dipesan.",
    priceMonthly: 50_000,
    pricingPlans: [
      { months: 1, price: 50_000, label: "Bulanan" },
      { months: 3, price: 142_500, label: "3 bulan" },
      { months: 12, price: 510_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-kafe.jpg",
    gallery: ["/images/umkm-warung.jpg"],
    features: ["Menu QR per meja", "Ubah harga dan stok kapan saja", "Pesanan lewat WhatsApp", "Laporan menu terlaris"],
    specs: [
      { label: "Platform", value: "Web, tanpa instal" },
      { label: "Menu", value: "Hingga 200 item" },
      { label: "Pesanan", value: "WhatsApp" },
    ],
    faqs: [{ q: "Apakah pelanggan perlu mengunduh aplikasi?", a: "Tidak. Menu terbuka langsung dari kamera ponsel setelah memindai kode QR." }],
    badge: "Baru",
    featured: true,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 4,
  },
  {
    slug: "booking-jasa",
    sku: "KJ-BKG-001",
    categorySlug: "jasa-booking",
    name: "Booking & Jadwal Jasa",
    tagline: "Reservasi online untuk salon, barbershop, penjahit, dan jasa lain.",
    description:
      "Pelanggan memilih layanan dan jam yang kosong lewat satu tautan, tanpa bolak-balik chat. Pemilik usaha melihat jadwal harian di satu layar dan pengingat terkirim otomatis.\n\nCocok untuk usaha dengan satu atau beberapa petugas.",
    priceMonthly: 85_000,
    pricingPlans: [
      { months: 1, price: 85_000, label: "Bulanan" },
      { months: 3, price: 242_250, label: "3 bulan" },
      { months: 12, price: 867_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-penjahit.jpg",
    gallery: ["/images/umkm-buka.jpg"],
    features: ["Halaman booking sendiri", "Jadwal per petugas", "Pengingat otomatis", "Daftar pelanggan tetap"],
    specs: [
      { label: "Platform", value: "Web dan Android" },
      { label: "Petugas", value: "Hingga 5 orang" },
    ],
    faqs: [],
    featured: false,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 5,
  },
  {
    slug: "pembukuan-umkm",
    sku: "KJ-ACC-001",
    categorySlug: "bisnis-keuangan",
    name: "Pembukuan UMKM",
    tagline: "Catat pemasukan dan pengeluaran, lihat untung rugi tiap bulan.",
    description:
      "Pembukuan yang mudah dipahami pemilik usaha tanpa latar belakang akuntansi. Catat transaksi harian, pisahkan uang usaha dari uang pribadi, dan lihat laporan laba rugi dalam satu halaman.",
    priceMonthly: 45_000,
    pricingPlans: [
      { months: 1, price: 45_000, label: "Bulanan" },
      { months: 12, price: 459_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-kasir.jpg",
    gallery: ["/images/tim-kantor.jpg"],
    features: ["Catat pemasukan dan pengeluaran", "Laporan laba rugi", "Ekspor ke Excel", "Banyak kategori transaksi"],
    specs: [
      { label: "Platform", value: "Web dan Android" },
      { label: "Laporan", value: "Bulanan dan tahunan" },
    ],
    faqs: [],
    featured: false,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 6,
  },
  {
    slug: "invoice-tagihan",
    sku: "KJ-INV-001",
    categorySlug: "bisnis-keuangan",
    name: "Invoice & Tagihan Pelanggan",
    tagline: "Buat invoice rapi dan kirim pengingat tagihan lewat WhatsApp.",
    description:
      "Buat invoice dalam hitungan detik, kirim tautannya ke pelanggan, dan pantau mana yang sudah lunas. Pengingat tagihan terkirim otomatis sebelum jatuh tempo.",
    priceMonthly: 40_000,
    pricingPlans: [
      { months: 1, price: 40_000, label: "Bulanan" },
      { months: 12, price: 408_000, label: "Tahunan" },
    ],
    imageUrl: "/images/tim-kantor.jpg",
    gallery: [],
    features: ["Invoice dengan logo usaha", "Pengingat tagihan WhatsApp", "Status lunas dan belum", "Riwayat per pelanggan"],
    specs: [{ label: "Platform", value: "Web" }],
    faqs: [],
    featured: false,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 7,
  },
  {
    slug: "profil-usaha-online",
    sku: "KJ-BIO-001",
    categorySlug: "digital-kreatif",
    name: "Profil Usaha Online",
    tagline: "Satu halaman berisi katalog, lokasi, dan tombol WhatsApp usahamu.",
    description:
      "Halaman profil usaha yang tampil rapi di ponsel. Taruh tautannya di bio media sosial, kartu nama, atau stiker kemasan agar pelanggan mudah menghubungi.",
    priceMonthly: 30_000,
    pricingPlans: [
      { months: 1, price: 30_000, label: "Bulanan" },
      { months: 12, price: 306_000, label: "Tahunan" },
    ],
    imageUrl: "/images/umkm-buka.jpg",
    gallery: ["/images/umkm-toko.jpg"],
    features: ["Katalog produk dan jasa", "Tombol WhatsApp dan peta", "Tautan pendek sendiri", "Statistik kunjungan"],
    specs: [{ label: "Platform", value: "Web" }],
    faqs: [],
    featured: false,
    releaseNote: "Dalam pengembangan",
    status: "coming_soon",
    sortOrder: 8,
  },
];

/** Aman diulang: membuat yang belum ada dan hanya mengisi kolom katalog yang masih kosong. */
export async function seedCatalog() {
  for (const c of SEED_CATEGORIES) {
    await db.insert(categories).values(c).onConflictDoNothing({ target: categories.slug });
  }
  const cats = await db.select().from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

  let created = 0;
  let filled = 0;
  for (const { categorySlug, ...seed } of SEED_PRODUCTS) {
    const categoryId = catBySlug.get(categorySlug) ?? null;
    const [existing] = await db.select().from(products).where(eq(products.slug, seed.slug)).limit(1);
    if (!existing) {
      await db.insert(products).values({ ...seed, categoryId });
      created++;
      continue;
    }
    // Produk lama: isi hanya yang masih kosong, jangan timpa hasil edit admin.
    const patch: Partial<typeof products.$inferInsert> = {};
    // Foto bawaan lama (Barat) diganti foto baru, hanya bila admin belum menggantinya.
    if (existing.imageUrl && LEGACY_IMAGES[existing.imageUrl] && seed.imageUrl === LEGACY_IMAGES[existing.imageUrl]) {
      patch.imageUrl = seed.imageUrl;
      patch.gallery = seed.gallery;
    }
    if (!existing.sku && seed.sku) patch.sku = seed.sku;
    if (!existing.categoryId) patch.categoryId = categoryId;
    if (existing.pricingPlans.length === 0) patch.pricingPlans = seed.pricingPlans;
    if (existing.gallery.length === 0 && patch.gallery === undefined) patch.gallery = seed.gallery;
    if (existing.specs.length === 0) patch.specs = seed.specs;
    if (existing.faqs.length === 0) patch.faqs = seed.faqs;
    if (existing.features.length === 0) patch.features = seed.features;
    if (!existing.releaseNote && seed.releaseNote) patch.releaseNote = seed.releaseNote;
    if (!existing.badge && seed.badge) patch.badge = seed.badge;
    if (Object.values(patch).some((v) => v !== undefined)) {
      await db.update(products).set(patch).where(eq(products.id, existing.id));
      filled++;
    }
  }
  console.log(`✓ Katalog: ${SEED_CATEGORIES.length} kategori, produk baru ${created}, dilengkapi ${filled}`);
}
