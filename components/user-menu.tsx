"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings, Shield, User as UserIcon, Trophy, Bookmark } from "lucide-react";
import type { Role } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export function UserMenu({
  user,
}: {
  user: {
    username: string;
    name?: string | null;
    image?: string | null;
    role: Role;
    tier: string;
    points: number;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarImage src={user.image ?? undefined} alt={user.username} />
          <AvatarFallback>{initials(user.name ?? user.username)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{user.name ?? user.username}</span>
          <span className="text-xs font-normal text-muted-foreground">
            @{user.username} · {user.tier} · {user.points} poin
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/u/${user.username}`}>
            <UserIcon /> Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks">
            <Bookmark /> Bookmark
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/leaderboard">
            <Trophy /> Leaderboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Pengaturan
          </Link>
        </DropdownMenuItem>
        {user.role !== "USER" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> Panel Moderasi
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
