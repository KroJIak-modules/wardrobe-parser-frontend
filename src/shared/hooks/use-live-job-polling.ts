import { useEffect, useRef } from "react";
import { API_BASE, authFetch } from "../admin-auth";

type JobsLatest = {
  status: string;
} | null;

type Params = {
  latestJob: JobsLatest;
  setLatestJob: (payload: JobsLatest) => void;
  refresh: () => Promise<void>;
  enabled?: boolean;
};

export function useLiveJobPolling({ latestJob, setLatestJob, refresh, enabled = true }: Params) {
  const prevStatusRef = useRef<string | null>(latestJob?.status ?? null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const inProgress = Boolean(latestJob && ["pending", "in_progress"].includes(latestJob.status));
    const timer = window.setInterval(async () => {
      try {
        const res = await authFetch(`${API_BASE}/jobs/latest`);
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        setLatestJob(payload);
        const nextStatus = payload?.status ? String(payload.status) : null;
        const prevStatus = prevStatusRef.current;
        const prevWasRunning = prevStatus !== null && ["pending", "in_progress"].includes(prevStatus);
        const nowTerminal = nextStatus !== null && !["pending", "in_progress"].includes(nextStatus);
        // Refresh heavy datasets only on transition running -> terminal.
        if (prevWasRunning && nowTerminal) {
          await refresh();
        }
        prevStatusRef.current = nextStatus;
      } catch {
        // silent retry by next poll
      }
    }, inProgress ? 3000 : 10000);

    return () => window.clearInterval(timer);
  }, [enabled, latestJob, refresh, setLatestJob]);
}
