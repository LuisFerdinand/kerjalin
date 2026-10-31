import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { listPublicProducts } from "@/lib/queries/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items: products } = await listPublicProducts({ pageSize: 500 });
  const base = siteConfig.url;

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/produk`, changeFrequency: "weekly", priority: 0.8 },
    ...products.map((p) => ({
      url: `${base}/produk/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${base}/daftar`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/syarat-ketentuan`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/kebijakan-privasi`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
