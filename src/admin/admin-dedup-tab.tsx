import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupCandidate, DedupDecision } from "../shared/live-data-context";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { AdminDedupCandidatesView } from "./admin-dedup-candidates-view";
import { AdminDedupDecisionsView } from "./admin-dedup-decisions-view";

type Props = {
  dedupView: "candidates" | "decisions";
  setDedupView: (view: "candidates" | "decisions") => void;
  dedupCandidates: DedupCandidate[];
  loadingDedupCandidates: boolean;
  dedupCandidatesHasMore: boolean;
  loadingMoreDedupCandidates: boolean;
  dedupDecisions: DedupDecision[];
  loadingDedupDecisions: boolean;
  dedupDecisionsHasMore: boolean;
  loadingMoreDedupDecisions: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onCombinePair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
  onMergePair: (pairKey: string, primaryId: number, duplicateId: number) => Promise<void>;
  onRejectPair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
  onUndoDecision: (pairKey: string) => Promise<void>;
  onLoadMoreCandidates: () => Promise<void>;
  onLoadMoreDecisions: () => Promise<void>;
};

export function AdminDedupTab({
  dedupView,
  setDedupView,
  dedupCandidates,
  loadingDedupCandidates,
  dedupCandidatesHasMore,
  loadingMoreDedupCandidates,
  dedupDecisions,
  loadingDedupDecisions,
  dedupDecisionsHasMore,
  loadingMoreDedupDecisions,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  onCombinePair,
  onMergePair,
  onRejectPair,
  onUndoDecision,
  onLoadMoreCandidates,
  onLoadMoreDecisions,
}: Props) {
  return (
    <div className="card">
      <h2>Дедубликация</h2>
      <div className="dedup-subtabs">
        <button
          type="button"
          className={`tab ${dedupView === "candidates" ? "tab--active" : ""}`}
          onClick={() => setDedupView("candidates")}
        >
          {`Дубликаты (${dedupCandidates.length})`}
        </button>
        <button
          type="button"
          className={`tab ${dedupView === "decisions" ? "tab--active" : ""}`}
          onClick={() => setDedupView("decisions")}
        >
          {`Решения (${dedupDecisions.length})`}
        </button>
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
          onCombinePair={onCombinePair}
          onMergePair={onMergePair}
          onRejectPair={onRejectPair}
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
