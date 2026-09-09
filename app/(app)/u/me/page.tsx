import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function MyProfileRedirect() {
  const user = await getCurrentUser();
  redirect(user ? `/u/${user.username}` : "/login?callbackUrl=/u/me");
}
