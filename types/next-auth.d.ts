import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      points: number;
      tier: string;
      banned: boolean;
      mutedUntil: string | null;
    } & DefaultSession["user"];
  }
}
