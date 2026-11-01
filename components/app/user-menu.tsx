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
      className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-[0.9375rem] font-medium text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-r-none group-data-[collapsible=icon]:px-0"
    >
      <LogOut className="size-[18px] shrink-0" strokeWidth={1.7} aria-hidden />
      <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
    </button>
  );
}

function UserAvatar({ user, className }: { user: UserMenuUser; className?: string }) {
  return (
    <Avatar className={className}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="bg-navy text-xs font-bold text-white">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Placeholder selama data akun dimuat, seukuran tombol akun supaya bilah atas tidak bergeser. */
export function AccountMenuSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-xl lg:w-48" />;
}

/**
 * Menu akun di ujung kanan bilah atas: foto, nama, dan peran. Klik untuk melihat email, membuka profil,
 * kembali ke beranda, atau keluar.
 */
export function AccountMenu({ user, variant }: { user: UserMenuUser; variant: "admin" | "agent" }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu akun ${user.name}`}
          className="flex h-10 items-center gap-2.5 rounded-xl border border-border py-1 pr-2 pl-1 text-left outline-none transition-colors hover:border-navy/40 hover:bg-muted focus-visible:ring-2 focus-visible:ring-navy/30 data-[state=open]:border-navy/40 data-[state=open]:bg-muted lg:pr-3"
        >
          <UserAvatar user={user} className="size-8" />
          <span className="hidden min-w-0 leading-tight lg:block">
            <span className="block max-w-36 truncate text-sm font-semibold text-navy">{user.name}</span>
            <span className="block max-w-36 truncate text-xs text-muted-foreground">{user.caption}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 rounded-xl" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center gap-3 p-2 font-normal">
          <UserAvatar user={user} className="size-10" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-navy">{user.name}</span>
            <span className="block truncate text-[0.8125rem] text-muted-foreground">{user.email}</span>
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-navy">
              {user.caption}
            </span>
          </span>
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
