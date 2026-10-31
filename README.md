# Kerjalin

Platform penjualan layanan **SaaS lewat jaringan agen (MLM)**. Super Admin berada di puncak, agen punya level,
bisa merekrut agen lain, dan mendapat komisi serta bonus tim dari setiap langganan yang lunas.

> Layanan SaaS yang dijual (mis. Laundry SaaS) dikembangkan di proyek terpisah. Repo ini adalah **situs
> utama + panel admin + dashboard agen**.

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19 |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, Recharts, Motion, Sonner |
| Database | Neon (PostgreSQL) + Drizzle ORM (`neon-serverless`, mendukung transaksi) |
| Auth | Better Auth: email & password + Google OAuth |
| Gambar | Cloudinary (upload bertanda tangan dari panel admin) |
| Validasi | Zod |

## Memulai

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya (lihat tabel di bawah)
npm run db:migrate             # membuat tabel di Neon
npm run db:seed                # level agen, Super Admin, contoh produk
npm run dev                    # http://localhost:3000
```

Login Super Admin memakai `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dari `.env.local`. **Ganti password
setelah login pertama** dan jangan pakai nilai seed di produksi.

Ingin melihat panel terisi? `npm run db:seed:demo` membuat 8 agen contoh (3 level) dan 14 pesanan
(login: `budi@demo.kerjalin.test` / `DemoKerjalin123`). Hapus dengan `npm run db:seed:demo:clean`.

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string Neon (pakai host `-pooler`, `sslmode=require`) |
| `BETTER_AUTH_SECRET` | ya | Acak & rahasia. Buat: `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | ya | URL situs, mis. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | opsional | Tombol "Masuk dengan Google" muncul bila keduanya terisi |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | opsional | Upload gambar produk & bukti transfer |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL` | opsional | Kontak di footer & halaman produk |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | untuk seed | Akun Super Admin awal |

### Login dengan Google

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID** → *Web application*.
2. **Authorized JavaScript origins**: `http://localhost:3000` (dan domain produksi).
3. **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` (dan `https://DOMAIN-ANDA/api/auth/callback/google`).
4. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`, restart server.

Pengguna baru dari Google diarahkan ke `/daftar/lengkapi` untuk mengisi nomor WhatsApp dan kode referral. Bila email
Google sama dengan akun yang sudah ada, akun otomatis tertaut.

### Cloudinary

Isi tiga variabel Cloudinary dari **Dashboard → Settings → API Keys**. Tombol unggah di form produk dan di dialog
pembayaran penarikan memakai endpoint `POST /api/upload/sign` (hanya Super Admin) untuk menandatangani upload,
sehingga API secret tidak pernah sampai ke browser. Tanpa Cloudinary, kamu tetap bisa memakai gambar lokal
(`/images/...` di folder `public`).

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` / `build` / `start` | Menjalankan Next.js |
| `npm run typecheck`, `npm run lint` | Pemeriksaan kode |
| `npm run db:generate` | Membuat migrasi dari perubahan `db/schema.ts` |
| `npm run db:migrate` | Menerapkan migrasi ke database |
| `npm run db:push` | Sinkron skema langsung (untuk prototipe) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed dasar (aman diulang). `-- --reset-admin-password` untuk reset password admin |
| `npm run db:seed:demo` / `db:seed:demo:clean` | Tambah / hapus data demo |

## Cara kerja jaringan agen

**Pohon.** Setiap agen punya `parentId` (sponsor), `path` (materialized path) dan `depth`. `parentId = null`
berarti langsung di bawah Super Admin. Memindahkan agen ikut memindahkan seluruh downline-nya dalam satu transaksi.

**Level** (menu *Level & Komisi*). Tiap level mengatur:

- **Komisi penjualan (%)**: bagian agen dari penjualannya sendiri.
- **Bonus tim (%)**: untuk upline dari penjualan downline, per tingkat (`10, 5` = 10% tingkat 1, 5% tingkat 2).
- **Maks. downline langsung**: kosong = tanpa batas, `0` = tidak boleh merekrut.
- **Level rekrutan**: level otomatis untuk agen yang direkrut level ini.
- **Level awal**: level untuk pendaftar tanpa sponsor.

Per agen, admin bisa menimpa **batas slot** dan **persen komisi** (menu *Agen → Atur*), serta memindahkan agen.

**Contoh seed** (layanan Rp 100.000): Agen Utama 50%; Reseller 40% + Utama dapat 10%; Sub-Agen 35% + Reseller 10% +
Utama 5%. Admin selalu mendapat Rp 50.000. Halaman *Level & Komisi* menampilkan simulasi ini dan menandai bila total
melebihi 100%.

**Uang.**

1. Pesanan dicatat (*Pesanan → Catat penjualan*) dan ditandai **lunas**.
2. Komisi & bonus tim masuk ke buku besar dompet agen (`wallet_entries`). Idempoten: satu entri per agen per pesanan.
3. **Refund** membalik semua entri (saldo bisa negatif bila sudah ditarik).
4. Agen mengajukan **penarikan** (min. Rp 50.000, satu permintaan aktif). Saldo langsung ditahan.
5. Admin mentransfer manual, lalu *Bayar* (bukti transfer opsional) atau *Tolak* (saldo dikembalikan).

### Menghubungkan proyek SaaS (nanti)

Seluruh logika uang ada di [`lib/mlm.ts`](lib/mlm.ts). Saat sistem pembayaran otomatis dibuat, cukup panggil
`createOrder({ ..., markPaid: true })` atau `markOrderPaid(orderId)` dari webhook pembayaran (route handler terotentikasi
dengan secret). Aturan komisi, bonus tim, dan idempotensi sudah ditangani di sana.

## Struktur proyek

```
app/
  (marketing)/       Beranda, katalog produk, syarat & privasi
  (auth)/            Masuk, daftar, lengkapi profil
  admin/             Panel Super Admin: ringkasan, pohon, agen, level, produk, pesanan, penarikan
  dashboard/         Dashboard agen: ringkasan, tim, penjualan, komisi, penarikan, katalog, profil
  api/auth, api/upload/sign, r/[code] (tautan referral)
components/          ui/ (shadcn), app/ (shell), admin/, agent/, marketing/, forms/, brand/
db/                  schema.ts (Drizzle), index.ts (koneksi Neon)
lib/                 mlm.ts (logika inti), auth.ts, session.ts (DAL), queries/, config.ts, format.ts
scripts/seed.ts      Seed data
proxy.ts             Pengecekan cookie sesi untuk /admin dan /dashboard
```

### Catatan keamanan & arsitektur

- `proxy.ts` hanya pengecekan cookie yang cepat. Otorisasi sebenarnya ada di tiap halaman dan server action
  lewat `requireAdmin()` / `requireAgent()` ([`lib/session.ts`](lib/session.ts)).
- Peran `role` pada user tidak bisa diisi dari klien. Super Admin hanya dibuat lewat seed.
- Proyek memakai **Cache Components**: halaman berdata dinamis memakai `loading.tsx` per rute sehingga
  navigasi tetap instan. Data publik (produk, level) di-cache dan di-*invalidate* dengan `updateTag` saat admin
  mengubahnya.
- Foto stok di `public/images` berasal dari Unsplash (lisensi bebas pakai) dan sudah dioptimalkan.

## Pemecahan masalah

- **`npm install` gagal `ECONNRESET`**: registry npm bawaan komputer ini (`registry.npmmirror.com`) kadang putus.
  Coba `npm_config_registry=https://registry.npmjs.org npm install`.
- **Port 3000 terpakai**: Next memakai 3001. Mode development sudah mengizinkan `localhost:3000–3002` untuk login.
  Untuk Google OAuth, daftarkan URL yang benar-benar dipakai.
- **`DATABASE_URL belum diisi`**: pastikan `.env.local` ada di root proyek.
