import { useEffect } from "react";
import { API_BASE, authFetch } from "../admin-auth";

type JobsLatest = {
  status: string;
} | null;

type Params = {
  latestJob: JobsLatest;
  setLatestJob: (payload: JobsLatest) => void;
  refresh: () => Promise<void>;
  syncMockEnabled?: boolean;
  readMockJob?: () => JobsLatest;
};

export function useLiveJobPolling({ latestJob, setLatestJob, refresh, syncMockEnabled = false, readMockJob }: Params) {
  useEffect(() => {
    const inProgress = Boolean(latestJob && ["pending", "in_progress"].includes(latestJob.status));
    const timer = window.setInterval(async () => {
      try {
        if (syncMockEnabled && readMockJob) {
          const payload = readMockJob();
          if (payload) {
            setLatestJob(payload);
            if (!["pending", "in_progress"].includes(String(payload.status || ""))) {
              await refresh();
            }
          }
          return;
        }
        const res = await authFetch(`${API_BASE}/jobs/latest`);
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        setLatestJob(payload);
        if (payload && !["pending", "in_progress"].includes(payload.status)) {
          await refresh();
        }
      } catch {
        // silent retry by next poll
      }
    }, inProgress ? 3000 : 10000);

    return () => window.clearInterval(timer);
  }, [latestJob, refresh, setLatestJob, syncMockEnabled, readMockJob]);
}
