import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentLevels, agents } from "@/db/schema";
import { auth } from "@/lib/auth";

/** Sesi aktif (null jika belum masuk). Di-cache per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getAgentByUserId = cache(async (userId: string) => {
  const [row] = await db
    .select({ agent: agents, level: agentLevels })
    .from(agents)
    .innerJoin(agentLevels, eq(agents.levelId, agentLevels.id))
    .where(eq(agents.userId, userId))
    .limit(1);
  return row ?? null;
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/masuk");
  return session.user;
}

/** Hanya Super Admin. Dipanggil di setiap halaman & server action admin. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/dashboard");
  return user;
}

/** Agen yang sudah melengkapi profil. Super Admin diarahkan ke /admin. */
export async function requireAgent() {
  const user = await requireUser();
  if (user.role === "super_admin") redirect("/admin");
  const profile = await getAgentByUserId(user.id);
  if (!profile) redirect("/daftar/lengkapi");
  return { user, ...profile };
}

/** Versi tanpa redirect untuk route handler / server action yang mengembalikan galat. */
export async function getCurrentUserOrNull() {
  const session = await getSession();
  return session?.user ?? null;
}
