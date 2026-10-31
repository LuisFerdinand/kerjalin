"use client";

import { MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/app/copy-button";
import { Panel } from "@/components/app/page-header";

export function ReferralCard({
  link,
  code,
  title = "Tautan referral",
  children,
  className,
}: {
  link: string;
  code: string;
  title?: string;
  children?: React.ReactNode;
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
    <Panel title={title} description={`Kode referral ${code}. Orang yang daftar lewat tautan ini masuk ke timmu.`} className={className}>
      <div className="grid gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 py-1.5 pr-1.5 pl-3">
          <code className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-navy">{link}</code>
          <CopyButton value={link} label="Salin" successMessage="Tautan referral disalin" variant="default" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              <MessageCircle /> Kirim lewat WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={share} className="sm:hidden">
            <Share2 /> Bagikan
          </Button>
        </div>
        {children}
      </div>
    </Panel>
  );
}
