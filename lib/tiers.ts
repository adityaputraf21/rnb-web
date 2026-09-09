// Ambang tier leaderboard berdasarkan poin. Urut dari tertinggi.
const TIERS: Array<{ name: string; min: number }> = [
  { name: "Legend", min: 5000 },
  { name: "Diamond", min: 2500 },
  { name: "Platinum", min: 1200 },
  { name: "Gold", min: 500 },
  { name: "Silver", min: 150 },
  { name: "Bronze", min: 0 },
];

export function tierForPoints(points: number): string {
  return (TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1]).name;
}
