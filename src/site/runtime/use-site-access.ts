import { useCallback, useEffect, useState } from "react";
import {
  siteApiJson,
  type SiteApiAccessStatusResponse,
  type SiteApiAccessUnlockResponse,
} from "./site-public-api";

type SiteAccessState = {
  loading: boolean;
  error: string | null;
  status: SiteApiAccessStatusResponse | null;
  refresh: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
};

export function useSiteAccess(): SiteAccessState {
  const [status, setStatus] = useState<SiteApiAccessStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await siteApiJson<SiteApiAccessStatusResponse>("/site/access/status"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось проверить доступ");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlock = useCallback(async (password: string) => {
    setError(null);
    await siteApiJson<SiteApiAccessUnlockResponse>("/site/access/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setStatus(await siteApiJson<SiteApiAccessStatusResponse>("/site/access/status"));
  }, []);

  return {
    loading,
    error,
    status,
    refresh,
    unlock,
  };
}
