import { cacheLife } from "next/cache";

/** Tahun berjalan; di-cache agar tidak membuat halaman menjadi dinamis. */
export async function Copyright() {
  "use cache";
  cacheLife("days");
  return <>© {new Date().getFullYear()} Kerjalin</>;
}
