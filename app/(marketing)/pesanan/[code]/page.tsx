import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, CircleDot, MessageCircle, XCircle } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { Rise } from "@/components/marketing/rise";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappLink } from "@/lib/config";
import { formatDateTime, formatIDR } from "@/lib/format";
import { getOrderByCode } from "@/lib/queries/public";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pesanan kamu",
  robots: { index: false, follow: false },
};

const STATUS = {
  pending: { label: "Menunggu pembayaran", tone: "bg-warning/15 text-warning" },
  paid: { label: "Lunas", tone: "bg-positive/15 text-positive" },
  cancelled: { label: "Dibatalkan", tone: "bg-negative/10 text-negative" },
  refunded: { label: "Dikembalikan", tone: "bg-negative/10 text-negative" },
} as const;

export default function OrderPage(props: PageProps<"/pesanan/[code]">) {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pt-8 pb-24 sm:px-6 lg:pt-14 lg:pb-32">
      <Suspense fallback={<Skeleton className="h-[520px] rounded-3xl" />}>
        <Content params={props.params} />
      </Suspense>
    </div>
  );
}

async function Content({ params }: { params: PageProps<"/pesanan/[code]">["params"] }) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const closed = order.status === "cancelled" || order.status === "refunded";
  const paid = order.status === "paid";
  const status = STATUS[order.status];
  const firstName = order.customerName.split(/[\s(]/)[0];
  const wa = whatsappLink(`Halo Kerjalin, saya ingin konfirmasi pembayaran untuk pesanan ${order.code}.`);

  const steps = [
    { title: "Pesanan tercatat", text: `Kode pesananmu ${order.code}. Simpan kode ini.`, state: "done" as const },
    {
      title: "Instruksi pembayaran",
      text: order.sellerName
        ? `Agen ${order.sellerName} atau tim Kerjalin menghubungi WhatsAppmu untuk instruksi pembayaran.`
        : "Tim Kerjalin menghubungi WhatsAppmu untuk instruksi pembayaran.",
      state: paid ? ("done" as const) : closed ? ("off" as const) : ("now" as const),
    },
    {
      title: "Pembayaran dikonfirmasi",
      text: "Admin menandai pesanan lunas setelah pembayaran diterima.",
      state: paid ? ("done" as const) : ("off" as const),
    },
    {
      title: "Layanan aktif",
      text: "Kamu mendapat akses dan panduan memulai dari tim Kerjalin.",
      state: paid ? ("now" as const) : ("off" as const),
    },
  ];

  return (
    <>
      <Rise>
        <div className="text-center">
          <span className={cn("mx-auto grid size-16 place-items-center rounded-full", closed ? "bg-negative/10 text-negative" : "bg-navy text-white")}>
            {closed ? <XCircle className="size-8" aria-hidden /> : <CheckCircle2 className="size-8" aria-hidden />}
          </span>
          <h1 className="mt-5 text-[clamp(1.75rem,3.6vw,2.5rem)] leading-tight font-extrabold text-navy">
            {closed ? "Pesanan ini sudah ditutup" : paid ? `Terima kasih, ${firstName}!` : `Pesananmu sudah tercatat, ${firstName}!`}
          </h1>
          <p className="mx-auto mt-3 max-w-[48ch] text-muted-foreground">
            {closed
              ? "Hubungi tim Kerjalin bila kamu merasa ini keliru."
              : paid
                ? "Pembayaranmu sudah dikonfirmasi. Tim Kerjalin akan membantu kamu memulai."
                : "Belum ada pembayaran yang perlu dilakukan sekarang. Tunggu pesan WhatsApp dari kami berisi cara membayar."}
          </p>
        </div>
      </Rise>

      <Rise delay={0.1} className="mt-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-float">
          <div className="flex flex-col gap-4 bg-muted p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kode pesanan</p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-wide text-navy tabular-nums">{order.code}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", status.tone)}>{status.label}</span>
              <CopyButton value={order.code} label="Salin kode" successMessage="Kode pesanan tersalin" />
            </div>
          </div>

          <dl className="grid gap-3 p-5 text-sm sm:p-6">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Produk</dt>
              <dd className="text-right font-semibold text-navy">{order.productName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Lama langganan</dt>
              <dd className="font-medium">{order.months} bulan</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dipesan pada</dt>
              <dd className="font-medium">{formatDateTime(order.createdAt)}</dd>
            </div>
            {order.sellerName && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Dilayani agen</dt>
                <dd className="font-medium">{order.sellerName}</dd>
              </div>
            )}
            <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
              <dt className="font-semibold text-navy">Total</dt>
              <dd className="text-2xl leading-none font-extrabold text-navy tabular-nums">{formatIDR(order.amount)}</dd>
            </div>
          </dl>

          <div className="border-t border-border p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Langkah berikutnya</h2>
            <ol className="mt-4 grid gap-0">
              {steps.map((s, i) => {
                const Icon = s.state === "done" ? CheckCircle2 : s.state === "now" ? CircleDot : Circle;
                return (
                  <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-[11px] w-px bg-border" />}
                    <Icon className={cn("relative size-6 shrink-0 bg-white", s.state === "off" ? "text-input" : "text-navy")} aria-hidden />
                    <div>
                      <p className={cn("text-sm font-bold", s.state === "off" ? "text-muted-foreground" : "text-navy")}>{s.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Rise>

      <Rise delay={0.18} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-semibold text-white transition-colors hover:bg-navy-soft"
          >
            <MessageCircle className="size-4" aria-hidden />
            Konfirmasi lewat WhatsApp
          </a>
        )}
        <Link
          href="/produk"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-input bg-white px-6 text-sm font-semibold text-navy transition-colors hover:border-navy"
        >
          Lihat produk lain
        </Link>
      </Rise>
    </>
  );
}
