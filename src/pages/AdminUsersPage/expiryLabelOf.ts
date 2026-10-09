import type { AdminUser } from "@/types";

export function expiryLabelOf(user: AdminUser, now: Date): string | null {
  if (!user.hasExpiry || !user.expires) return null;
  const expiryDate = new Date(user.expires);
  return expiryDate < now ? "Expired" : expiryDate.toLocaleDateString();
}
