type SyncSummaryJob = {
  status: string;
  progress_percent?: number | null;
  processed_sources?: number | null;
  total_sources?: number | null;
  current_source_name?: string | null;
  current_source_parser_type?: string | null;
  current_strategy_index?: number | null;
  current_strategy_total?: number | null;
  current_stage?: string | null;
  current_source_processed_products?: number | null;
  current_source_total_products?: number | null;
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
  formatSyncStatusRu: (status: string | null | undefined) => string;
  formatSyncStageRu: (stage: string | null | undefined) => string;
};

const clampPercent = (value: number | null | undefined): number => Math.max(0, Math.min(100, value || 0));

export function SyncSummary({ latestJob, isSyncInProgress, formatDateTime, formatSyncStatusRu, formatSyncStageRu }: SyncSummaryProps) {
  const [, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!latestJob) {
    return null;
  }

  const strategyIndex = Math.max(1, Number(latestJob.current_strategy_index || 1));
  const strategyTotal = Math.max(strategyIndex, Number(latestJob.current_strategy_total || 1));
  const lastAtRaw = latestJob.completed_at || latestJob.started_at || latestJob.created_at;
  const processedProducts = Number(latestJob.processed_products ?? 0);
  const currentSourceProcessed = Number(latestJob.current_source_processed_products ?? 0);
  const successCount = Math.max(processedProducts, currentSourceProcessed, 0);
  const failCount = Number(latestJob.failed_products ?? 0);
  const failedStageText = String(latestJob.current_stage || "").trim();
  const failedStatusText =
    String(latestJob.status || "").trim().toLowerCase() === "failed" && failedStageText.toLowerCase().startsWith("ошибки на источниках:")
      ? failedStageText
      : formatSyncStatusRu(latestJob.status);

  const formatElapsedRu = (iso: string | null | undefined): string => {
    if (!iso) {
      return "";
    }
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) {
      return "";
    }
    const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    const days = Math.floor(diffMin / (60 * 24));
    const hours = Math.floor((diffMin % (60 * 24)) / 60);
    const minutes = diffMin % 60;
    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days % 10 === 1 && days % 100 !== 11 ? "день" : days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20) ? "дня" : "дней"}`);
    }
    if (hours > 0) {
      parts.push(`${hours} ${hours % 10 === 1 && hours % 100 !== 11 ? "час" : hours % 10 >= 2 && hours % 10 <= 4 && (hours % 100 < 10 || hours % 100 >= 20) ? "часа" : "часов"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes % 10 === 1 && minutes % 100 !== 11 ? "минута" : minutes % 10 >= 2 && minutes % 10 <= 4 && (minutes % 100 < 10 || minutes % 100 >= 20) ? "минуты" : "минут"}`);
    }
    return parts.join(", ");
  };

  return (
    <div className="sync-summary">
      {isSyncInProgress ? (
        <>
          <div className="sync-progress">
            <div className="sync-progress__bar" style={{ width: `${clampPercent(latestJob.progress_percent)}%` }} />
          </div>
          <div className="sync-stats">
            <span className="sync-pill">{`${latestJob.processed_sources || 0}/${latestJob.total_sources || 0} | ${latestJob.current_source_name || "—"}`}</span>
            <span className="sync-pill">
              Стратегия: {latestJob.current_source_parser_type || "—"} ({strategyIndex}/{strategyTotal})
            </span>
            <span className="sync-pill">Этап: {formatSyncStageRu(latestJob.current_stage)}</span>
            <span className="sync-pill">Успешно: {successCount}</span>
            <span className="sync-pill">Ошибки: {failCount}</span>
            <span className="sync-pill">{clampPercent(latestJob.progress_percent)}%</span>
          </div>
        </>
      ) : (
        <div className="sync-last-run">
          Статус последнего запуска: {failedStatusText}. Дата: {formatDateTime(lastAtRaw)}
          {formatElapsedRu(lastAtRaw) ? `, ${formatElapsedRu(lastAtRaw)} назад` : ""}
        </div>
      )}
      {!isSyncInProgress ? (
        <div className="sync-stats">
          <span className="sync-pill">Успешно: {successCount}</span>
          <span className="sync-pill">Ошибки: {failCount}</span>
        </div>
      ) : null}
    </div>
  );
}
import { useEffect, useState } from "react";
