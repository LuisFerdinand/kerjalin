"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Home, LogOut, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/format";

export type UserMenuUser = {
  name: string;
  email: string;
  image: string | null;
  caption: string;
};

function useSignOut() {
  const router = useRouter();
  return async function signOut() {
    await authClient.signOut();
    toast.success("Kamu sudah keluar");
    router.replace("/masuk");
    router.refresh();
  };
}

/** Tombol keluar di dasar sidebar. Tinggal ikon saat sidebar diciutkan. */
export function SignOutButton() {
  const signOut = useSignOut();
  return (
    <button
      type="button"
      onClick={signOut}
      title="Keluar"
      className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-[0.9375rem] font-medium text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <LogOut className="size-[18px] shrink-0" strokeWidth={1.7} aria-hidden />
      <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
    </button>
  );
}

/** Kartu profil di bagian atas sidebar: foto, nama, dan email. Klik untuk membuka menu akun. */
export function UserMenu({ user, variant }: { user: UserMenuUser | null; variant: "admin" | "agent" }) {
  const { isMobile } = useSidebar();
  const signOut = useSignOut();

  if (!user) {
    return (
      <div className="grid justify-items-center gap-2 px-4 py-3 group-data-[collapsible=icon]:px-1">
        <Skeleton className="size-14 rounded-full bg-white/15 group-data-[collapsible=icon]:size-9" />
        <Skeleton className="h-4 w-28 bg-white/15 group-data-[collapsible=icon]:hidden" />
        <Skeleton className="h-3 w-36 bg-white/10 group-data-[collapsible=icon]:hidden" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={user.name}
          className="group/profile mx-3 grid justify-items-center gap-1 rounded-2xl px-3 py-3 text-center outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 data-[state=open]:bg-white/10 group-data-[collapsible=icon]:mx-1 group-data-[collapsible=icon]:px-0"
        >
          <Avatar className="size-14 ring-2 ring-white/30 group-data-[collapsible=icon]:size-9">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-white text-base font-bold text-navy group-data-[collapsible=icon]:text-xs">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="mt-1.5 flex max-w-full items-center gap-1 text-sm font-semibold text-white group-data-[collapsible=icon]:hidden">
            <span className="truncate">{user.name}</span>
            <ChevronDown className="size-3.5 shrink-0 text-white/60" aria-hidden />
          </span>
          <span className="max-w-full truncate text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">{user.email}</span>
          <span className="mt-1 rounded-full bg-white/12 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white group-data-[collapsible=icon]:hidden">
            {user.caption}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-xl" side={isMobile ? "bottom" : "right"} align="start" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
          <p className="truncate text-[0.8125rem] text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {variant === "agent" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profil">
              <UserCog /> Profil & rekening
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/">
            <Home /> Ke beranda
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} variant="destructive">
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
