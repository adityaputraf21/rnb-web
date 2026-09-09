import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { ROLE_LABEL, ROLE_BADGE, tierClass } from "@/lib/tier-style";

type Row = {
  username: string;
  name: string | null;
  image: string | null;
  role: string;
  tier: string;
  bio: string | null;
};

export function UserList({ users }: { users: Row[] }) {
  if (users.length === 0)
    return <p className="text-sm text-muted-foreground">Belum ada.</p>;
  return (
    <Card className="divide-y">
      {users.map((u) => (
        <Link
          key={u.username}
          href={`/u/${u.username}`}
          className="flex items-center gap-3 p-3 hover:bg-accent/50"
        >
          <Avatar>
            <AvatarImage src={u.image ?? undefined} />
            <AvatarFallback>{initials(u.name ?? u.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-medium">
              {u.name ?? u.username}
              {u.role !== "USER" && (
                <Badge className={`h-4 px-1 text-[10px] ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </Badge>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{u.username}
              {u.bio ? ` · ${u.bio.replace(/[#*`>_[\]!]/g, "").slice(0, 60)}` : ""}
            </p>
          </div>
          <span className={`rounded border px-1.5 py-0.5 text-[10px] ${tierClass(u.tier)}`}>
            {u.tier}
          </span>
        </Link>
      ))}
    </Card>
  );
}
