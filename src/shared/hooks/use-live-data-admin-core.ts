import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { API_BASE, authFetch } from "../admin-auth";

type Source = {
  key: string;
  source_id: number | null;
  name: string;
};

type JobsLatest = {
  job_id: string;
  status: string;
} | null;

type Params = {
  setSources: Dispatch<SetStateAction<Source[]>>;
  setLatestJob: Dispatch<SetStateAction<JobsLatest>>;
};

export function useLiveDataAdminCore({ setSources, setLatestJob }: Params) {
  const refreshSourcesOnly = useCallback(async () => {
    const res = await authFetch(`${API_BASE}/sources`);
    if (!res.ok) {
      throw new Error(`Sources API error: ${res.status}`);
    }
    const payload = (await res.json()) as Source[];
    setSources(payload || []);
  }, [setSources]);

  const refreshAdminCoreOnly = useCallback(async () => {
    const latestJobRes = await authFetch(`${API_BASE}/jobs/latest`);
    if (!latestJobRes.ok) {
      throw new Error(`Jobs API error: ${latestJobRes.status}`);
    }
    const latestPayload = (await latestJobRes.json()) as JobsLatest;
    setLatestJob(latestPayload);
  }, [setLatestJob]);

  return {
    refreshSourcesOnly,
    refreshAdminCoreOnly,
  };
}
