import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  OrderStatus,
  ProductStatus,
  WalletEntryType,
  WithdrawalStatus,
} from "@/db/schema";

type Tone = "green" | "amber" | "red" | "blue" | "gray" | "navy";

const tones: Record<Tone, string> = {
  green: "bg-success/12 text-success border-success/20",
  amber: "bg-warning/12 text-warning border-warning/25",
  red: "bg-destructive/10 text-destructive border-destructive/20",
  blue: "bg-brand/10 text-brand border-brand/20",
  gray: "bg-muted text-muted-foreground border-border",
  navy: "bg-navy/10 text-navy border-navy/15",
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
    <Badge variant="outline" className={cn("gap-1.5 font-semibold", tones[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
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
  coming_soon: ["blue", "Segera hadir"],
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
  override: "blue",
  reversal: "red",
  adjustment: "navy",
  withdrawal: "amber",
  withdrawal_refund: "gray",
};
export function WalletTypeBadge({ type }: { type: WalletEntryType }) {
  return <StatusBadge tone={walletTone[type]}>{walletTypeLabel[type]}</StatusBadge>;
}

export function LevelBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}14` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
