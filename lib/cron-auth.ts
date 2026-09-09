/** Verifikasi request cron: header Vercel Cron atau Bearer CRON_SECRET. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (req.headers.get("x-vercel-cron")) return true;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`)
    return true;
  return !secret;
}
