import { useEffect, useRef } from "react";
import { API_BASE, authFetch } from "../admin-auth";

type JobsLatest = {
  job_id?: string;
  status: string;
  finished_at?: string | null;
} | null;

type Params = {
  latestJob: JobsLatest;
  setLatestJob: (payload: JobsLatest) => void;
  refreshAfterTerminal: () => Promise<void>;
  enabled?: boolean;
};

export function useLiveJobPolling({ latestJob, setLatestJob, refreshAfterTerminal, enabled = true }: Params) {
  const prevStatusRef = useRef<string | null>(latestJob?.status ?? null);
  const prevJobIdRef = useRef<string | null>(latestJob?.job_id ? String(latestJob.job_id) : null);
  const prevFinishedAtRef = useRef<string | null>(latestJob?.finished_at ? String(latestJob.finished_at) : null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const inProgress = Boolean(latestJob && ["queued", "running"].includes(latestJob.status));
    const timer = window.setInterval(async () => {
      try {
        const res = await authFetch(`${API_BASE}/jobs/latest`);
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        setLatestJob(payload);
        const nextStatus = payload?.status ? String(payload.status) : null;
        const nextJobId = payload?.job_id ? String(payload.job_id) : null;
        const nextFinishedAt = payload?.finished_at ? String(payload.finished_at) : null;
        const prevStatus = prevStatusRef.current;
        const prevJobId = prevJobIdRef.current;
        const prevFinishedAt = prevFinishedAtRef.current;
        const prevWasRunning = prevStatus !== null && ["queued", "running"].includes(prevStatus);
        const nowTerminal = nextStatus !== null && !["queued", "running"].includes(nextStatus);
        // Refresh heavy datasets only on transition running -> terminal.
        const isNewCompletedJob =
          nowTerminal &&
          nextJobId !== null &&
          nextJobId !== prevJobId;
        const terminalFinishedAtChanged =
          nowTerminal &&
          nextFinishedAt !== null &&
          nextFinishedAt !== prevFinishedAt;
        if ((prevWasRunning && nowTerminal) || isNewCompletedJob || terminalFinishedAtChanged) {
          await refreshAfterTerminal();
        }
        prevStatusRef.current = nextStatus;
        prevJobIdRef.current = nextJobId;
        prevFinishedAtRef.current = nextFinishedAt;
      } catch {
        // silent retry by next poll
      }
    }, inProgress ? 1500 : 7000);

    return () => window.clearInterval(timer);
  }, [enabled, latestJob, refreshAfterTerminal, setLatestJob]);
}
