import { useEffect, useState } from "react";
import { getAdminMeCached } from "./admin-auth";

let cachedShowcaseEditPermission: boolean | null = null;
let permissionInFlight: Promise<boolean> | null = null;

async function resolveShowcaseEditPermission(): Promise<boolean> {
  if (cachedShowcaseEditPermission !== null) {
    return cachedShowcaseEditPermission;
  }
  if (permissionInFlight) {
    return permissionInFlight;
  }
  permissionInFlight = (async () => {
    try {
      const payload = await getAdminMeCached();
      if (!payload) {
        cachedShowcaseEditPermission = false;
        return false;
      }
      if (payload?.is_superuser) {
        cachedShowcaseEditPermission = true;
        return true;
      }
      const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
      const allowed = permissions.includes("showcase.edit");
      cachedShowcaseEditPermission = allowed;
      return allowed;
    } catch {
      cachedShowcaseEditPermission = false;
      return false;
    } finally {
      permissionInFlight = null;
    }
  })();
  return permissionInFlight;
}

export function useShowcaseEditPermission(): boolean {
  const [canEditShowcase, setCanEditShowcase] = useState<boolean>(cachedShowcaseEditPermission === true);

  useEffect(() => {
    let aborted = false;
    void (async () => {
      const allowed = await resolveShowcaseEditPermission();
      if (!aborted) {
        setCanEditShowcase(allowed);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  return canEditShowcase;
}
