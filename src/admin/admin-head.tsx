import { SyncSummary } from "./sync-summary";
import type { JobsLatest } from "../shared/live-data-types";

type AdminHeadProps = {
  isSyncInProgress: boolean;
  canRunSync: boolean;
  canCancelSync: boolean;
  canReadSync: boolean;
  canCreateProduct: boolean;
  latestJob: JobsLatest;
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
  canReadSync,
  canCreateProduct,
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
        {canReadSync ? (
          <>
            <button type="button" onClick={onRunSync} disabled={!canRunSync}>
              {isSyncInProgress ? "Синхронизация..." : "Синхронизировать товары"}
            </button>
            <button type="button" onClick={onCancelSync} disabled={!canCancelSync}>
              Отменить синхронизацию
            </button>
          </>
        ) : null}
        {canCreateProduct ? <button type="button" onClick={onOpenCreateProduct}>Добавить товар</button> : null}
      </div>
      {canReadSync ? (
        <SyncSummary
          latestJob={latestJob}
          isSyncInProgress={isSyncInProgress}
          formatDateTime={formatDateTime}
          formatSyncStatusRu={formatSyncStatusRu}
        />
      ) : null}
    </div>
  );
}
