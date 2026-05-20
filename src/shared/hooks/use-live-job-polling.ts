import { useEffect, useRef } from "react";
import { API_BASE, authFetch } from "../admin-auth";

type JobsLatest = {
  job_id?: string;
  status: string;
  completed_at?: string | null;
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
  const prevCompletedAtRef = useRef<string | null>(latestJob?.completed_at ? String(latestJob.completed_at) : null);

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
        const nextJobId = payload?.job_id ? String(payload.job_id) : null;
        const nextCompletedAt = payload?.completed_at ? String(payload.completed_at) : null;
        const prevStatus = prevStatusRef.current;
        const prevJobId = prevJobIdRef.current;
        const prevCompletedAt = prevCompletedAtRef.current;
        const prevWasRunning = prevStatus !== null && ["pending", "in_progress"].includes(prevStatus);
        const nowTerminal = nextStatus !== null && !["pending", "in_progress"].includes(nextStatus);
        // Refresh heavy datasets only on transition running -> terminal.
        const isNewCompletedJob =
          nowTerminal &&
          nextJobId !== null &&
          nextJobId !== prevJobId;
        const terminalCompletedAtChanged =
          nowTerminal &&
          nextCompletedAt !== null &&
          nextCompletedAt !== prevCompletedAt;
        if ((prevWasRunning && nowTerminal) || isNewCompletedJob || terminalCompletedAtChanged) {
          await refreshAfterTerminal();
        }
        prevStatusRef.current = nextStatus;
        prevJobIdRef.current = nextJobId;
        prevCompletedAtRef.current = nextCompletedAt;
      } catch {
        // silent retry by next poll
      }
    }, inProgress ? 1500 : 7000);

    return () => window.clearInterval(timer);
  }, [enabled, latestJob, refreshAfterTerminal, setLatestJob]);
}
