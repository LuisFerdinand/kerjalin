"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/app/copy-button";

export function ReferralCard({
  link,
  code,
  slotText,
  className,
}: {
  link: string;
  code: string;
  slotText?: string;
  className?: string;
}) {
  const message = `Yuk gabung jadi agen Kerjalin, jual layanan SaaS untuk UMKM dan dapat komisi! Daftar gratis lewat link ini: ${link}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Gabung Kerjalin", text: message, url: link });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <Card className={className}>
      <div className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-navy">
            <Link2 className="size-4 text-brand" /> Tautan referral kamu
          </p>
          {slotText && <span className="text-xs font-semibold text-muted-foreground">{slotText}</span>}
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{link}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={link} label="Salin tautan" size="default" variant="default" successMessage="Tautan referral disalin" />
          <Button variant="outline" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={share} className="sm:hidden">
            <Share2 /> Bagikan
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Kode referral: <code className="font-bold text-navy">{code}</code>. Orang yang mendaftar lewat tautan ini otomatis masuk ke timmu.
        </p>
      </div>
    </Card>
  );
}
