import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupCandidate, DedupDecision, DedupScanStatus } from "../shared/live-data-types";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { AdminDedupCandidatesView } from "./admin-dedup-candidates-view";
import { AdminDedupDecisionsView } from "./admin-dedup-decisions-view";

type DedupMergeMode = "combine" | "keep_left" | "keep_right";

type Props = {
  dedupView: "candidates" | "decisions";
  setDedupView: (view: "candidates" | "decisions") => void;
  dedupScanStatus: DedupScanStatus;
  dedupCandidates: DedupCandidate[];
  dedupCandidatesTotal: number;
  loadingDedupCandidates: boolean;
  dedupCandidatesHasMore: boolean;
  loadingMoreDedupCandidates: boolean;
  dedupDecisions: DedupDecision[];
  dedupDecisionsTotal: number;
  loadingDedupDecisions: boolean;
  dedupDecisionsLoaded: boolean;
  dedupDecisionsHasMore: boolean;
  loadingMoreDedupDecisions: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onRunDedupScan: () => Promise<void>;
  onMergeProducts: (productIds: number[], mergeMode?: DedupMergeMode) => Promise<void>;
  onRejectProducts: (productIds: number[]) => Promise<void>;
  onUndoDecision: (decisionId: number) => Promise<void>;
  onLoadMoreCandidates: () => Promise<void>;
  onLoadMoreDecisions: () => Promise<void>;
};

export function AdminDedupTab({
  dedupView,
  setDedupView,
  dedupScanStatus,
  dedupCandidates,
  dedupCandidatesTotal,
  loadingDedupCandidates,
  dedupCandidatesHasMore,
  loadingMoreDedupCandidates,
  dedupDecisions,
  dedupDecisionsTotal,
  loadingDedupDecisions,
  dedupDecisionsLoaded,
  dedupDecisionsHasMore,
  loadingMoreDedupDecisions,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  onRunDedupScan,
  onMergeProducts,
  onRejectProducts,
  onUndoDecision,
  onLoadMoreCandidates,
  onLoadMoreDecisions,
}: Props) {
  const scanButtonLabel = dedupScanStatus.is_running ? "Поиск дубликатов..." : "Найти дубликаты";
  const lastRunAt = dedupScanStatus.started_at;
  const scanMeta = `Последний запуск: ${lastRunAt ? new Date(lastRunAt).toLocaleString("ru-RU") : "—"}`;
  return (
    <div className="card">
      <h2>Дедубликация</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="dedup-subtabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`tab ${dedupView === "candidates" ? "tab--active" : ""}`}
              onClick={() => setDedupView("candidates")}
            >
              {`Дубликаты (${dedupCandidatesTotal})`}
            </button>
            <button
              type="button"
              className={`tab ${dedupView === "decisions" ? "tab--active" : ""}`}
              onClick={() => setDedupView("decisions")}
            >
              {`Решения (${dedupDecisionsTotal})`}
            </button>
          </div>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button type="button" disabled={dedupScanStatus.is_running} onClick={() => void onRunDedupScan()}>
              {scanButtonLabel}
            </button>
          </div>
          <div className="muted" style={{ textAlign: "center" }}>{scanMeta}</div>
        </div>
      </div>
      {dedupView === "candidates" ? (
        <AdminDedupCandidatesView
          dedupCandidates={dedupCandidates}
          loadingDedupCandidates={loadingDedupCandidates}
          dedupCandidatesHasMore={dedupCandidatesHasMore}
          loadingMoreDedupCandidates={loadingMoreDedupCandidates}
          dedupBusyPairKeys={dedupBusyPairKeys}
          dedupChoosingPairKey={dedupChoosingPairKey}
          setDedupChoosingPairKey={setDedupChoosingPairKey}
          openProductCard={openProductCard}
          onMergeProducts={onMergeProducts}
          onRejectProducts={onRejectProducts}
          onLoadMore={onLoadMoreCandidates}
        />
      ) : (
        <AdminDedupDecisionsView
          dedupDecisions={dedupDecisions}
          loadingDedupDecisions={loadingDedupDecisions}
          dedupDecisionsHasMore={dedupDecisionsHasMore}
          loadingMoreDedupDecisions={loadingMoreDedupDecisions}
          dedupBusyPairKeys={dedupBusyPairKeys}
          openProductCard={openProductCard}
          onUndoDecision={onUndoDecision}
          onLoadMore={onLoadMoreDecisions}
        />
      )}
    </div>
  );
}
