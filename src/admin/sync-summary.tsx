import { useEffect, useState } from "react";
import type { JobsLatest, SyncSourceIssue } from "../shared/live-data-types";
import "./sync-summary.css";

type SyncSummaryProps = {
  latestJob: JobsLatest;
  isSyncInProgress: boolean;
  formatDateTime: (value: string | null | undefined) => string;
  formatSyncStatusRu: (status: string | null | undefined) => string;
};

function formatElapsedRu(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "";
  }
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) {
    return "только что";
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  const parts: string[] = [];
  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"}`);
  }
  if (restMinutes) {
    parts.push(`${restMinutes} ${restMinutes % 10 === 1 && restMinutes !== 11 ? "минуту" : restMinutes % 10 >= 2 && restMinutes % 10 <= 4 && (restMinutes < 10 || restMinutes >= 20) ? "минуты" : "минут"}`);
  }
  return `${parts.join(" ")} назад`;
}

function issueKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    product_validation: "Данные товаров",
    source_blocked: "Доступ к источнику",
    service_timeout: "Долгий ответ",
    service_unavailable: "Сервис недоступен",
    source_response_invalid: "Формат данных",
    catalog_empty: "Каталог не получен",
    source_config_invalid: "Настройки источника",
    browser_runtime_failed: "Проверка в браузере",
    source_registry_unavailable: "Настройки источников",
    source_failed: "Ошибка источника",
    backend_restarted: "Перезапуск сервера",
    canceled: "Запуск отменён",
  };
  return labels[kind] || "Ошибка синхронизации";
}

function SyncIssueDetails({ issue }: { issue: SyncSourceIssue }) {
  return (
    <details className="sync-summary__issue">
      <summary>
        <span className="sync-summary__issue-heading">
          <span>{issue.source_name}</span>
          <span className="sync-summary__issue-kind">{issueKindLabel(issue.kind)}</span>
        </span>
        {issue.affected_products > 0 ? <span className="sync-summary__issue-count">{issue.affected_products}</span> : null}
      </summary>
      <div className="sync-summary__issue-body">
        <p>{issue.title}</p>
        {issue.reasons.length ? (
          <ul>
            {issue.reasons.map((reason) => (
              <li key={reason.code}>
                {reason.label}: {reason.count}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

export function SyncSummary({ latestJob, isSyncInProgress, formatDateTime, formatSyncStatusRu }: SyncSummaryProps) {
  const [, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!latestJob) {
    return null;
  }

  const lastAt = latestJob.finished_at || latestJob.started_at || latestJob.created_at;
  const sourceIssues = latestJob.source_issues || [];
  const warningProducts = Number(latestJob.warning_products || 0);
  const failedProducts = Number(latestJob.failed_products || 0);
  const hasIssues = sourceIssues.length > 0 || warningProducts > 0 || failedProducts > 0 || Boolean(latestJob.error);
  const status = String(latestJob.status || "").toLowerCase();
  const statusClass = status === "failed" ? "sync-summary__status--error" : hasIssues ? "sync-summary__status--warning" : "sync-summary__status--success";
  const statusLabel = status === "completed" && hasIssues
    ? "Завершено с предупреждениями"
    : formatSyncStatusRu(latestJob.status);
  const currentStage = latestJob.current_stage;
  const activityLabel = currentStage?.label || (status === "queued" ? "Запуск ожидает начала" : "Синхронизация выполняется");
  const activityDetail = currentStage?.detail || (status === "queued"
    ? "Сервис готовит выполнение выбранных источников"
    : "Получаем и проверяем данные товаров");

  return (
    <section className="sync-summary" aria-label="Итог синхронизации">
      <div className={`sync-summary__layout${sourceIssues.length ? " sync-summary__layout--with-issues" : ""}`}>
        <div className="sync-summary__primary">
          <div className="sync-summary__header">
            <div>
              <p className="sync-summary__eyebrow">Последний запуск</p>
              <div className="sync-summary__headline">
                <span className={`sync-summary__status ${statusClass}`}>{statusLabel}</span>
                <span>{formatDateTime(lastAt)}</span>
                {formatElapsedRu(lastAt) ? <span>{formatElapsedRu(lastAt)}</span> : null}
              </div>
              {isSyncInProgress ? (
                <div className="sync-summary__activity" aria-live="polite">
                  <strong>{activityLabel}</strong>
                  <span>{activityDetail}</span>
                </div>
              ) : null}
            </div>
          </div>

          {isSyncInProgress ? (
            <div className="sync-summary__progress" aria-label={`Выполнено ${latestJob.progress_percent || 0}%`}>
              <span style={{ width: `${Math.max(0, Math.min(100, Number(latestJob.progress_percent || 0)))}%` }} />
            </div>
          ) : null}

          <div className="sync-summary__body">
            <div className="sync-summary__main">
              <div className="sync-summary__metrics">
                <div>
                  <span>Источники</span>
                  <strong>
                    {latestJob.processed_sources}/{latestJob.total_sources}
                    {latestJob.current_source_name ? <em>{latestJob.current_source_name}</em> : null}
                  </strong>
                </div>
                <div><span>Обработано товаров</span><strong>{latestJob.products_applied}</strong></div>
                <div className={hasIssues ? "sync-summary__metric--warning" : ""}><span>Требуют внимания</span><strong>{warningProducts || failedProducts}</strong></div>
              </div>
              {latestJob.error ? <p className="sync-summary__job-error">{latestJob.error}</p> : null}
            </div>
          </div>
        </div>

        {sourceIssues.length ? (
          <div className="sync-summary__issues">
            <div className="sync-summary__issues-title">Проблемы по источникам</div>
            {sourceIssues.map((issue) => <SyncIssueDetails key={`${issue.source_id}:${issue.kind}`} issue={issue} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
