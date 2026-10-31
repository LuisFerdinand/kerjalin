import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { CategoryFormDialog, DeleteCategoryButton } from "@/components/admin/category-dialogs";
import { listCategoriesAdmin } from "@/lib/queries/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Kategori" };

export default async function CategoriesPage() {
  await requireAdmin();
  const items = await listCategoriesAdmin();
  const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;

  const addButton = (
    <CategoryFormDialog
      nextOrder={nextOrder}
      trigger={
        <Button>
          <Plus /> Kategori baru
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelompokkan produk agar mudah disaring di katalog situs."
        actions={addButton}
      />

      {items.length === 0 ? (
        <EmptyState icon={Tags} title="Belum ada kategori" description="Buat kategori pertama, mis. Laundry." action={addButton} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Kategori</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Produk</TableHead>
                <TableHead className="text-right">Tampil di situs</TableHead>
                <TableHead className="text-right">Urutan</TableHead>
                <TableHead className="pr-5 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-5">
                    <p className="font-semibold text-navy">{c.name}</p>
                    {c.description && <p className="max-w-md truncate text-[0.8125rem] text-muted-foreground">{c.description}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link href={`/admin/produk?kategori=${c.id}`} className="font-medium text-navy hover:underline">
                      {c.productCount}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{c.publicCount}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{c.sortOrder}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-1">
                      <CategoryFormDialog
                        category={{ id: c.id, name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder }}
                        nextOrder={nextOrder}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Ubah kategori ${c.name}`}>
                            <Pencil />
                          </Button>
                        }
                      />
                      <DeleteCategoryButton id={c.id} name={c.name} productCount={c.productCount} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
