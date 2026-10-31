import type { Metadata, Viewport } from "next";
import { Caveat, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/** Tulisan tangan, hanya untuk catatan kecil di beranda. */
const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#082052",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${jakarta.variable} ${hand.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
