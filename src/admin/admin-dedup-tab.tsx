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
  dedupDecisions: DedupDecision[];
  loadingDedupDecisions: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onCombinePair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
  onMergePair: (pairKey: string, primaryId: number, duplicateId: number) => Promise<void>;
  onRejectPair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
  onUndoDecision: (pairKey: string) => Promise<void>;
};

export function AdminDedupTab({
  dedupView,
  setDedupView,
  dedupCandidates,
  loadingDedupCandidates,
  dedupDecisions,
  loadingDedupDecisions,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  onCombinePair,
  onMergePair,
  onRejectPair,
  onUndoDecision,
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
          dedupBusyPairKeys={dedupBusyPairKeys}
          dedupChoosingPairKey={dedupChoosingPairKey}
          setDedupChoosingPairKey={setDedupChoosingPairKey}
          openProductCard={openProductCard}
          onCombinePair={onCombinePair}
          onMergePair={onMergePair}
          onRejectPair={onRejectPair}
        />
      ) : (
        <AdminDedupDecisionsView
          dedupDecisions={dedupDecisions}
          loadingDedupDecisions={loadingDedupDecisions}
          dedupBusyPairKeys={dedupBusyPairKeys}
          openProductCard={openProductCard}
          onUndoDecision={onUndoDecision}
        />
      )}
    </div>
  );
}
