import "server-only";
import { cookies } from "next/headers";

/**
 * Pilihan ciut/terbuka dari kunjungan sebelumnya. Cookie `sidebar_state` ditulis oleh SidebarProvider
 * (components/ui/sidebar.tsx). Dibaca di server supaya HTML pertama sudah memakai lebar yang benar,
 * bukan terbuka dulu lalu menciut setelah hydration.
 */
export async function sidebarDefaultOpen() {
  return (await cookies()).get("sidebar_state")?.value !== "false";
}
