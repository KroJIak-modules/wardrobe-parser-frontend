import type { AdminMePayload } from "./admin-auth";

export function hasAnyAdminPermission(
  admin: AdminMePayload | null | undefined,
  ...permissions: string[]
): boolean {
  if (!admin) {
    return false;
  }
  if (admin.is_superuser) {
    return true;
  }
  const granted = new Set(admin.permissions || []);
  return permissions.some((permission) => granted.has(permission));
}
