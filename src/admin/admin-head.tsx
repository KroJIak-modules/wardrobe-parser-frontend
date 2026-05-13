import { SyncSummary } from "./sync-summary";
import type { SyncJobSummary } from "./admin-types";

type AdminHeadProps = {
  isSyncInProgress: boolean;
  canRunSync: boolean;
  canCancelSync: boolean;
  latestJob: SyncJobSummary | null;
  onRunSync: () => void;
  onCancelSync: () => void;
  formatDateTime: (value: string | null | undefined) => string;
  formatSyncStatusRu: (status?: string | null) => string;
  formatSyncStageRu: (stage?: string | null) => string;
};

export function AdminHead({
  isSyncInProgress,
  canRunSync,
  canCancelSync,
  latestJob,
  onRunSync,
  onCancelSync,
  formatDateTime,
  formatSyncStatusRu,
  formatSyncStageRu,
}: AdminHeadProps) {
  return (
    <div className="admin-head">
      <h1>Панель управления</h1>
      <div className="actions">
        <button type="button" onClick={onRunSync} disabled={!canRunSync}>
          {isSyncInProgress ? "Синхронизация..." : "Синхронизировать товары"}
        </button>
        <button type="button" onClick={onCancelSync} disabled={!canCancelSync}>
          Отменить синхронизацию
        </button>
      </div>
      <SyncSummary
        latestJob={latestJob}
        isSyncInProgress={isSyncInProgress}
        formatDateTime={formatDateTime}
        formatSyncStatusRu={formatSyncStatusRu}
        formatSyncStageRu={formatSyncStageRu}
      />
    </div>
  );
}
