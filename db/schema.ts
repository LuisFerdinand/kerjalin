import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Auth (Better Auth)                                                         */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ["super_admin", "agent"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").$type<UserRole>().default("agent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* -------------------------------------------------------------------------- */
/*  Jaringan agen (MLM)                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Level agen. Super admin mengatur komisi, bonus tim, jumlah slot downline,
 * dan level yang otomatis didapat oleh rekrutan agen di level ini.
 */
export const agentLevels = pgTable("agent_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** 1 = tertinggi. Dipakai untuk pengurutan. */
  rank: integer("rank").notNull().default(1),
  description: text("description"),
  color: text("color").notNull().default("#0B78F0"),
  /** Komisi (%) dari penjualan yang dilakukan agen level ini. */
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  /**
   * Bonus tim (%) untuk agen level ini dari penjualan downline-nya.
   * Indeks 0 = downline langsung, 1 = downline tingkat 2, dst.
   */
  overridePercents: jsonb("override_percents").$type<number[]>().notNull().default([]),
  /** Jumlah maksimal downline langsung. null = tanpa batas. */
  maxDownlines: integer("max_downlines"),
  /** Level yang didapat rekrutan baru di bawah agen level ini. null = tidak bisa merekrut. */
  downlineLevelId: uuid("downline_level_id").references(
    (): AnyPgColumn => agentLevels.id,
    { onDelete: "set null" },
  ),
  /** Level awal untuk agen yang mendaftar langsung di bawah admin. */
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const AGENT_STATUSES = ["pending", "active", "suspended"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Sponsor / upline. null = langsung di bawah Super Admin. */
    parentId: uuid("parent_id").references((): AnyPgColumn => agents.id, {
      onDelete: "restrict",
    }),
    levelId: uuid("level_id")
      .notNull()
      .references(() => agentLevels.id, { onDelete: "restrict" }),
    /** Materialized path: "/<id leluhur>/.../<id sendiri>/". */
    path: text("path").notNull(),
    /** 1 = langsung di bawah admin. */
    depth: integer("depth").notNull().default(1),
    referralCode: text("referral_code").notNull().unique(),
    status: text("status").$type<AgentStatus>().notNull().default("pending"),
    phone: text("phone"),
    city: text("city"),
    bankName: text("bank_name"),
    bankAccountNumber: text("bank_account_number"),
    bankAccountName: text("bank_account_name"),
    /** Menimpa batas slot downline dari level. null = ikut level. */
    maxDownlinesOverride: integer("max_downlines_override"),
    /** Menimpa persen komisi dari level. null = ikut level. */
    commissionPercentOverride: numeric("commission_percent_override", {
      precision: 5,
      scale: 2,
    }),
    adminNotes: text("admin_notes"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("agents_parent_idx").on(t.parentId),
    index("agents_level_idx").on(t.levelId),
    index("agents_status_idx").on(t.status),
    index("agents_path_idx").using("btree", t.path.op("text_pattern_ops")),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Produk & penjualan                                                         */
/* -------------------------------------------------------------------------- */

export const PRODUCT_STATUSES = ["draft", "coming_soon", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type PricingPlan = {
  /** Lama langganan. */
  months: number;
  /** Total yang dibayar pelanggan untuk lama tersebut (Rupiah). */
  price: number;
  /** Nama paket, mis. "Tahunan". Kosong = otomatis dari lama langganan. */
  label?: string;
};
export type ProductSpec = { label: string; value: string };
export type ProductFaq = { q: string; a: string };

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    /** Kode produk internal. */
    sku: text("sku").unique(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Harga normal ke pelanggan per bulan (Rupiah). Dasar paket otomatis. */
    priceMonthly: bigint("price_monthly", { mode: "number" }).notNull().default(0),
    /** Pilihan lama langganan beserta harganya. Kosong = hanya bulanan. */
    pricingPlans: jsonb("pricing_plans").$type<PricingPlan[]>().notNull().default([]),
    /** Gambar utama (sampul). */
    imageUrl: text("image_url"),
    /** Gambar tambahan untuk galeri produk. */
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    specs: jsonb("specs").$type<ProductSpec[]>().notNull().default([]),
    faqs: jsonb("faqs").$type<ProductFaq[]>().notNull().default([]),
    /** Label singkat di daftar produk, mis. "Terlaris". */
    badge: text("badge"),
    featured: boolean("featured").notNull().default(false),
    /** Untuk status "segera hadir", mis. "Kuartal 1 2027". */
    releaseNote: text("release_note"),
    demoUrl: text("demo_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    status: text("status").$type<ProductStatus>().notNull().default("coming_soon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("products_status_idx").on(t.status),
    index("products_category_idx").on(t.categoryId),
  ],
);

export const ORDER_STATUSES = ["pending", "paid", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Metode bayar di checkout: dua payment gateway dan QRIS yang diverifikasi admin secara manual. */
export const PAYMENT_METHOD_KEYS = ["midtrans", "xendit", "qris"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHOD_KEYS)[number];
export type PaymentMode = "sandbox" | "production";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    /** Salinan nama produk saat transaksi. */
    productName: text("product_name").notNull(),
    /** Agen penjual. null = penjualan langsung oleh admin. */
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"),
    customerPhone: text("customer_phone"),
    months: integer("months").notNull().default(1),
    amount: bigint("amount", { mode: "number" }).notNull(),
    /** Bagian untuk admin setelah komisi agen dibagikan. */
    adminAmount: bigint("admin_amount", { mode: "number" }).notNull().default(0),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    note: text("note"),
    /** Metode bayar yang dipilih pelanggan. null = belum memilih (dikonfirmasi lewat WhatsApp / dicatat admin). */
    paymentMethod: text("payment_method").$type<PaymentMethodKey>(),
    /**
     * Referensi transaksi terakhir di sisi gateway (order_id Midtrans / external_id Xendit), berbentuk
     * "<kode pesanan>_<acak>". Berganti bila pelanggan memulai ulang pembayaran.
     */
    paymentRef: text("payment_ref"),
    /** Tautan halaman bayar gateway untuk transaksi terakhir. */
    paymentUrl: text("payment_url"),
    paymentExpiresAt: timestamp("payment_expires_at"),
    /** QRIS manual: pelanggan menyatakan sudah membayar dan menunggu verifikasi admin. */
    paymentSubmittedAt: timestamp("payment_submitted_at"),
    /** Catatan pelanggan saat konfirmasi QRIS, mis. nama pemilik rekening / e-wallet pengirim. */
    paymentNote: text("payment_note"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("orders_agent_idx").on(t.agentId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    uniqueIndex("orders_payment_ref_uq").on(t.paymentRef),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Pembayaran                                                                 */
/* -------------------------------------------------------------------------- */

/** Satu baris per metode bayar. Diatur Super Admin di /admin/pembayaran. */
export const paymentMethods = pgTable("payment_methods", {
  key: text("key").$type<PaymentMethodKey>().primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  /** Lingkungan uji atau produksi. Dipakai gateway yang memisahkan keduanya (Midtrans). */
  mode: text("mode").$type<PaymentMode>().notNull().default("sandbox"),
  /** Kredensial gateway sebagai JSON terenkripsi (AES-256-GCM). Tidak pernah dikirim ke browser. */
  credentials: text("credentials"),
  /** Pengaturan yang tidak rahasia, mis. nama merchant dan petunjuk untuk QRIS. */
  settings: jsonb("settings").$type<Record<string, string>>().notNull().default({}),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const PAYMENT_FILE_KINDS = ["qris", "proof"] as const;
export type PaymentFileKind = (typeof PAYMENT_FILE_KINDS)[number];

/**
 * Gambar yang disimpan di database agar alur QRIS tidak bergantung pada layanan lain:
 * gambar QRIS milik admin (`qris`, satu baris terbaru yang dipakai) dan bukti bayar pelanggan (`proof`).
 * Isi disimpan sebagai base64 dan dilayani lewat route handler, bukan lewat kolom pesanan,
 * supaya daftar pesanan tidak ikut menarik gambar.
 */
export const paymentFiles = pgTable(
  "payment_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").$type<PaymentFileKind>().notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    /** Isi berkas dalam base64, tanpa awalan "data:". */
    data: text("data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("payment_files_order_idx").on(t.orderId), index("payment_files_kind_idx").on(t.kind, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/*  Dompet agen: komisi & penarikan                                            */
/* -------------------------------------------------------------------------- */

export const WALLET_ENTRY_TYPES = [
  "commission",
  "override",
  "reversal",
  "adjustment",
  "withdrawal",
  "withdrawal_refund",
] as const;
export type WalletEntryType = (typeof WALLET_ENTRY_TYPES)[number];

export const WITHDRAWAL_STATUSES = ["pending", "paid", "rejected"] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    bankName: text("bank_name").notNull(),
    bankAccountNumber: text("bank_account_number").notNull(),
    bankAccountName: text("bank_account_name").notNull(),
    status: text("status").$type<WithdrawalStatus>().notNull().default("pending"),
    adminNote: text("admin_note"),
    /** Bukti transfer (Cloudinary). */
    proofUrl: text("proof_url"),
    processedBy: text("processed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("withdrawals_agent_idx").on(t.agentId),
    index("withdrawals_status_idx").on(t.status),
  ],
);

/**
 * Buku besar dompet agen. Saldo = SUM(amount).
 * Nilai positif = pemasukan, negatif = pengurangan (penarikan/koreksi).
 */
export const walletEntries = pgTable(
  "wallet_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    type: text("type").$type<WalletEntryType>().notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    withdrawalId: uuid("withdrawal_id").references(() => withdrawals.id, {
      onDelete: "set null",
    }),
    /** Agen penjual yang menghasilkan bonus tim ini. */
    sourceAgentId: uuid("source_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    /** Tingkat downline untuk bonus tim (1 = langsung). */
    depth: integer("depth"),
    percent: numeric("percent", { precision: 5, scale: 2 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("wallet_agent_created_idx").on(t.agentId, t.createdAt),
    // Satu jenis entri per agen per pesanan: membuat pembagian komisi idempoten.
    uniqueIndex("wallet_order_agent_type_uq").on(t.orderId, t.agentId, t.type),
  ],
);

export type User = typeof user.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type AgentLevel = typeof agentLevels.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PaymentMethodRow = typeof paymentMethods.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type WalletEntry = typeof walletEntries.$inferSelect;
