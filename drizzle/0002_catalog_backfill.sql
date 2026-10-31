-- Memindahkan nama kategori teks lama ke tabel categories, lalu menautkan produk.
INSERT INTO "categories" ("name", "slug", "sort_order")
SELECT DISTINCT
  "category",
  lower(regexp_replace(regexp_replace("category", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')),
  0
FROM "products"
WHERE "category" IS NOT NULL AND "category" <> ''
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
UPDATE "products" p
SET "category_id" = c."id"
FROM "categories" c
WHERE c."slug" = lower(regexp_replace(regexp_replace(p."category", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));
