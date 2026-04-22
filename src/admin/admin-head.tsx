import { SyncSummary } from "./sync-summary";
import type { SyncJobSummary } from "./admin-types";

type AdminHeadProps = {
  isSyncInProgress: boolean;
  canRunSync: boolean;
  canCancelSync: boolean;
  latestJob: SyncJobSummary | null;
  onRunSync: () => void;
  onCancelSync: () => void;
  onOpenCreateProduct: () => void;
  formatDateTime: (value: string | null | undefined) => string;
  formatSyncStatusRu: (status?: string | null) => string;
};

export function AdminHead({
  isSyncInProgress,
  canRunSync,
  canCancelSync,
  latestJob,
  onRunSync,
  onCancelSync,
  onOpenCreateProduct,
  formatDateTime,
  formatSyncStatusRu,
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
        <button type="button" onClick={onOpenCreateProduct}>
          Добавить товар
        </button>
      </div>
      <SyncSummary
        latestJob={latestJob}
        isSyncInProgress={isSyncInProgress}
        formatDateTime={formatDateTime}
        formatSyncStatusRu={formatSyncStatusRu}
      />
    </div>
  );
}
