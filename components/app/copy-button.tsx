"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Salin",
  successMessage = "Tersalin ke clipboard",
  variant = "outline",
  size = "sm",
}: {
  value: string;
  label?: string;
  successMessage?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "icon-sm";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Tidak bisa menyalin. Salin secara manual.");
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={copy} aria-label={label}>
      {copied ? <Check /> : <Copy />}
      {size !== "icon-sm" && (copied ? "Tersalin" : label)}
    </Button>
  );
}
