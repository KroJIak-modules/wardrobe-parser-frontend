import { useMemo } from "react";

type JobLike = {
  job_id: string;
  status: string;
  can_cancel?: boolean;
};

type UseAdminSyncControlsParams = {
  latestJob: JobLike | null;
  runSync: () => Promise<{ ok: boolean; message: string }>;
  cancelSync: (jobId: string) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminSyncControls(params: UseAdminSyncControlsParams) {
  const { latestJob, runSync, cancelSync, pushToast } = params;

  const isSyncInProgress = useMemo(
    () => Boolean(latestJob && ["queued", "running"].includes(latestJob.status)),
    [latestJob]
  );
  const canRunSync = !isSyncInProgress;
  const canCancelSync = Boolean(latestJob?.can_cancel && latestJob?.job_id);

  const onRunSync = async () => {
    const result = await runSync();
    if (!result.ok) {
      pushToast(result.message);
    }
  };

  const onCancelSync = async () => {
    if (!latestJob?.job_id) {
      return;
    }
    const result = await cancelSync(latestJob.job_id);
    pushToast(result.message);
  };

  return {
    isSyncInProgress,
    canRunSync,
    canCancelSync,
    onRunSync,
    onCancelSync,
  };
}
