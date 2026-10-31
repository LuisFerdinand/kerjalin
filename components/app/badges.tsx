import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  OrderStatus,
  ProductStatus,
  WalletEntryType,
  WithdrawalStatus,
} from "@/db/schema";

type Tone = "green" | "amber" | "red" | "navy" | "gray";

/** Pasangan pucat: latar muda + teks gelap dari warna yang sama. */
const tones: Record<Tone, string> = {
  green: "bg-[#dcfae5] text-[#04250e]",
  amber: "bg-[#fff4d6] text-[#7a4a00]",
  red: "bg-[#ffedea] text-[#831c1e]",
  navy: "bg-brand-soft text-navy",
  gray: "bg-[#eef1f8] text-[#475373]",
};

const dots: Record<Tone, string> = {
  green: "bg-positive",
  amber: "bg-warning",
  red: "bg-negative",
  navy: "bg-navy",
  gray: "bg-[#8a93ab]",
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />
      {children}
    </span>
  );
}

const agentStatus: Record<AgentStatus, [Tone, string]> = {
  active: ["green", "Aktif"],
  pending: ["amber", "Menunggu"],
  suspended: ["red", "Nonaktif"],
};
export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const [tone, label] = agentStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

const orderStatus: Record<OrderStatus, [Tone, string]> = {
  paid: ["green", "Lunas"],
  pending: ["amber", "Menunggu"],
  cancelled: ["gray", "Dibatalkan"],
  refunded: ["red", "Direfund"],
};
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const [tone, label] = orderStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

const withdrawalStatus: Record<WithdrawalStatus, [Tone, string]> = {
  paid: ["green", "Dibayar"],
  pending: ["amber", "Diproses"],
  rejected: ["red", "Ditolak"],
};
export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const [tone, label] = withdrawalStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

const productStatus: Record<ProductStatus, [Tone, string]> = {
  active: ["green", "Aktif"],
  coming_soon: ["navy", "Segera hadir"],
  draft: ["gray", "Draf"],
  archived: ["red", "Diarsipkan"],
};
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const [tone, label] = productStatus[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export const walletTypeLabel: Record<WalletEntryType, string> = {
  commission: "Komisi",
  override: "Bonus tim",
  reversal: "Pembatalan",
  adjustment: "Koreksi",
  withdrawal: "Penarikan",
  withdrawal_refund: "Penarikan ditolak",
};

const walletTone: Record<WalletEntryType, Tone> = {
  commission: "green",
  override: "navy",
  reversal: "red",
  adjustment: "gray",
  withdrawal: "amber",
  withdrawal_refund: "gray",
};
export function WalletTypeBadge({ type }: { type: WalletEntryType }) {
  return <StatusBadge tone={walletTone[type]}>{walletTypeLabel[type]}</StatusBadge>;
}

/** Level agen: titik warna level + nama. Warna level hanya identitas, bukan status. */
export function LevelBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[0.8125rem] font-medium whitespace-nowrap text-navy">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {name}
    </span>
  );
}
