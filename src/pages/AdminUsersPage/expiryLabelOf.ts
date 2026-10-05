import type { AdminUser } from "@/types";

export function expiryLabelOf(user: AdminUser, now: Date): string | null {
  if (!user.hasExpiry || !user.expires) return null;
  const expires = new Date(user.expires);
  return expires < now ? "Expired" : expires.toLocaleDateString();
}
