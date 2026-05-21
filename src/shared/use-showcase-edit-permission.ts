import { useEffect, useState } from "react";
import { API_BASE, authFetch } from "./admin-auth";

type AuthMePayload = {
  is_superuser?: boolean;
  permissions?: string[];
};

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
      const res = await authFetch(`${API_BASE}/auth/me`);
      if (!res.ok) {
        cachedShowcaseEditPermission = false;
        return false;
      }
      const payload = (await res.json()) as AuthMePayload;
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
    let cancelled = false;
    void (async () => {
      const allowed = await resolveShowcaseEditPermission();
      if (!cancelled) {
        setCanEditShowcase(allowed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return canEditShowcase;
}

