"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Home, LogOut, UserCog } from "lucide-react";
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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/format";

export type UserMenuUser = {
  name: string;
  email: string;
  image: string | null;
  caption: string;
};

export function UserMenu({
  user,
  variant,
}: {
  user: UserMenuUser | null;
  variant: "admin" | "agent";
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="size-8 rounded-lg bg-white/15" />
        <Skeleton className="h-8 flex-1 bg-white/15 group-data-[collapsible=icon]:hidden" />
      </div>
    );
  }

  async function signOut() {
    await authClient.signOut();
    toast.success("Kamu sudah keluar");
    router.replace("/masuk");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                {user.image && <AvatarImage src={user.image} alt="" />}
                <AvatarFallback className="rounded-lg bg-brand text-xs font-bold text-white">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">{user.name}</span>
                <span className="truncate text-xs text-cream/60">{user.caption}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-cream/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
