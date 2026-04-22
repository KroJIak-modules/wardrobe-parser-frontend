type SyncSummaryJob = {
  status: string;
  progress_percent?: number | null;
  processed_sources?: number | null;
  total_sources?: number | null;
  current_source_name?: string | null;
  current_source_parser_type?: string | null;
  processed_products?: number | null;
  expected_products?: number | null;
  failed_products?: number | null;
  completed_at?: string | null;
  started_at?: string | null;
  created_at?: string | null;
} | null;

type SyncSummaryProps = {
  latestJob: SyncSummaryJob;
  isSyncInProgress: boolean;
  formatDateTime: (value: string | null | undefined) => string;
  formatSyncStatusRu: (status: string) => string;
};

const clampPercent = (value: number | null | undefined): number => Math.max(0, Math.min(100, value || 0));

export function SyncSummary({ latestJob, isSyncInProgress, formatDateTime, formatSyncStatusRu }: SyncSummaryProps) {
  if (!latestJob) {
    return null;
  }

  return (
    <div className="sync-summary">
      {isSyncInProgress ? (
        <>
          <div className="sync-progress">
            <div className="sync-progress__bar" style={{ width: `${clampPercent(latestJob.progress_percent)}%` }} />
          </div>
          <div className="sync-stats">
            <span className="sync-pill">{`${latestJob.processed_sources || 0}/${latestJob.total_sources || 0}`}</span>
            <span className="sync-pill">{latestJob.current_source_name || "—"}</span>
            <span className="sync-pill">{latestJob.current_source_parser_type || "—"}</span>
            <span className="sync-pill">Выгружено: {latestJob.processed_products || 0}</span>
            <span className="sync-pill">Обнаружено: {latestJob.expected_products || 0}</span>
            <span className="sync-pill">Ошибок: {latestJob.failed_products || 0}</span>
            <span className="sync-pill">{clampPercent(latestJob.progress_percent)}%</span>
            <span className="sync-pill">{formatSyncStatusRu(latestJob.status)}</span>
          </div>
        </>
      ) : latestJob.status === "completed" ? (
        <p className="muted">
          Синхронизация завершена! Дата последней синхронизиации: {formatDateTime(latestJob.completed_at)}
        </p>
      ) : (
        <p className="muted">
          Последний запуск: {latestJob.status}. Дата: {formatDateTime(latestJob.completed_at || latestJob.started_at || latestJob.created_at)}
        </p>
      )}
    </div>
  );
}
