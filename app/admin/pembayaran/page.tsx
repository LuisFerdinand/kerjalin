import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { GatewayCard, QrisCard } from "@/components/admin/payment-settings";
import { siteConfig, siteIsLocal } from "@/lib/config";
import { WEBHOOK_PATH, isGatewayKey } from "@/lib/payments/meta";
import { getAdminMethodViews } from "@/lib/payments/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PaymentsPage() {
  await requireAdmin();
  const views = await getAdminMethodViews();

  return (
    <>
      <PageHeader
        title="Pembayaran"
        description="Atur cara pelanggan membayar pesanan. Metode yang aktif tampil di halaman checkout."
      />

      <div className="grid max-w-3xl gap-6">
        <p className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4 text-sm text-navy">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Payment gateway menandai pesanan lunas dan membagikan komisi secara otomatis. QRIS manual menunggu kamu memeriksa
            mutasi lalu menekan Lunas di halaman Pesanan. Bila tidak ada metode yang aktif, pesanan dikonfirmasi lewat WhatsApp
            seperti sebelumnya.
          </span>
        </p>

        {views.map((view) =>
          isGatewayKey(view.key) ? (
            <GatewayCard
              key={view.key}
              view={view}
              webhookUrl={`${siteConfig.url}${WEBHOOK_PATH[view.key]}`}
              siteIsLocal={siteIsLocal}
            />
          ) : (
            <QrisCard key={view.key} view={view} />
          ),
        )}
      </div>
    </>
  );
}
