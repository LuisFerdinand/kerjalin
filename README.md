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

Ingin dashboard **akunmu sendiri** terisi? Daftar dulu lewat situs, lalu jalankan `npm run db:seed:me` (opsi
`-- --email=kamu@email.com`, bawaannya `luissambas@gmail.com`). Skrip ini menambah 8 agen tim, 42 pesanan enam bulan
terakhir lengkap dengan komisi dan bonus tim, tiga penarikan, serta katalog contoh (6 kategori, 8 produk). Hapus dengan
`npm run db:seed:me:clean`. Bila server dev sudah berjalan, restart agar cache katalog ikut segar.

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string Neon (pakai host `-pooler`, `sslmode=require`) |
| `BETTER_AUTH_SECRET` | ya | Acak & rahasia. Buat: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ya | URL situs, mis. `http://localhost:3000`. Di Vercel isi domain produksi (`https://kerjalin.id`) |
| `BETTER_AUTH_URL` | tidak | Bila diisi, samakan dengan `NEXT_PUBLIC_APP_URL`. Di Vercel tidak perlu |
| `AUTH_TRUSTED_ORIGINS` | tidak | Alamat tambahan yang boleh memanggil API login, dipisah koma |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | opsional | Tombol "Masuk dengan Google" muncul bila keduanya terisi |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | opsional | Upload gambar produk & bukti transfer |
| `PAYMENT_ENCRYPTION_KEY` | disarankan | Kunci enkripsi kredensial payment gateway di database. Kosong = memakai `BETTER_AUTH_SECRET`. Lihat [Pembayaran](#pembayaran) |
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
| `npm run deploy:check` | Periksa variabel, database, dan kesiapan sebelum deploy. `-- --env=berkas` memakai berkas lain |
| `npm run db:seed:me` / `db:seed:me:clean` | Isi / bersihkan dashboard satu akun agen dengan data contoh |

## Deploy ke Vercel

Alur singkat: **database produksi → migrasi dan seed → variabel di Vercel → deploy → cek**. Konfigurasi proyek
sudah disiapkan: `vercel.json` memilih region Singapura (`sin1`, dekat database Neon `ap-southeast-1`), `package.json`
meminta Node 22 atau lebih baru, dan situs mengirim header keamanan standar.

### 1. Database produksi

Buat database Neon **terpisah** untuk produksi (project baru, atau branch dari project yang sama), region
*Singapore*, lalu ambil connection string yang **pooled** (host berisi `-pooler`) dengan `sslmode=require`.

> Jangan memakai database pengembangan untuk produksi bila pernah menjalankan `db:seed:demo` atau `db:seed:me`.
> Akun `@demo.kerjalin.test` berpassword umum (`DemoKerjalin123`), sehingga siapa pun bisa masuk memakainya.
> Skrip seed data contoh sengaja menolak berjalan bila `NEXT_PUBLIC_APP_URL` bukan localhost.

### 2. Migrasi dan akun admin pertama

Jalankan dari komputermu. Nilai di shell menang atas `.env.local`, jadi database dev tidak tersentuh.
Contoh PowerShell:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASS@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
npm run db:migrate

$env:SEED_ADMIN_NAME = "Nama Kamu"
$env:SEED_ADMIN_EMAIL = "kamu@email.com"
$env:SEED_ADMIN_PASSWORD = "password-kuat-minimal-12-karakter"
npm run db:seed -- --no-catalog     # level agen + Super Admin, tanpa produk contoh
```

Contoh bash: `DATABASE_URL="..." npm run db:migrate`. Hilangkan `--no-catalog` bila ingin memulai dari
katalog contoh. Produk sungguhan ditambahkan lewat **Admin → Produk**.

### 3. Proyek di Vercel

Import repositori, biarkan *Framework Preset* **Next.js**, lalu isi **Settings → Environment Variables**
(scope *Production*, dan *Preview* bila preview deployment ingin dipakai login):

| Variabel | Wajib | Nilai |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string pooled dari langkah 1 |
| `BETTER_AUTH_SECRET` | ya | Acak, minimal 32 karakter: `openssl rand -base64 32`. **Jangan diganti-ganti**: mengubahnya mengeluarkan semua orang dari sesi |
| `NEXT_PUBLIC_APP_URL` | disarankan | `https://domain-kamu`. Bila kosong, Vercel memakai domain produksi proyek |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | disarankan | Mis. `6281234567890`; mengaktifkan tombol WhatsApp di halaman produk dan pesanan |
| `NEXT_PUBLIC_CONTACT_EMAIL` | opsional | Email kontak di footer |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | opsional | Unggah gambar produk dan bukti transfer |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | opsional | Tombol "Masuk dengan Google" |
| `AUTH_TRUSTED_ORIGINS` | opsional | Domain tambahan, dipisah koma, bila situs bisa dibuka lewat lebih dari satu alamat |

Tidak perlu diisi di Vercel: `BETTER_AUTH_URL` dan `SEED_ADMIN_*`. Variabel `NEXT_PUBLIC_*` ikut tertanam saat
build, jadi **deploy ulang** setelah mengubahnya.

Alamat yang dikenali untuk login dibaca otomatis dari Vercel: domain produksi, alamat deployment, alamat branch,
dan varian `www`. Preview deployment memakai alamatnya sendiri, jadi login di preview tidak melompat ke domain produksi.

### 4. Periksa sebelum dan sesudah deploy

```bash
vercel env pull .env.production.local --environment=production
npm run deploy:check -- --env=.env.production.local
```

`deploy:check` memeriksa variabel, koneksi database, tabel, migrasi, Super Admin, level agen, dan sisa akun demo
tanpa mencetak rahasia. Setelah deploy, buka `https://domain-kamu/api/health`: hasil `{"ok":true,"database":"ok"}`
berarti fungsi Vercel bisa menjangkau database. Lalu masuk di `/masuk` dengan akun admin dari langkah 2.

### 5. Domain sendiri

Tambahkan domain di **Settings → Domains**, ubah `NEXT_PUBLIC_APP_URL` ke domain itu, lalu deploy ulang. Bila memakai
Google, tambahkan `https://DOMAIN/api/auth/callback/google` di Authorized redirect URIs (Google tidak menerima domain
wildcard, jadi login Google tidak berlaku di preview deployment; login email dan password tetap bisa).

### Bila login bermasalah

| Gejala | Penyebab dan perbaikan |
| --- | --- |
| Pesan "Invalid origin" (403) di log, atau tombol Masuk tidak bereaksi | Alamat yang dipakai membuka situs belum dikenali. Isi `NEXT_PUBLIC_APP_URL` dengan alamat itu, atau tambahkan ke `AUTH_TRUSTED_ORIGINS`, lalu deploy ulang |
| Berhasil masuk lalu kembali ke `/masuk` | `BETTER_AUTH_SECRET` berbeda antara build dan runtime, atau tidak terisi di scope yang dipakai (Production vs Preview) |
| Error 500 setelah masuk | Database belum dimigrasi. Jalankan `npm run db:migrate` ke database produksi dan cek `/api/health` |
| "Terlalu banyak percobaan" (429) | Pembatas bawaan: sekitar 3 percobaan masuk per 10 detik per alamat IP. Tunggu sebentar |
| Lupa password admin | `npm run db:seed -- --reset-admin-password --no-catalog` dengan `DATABASE_URL`, `SEED_ADMIN_EMAIL`, dan `SEED_ADMIN_PASSWORD` di shell |
| Preview deployment meminta login Vercel | Itu *Deployment Protection* milik Vercel, bukan aplikasi. Atur di Settings → Deployment Protection |

Belum ada fitur "lupa password" lewat email; pengaturan ulang dilakukan admin lewat skrip di atas.

## Checkout pelanggan

Halaman produk punya tombol **Pesan Sekarang** (produk "segera hadir" memakai **Pesan Lebih Awal**) menuju
`/checkout/<slug>?paket=<bulan>`. Pelanggan mengisi nama dan WhatsApp, lalu mendapat kode pesanan di `/pesanan/<kode>`.
Pesanan berstatus **menunggu** sampai pembayaran dikonfirmasi (otomatis oleh payment gateway, atau oleh admin di *Pesanan*),
dan saat itu komisi dibagikan lewat `payOrder`. Harga dihitung ulang di server dari paket produk, bukan dari browser.
Bila ada metode bayar yang aktif, pelanggan memilihnya di checkout (lihat [Pembayaran](#pembayaran)); bila tidak ada,
alurnya seperti semula: tim menghubungi lewat WhatsApp dan admin menandai lunas.

Atribusi agen: kode yang diisi pembeli, lalu cookie `kj_ref`, lalu agen yang sedang masuk. Agen membagikan **link jual**
per produk dari *Katalog produk*, yaitu `/r/<kode-referral>?to=/produk/<slug>` (tujuan `to` hanya boleh `/produk`,
`/checkout`, atau `/daftar`). Perlindungan spam: kolom jebakan bot dan batas 3 pesanan menunggu per nomor per jam.

## Pembayaran

Super Admin mengatur metode bayar di **Admin → Pembayaran** (`/admin/pembayaran`), tanpa mengubah kode atau environment:

| Metode | Cara kerja |
| --- | --- |
| **Midtrans** (Snap) | Pelanggan diarahkan ke halaman bayar Midtrans. Pesanan lunas otomatis lewat webhook. Isi **Server Key**, pilih Sandbox/Produksi |
| **Xendit** (Invoice) | Sama, lewat invoice Xendit. Isi **Secret API Key** dan (disarankan) **Callback verification token** |
| **QRIS manual** | Admin mengunggah gambar QRIS miliknya. Pelanggan memindainya di halaman pesanan, mengirim konfirmasi dan bukti bayar (opsional), lalu admin memeriksa mutasi dan menekan **Lunas** di *Pesanan* → tab *Perlu verifikasi* |

Beberapa hal yang perlu diketahui:

- **Kredensial** disimpan terenkripsi (AES-256-GCM) di tabel `payment_methods` dan tidak pernah dikirim ke browser; formulir hanya
  menampilkan 4 karakter terakhir. Kunci enkripsinya `PAYMENT_ENCRYPTION_KEY` (atau `BETTER_AUTH_SECRET`). Mengganti kunci itu
  membuat kredensial lama tidak terbaca, jadi masukkan ulang di panel.
- **Webhook**: daftarkan alamat yang tertera di kartu tiap gateway (`/api/payments/midtrans`, `/api/payments/xendit`) di dashboard
  gateway. Midtrans diverifikasi dengan tanda tangan SHA-512; Xendit dengan token callback dan konfirmasi ulang status ke API Xendit.
  Nominal selalu dicocokkan dengan pesanan sebelum ditandai lunas, dan prosesnya idempoten.
- **Tanpa webhook** (mis. di localhost): tombol *Cek status pembayaran* di halaman pesanan menanyakan status ke gateway dan melunasi
  pesanan bila sudah dibayar. Halaman juga memeriksanya otomatis saat pelanggan kembali dari halaman bayar.
- **Uji coba**: pakai Midtrans Sandbox atau kunci `xnd_development_…`. Tombol *Uji koneksi* memeriksa kunci tanpa membuat transaksi.
- **QRIS** statis tidak memuat nominal, jadi halaman pesanan menampilkan total dengan tombol salin. Gambar QRIS dan bukti bayar
  disimpan di database (`payment_files`), jadi tidak butuh Cloudinary; bukti dikecilkan di browser dan hanya bisa dibuka admin.
- Uang yang masuk tetap melewati satu pintu: `markOrderPaid` di `lib/mlm.ts`. Kode pembayaran ada di `lib/payments/`.

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
