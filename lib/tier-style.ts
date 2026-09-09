/** Warna badge per tier untuk UI. */
export const TIER_STYLE: Record<string, string> = {
  Legend: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30",
  Diamond: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  Platinum: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  Gold: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  Silver: "bg-zinc-400/15 text-zinc-400 border-zinc-400/30",
  Bronze: "bg-amber-700/15 text-amber-600 border-amber-700/30",
};

export function tierClass(tier: string) {
  return TIER_STYLE[tier] ?? TIER_STYLE.Bronze;
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  USER: "Member",
};
