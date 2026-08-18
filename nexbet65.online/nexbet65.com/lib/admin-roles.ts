/**
 * Player-level super admin detection. Reads ADMIN_USERNAME (comma list) from
 * env. Kept in its own module so both lib/payments.ts and lib/admin-access.ts
 * can use it without an import cycle.
 */
export function isAdminUser(username: string | null | undefined): boolean {
  if (!username) return false;
  const admins = (process.env.ADMIN_USERNAME ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(username.toLowerCase());
}
