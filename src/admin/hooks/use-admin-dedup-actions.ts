import { useState } from "react";

type ResultMessage = { ok: boolean; message: string };

type UseAdminDedupActionsParams = {
  mergeDedupPair: (primaryId: number, duplicateId: number) => Promise<ResultMessage>;
  rejectDedupPair: (leftId: number, rightId: number) => Promise<ResultMessage>;
  combineDedupPair: (leftId: number, rightId: number) => Promise<ResultMessage>;
  undoDedupDecision: (pairKey: string) => Promise<ResultMessage>;
  pushToast: (message: string) => void;
};

export function useAdminDedupActions(params: UseAdminDedupActionsParams) {
  const { mergeDedupPair, rejectDedupPair, combineDedupPair, undoDedupDecision, pushToast } = params;

  const [dedupChoosingPairKey, setDedupChoosingPairKey] = useState<string | null>(null);
  const [dedupBusyPairKeys, setDedupBusyPairKeys] = useState<Set<string>>(new Set());
  const [dedupView, setDedupView] = useState<"candidates" | "decisions">("candidates");

  const withDedupBusy = async (pairKey: string, task: () => Promise<ResultMessage>) => {
    setDedupBusyPairKeys((previous) => new Set(previous).add(pairKey));
    try {
      const result = await task();
      if (result.ok) {
        setDedupChoosingPairKey((previous) => (previous === pairKey ? null : previous));
      }
      pushToast(result.message);
    } finally {
      setDedupBusyPairKeys((previous) => {
        const next = new Set(previous);
        next.delete(pairKey);
        return next;
      });
    }
  };

  const onMergePair = async (pairKey: string, primaryId: number, duplicateId: number) => {
    await withDedupBusy(pairKey, () => mergeDedupPair(primaryId, duplicateId));
  };

  const onRejectPair = async (pairKey: string, leftId: number, rightId: number) => {
    await withDedupBusy(pairKey, () => rejectDedupPair(leftId, rightId));
  };

  const onCombinePair = async (pairKey: string, leftId: number, rightId: number) => {
    await withDedupBusy(pairKey, () => combineDedupPair(leftId, rightId));
  };

  const onUndoDecision = async (pairKey: string) => {
    await withDedupBusy(pairKey, () => undoDedupDecision(pairKey));
  };

  return {
    dedupChoosingPairKey,
    setDedupChoosingPairKey,
    dedupBusyPairKeys,
    dedupView,
    setDedupView,
    onMergePair,
    onRejectPair,
    onCombinePair,
    onUndoDecision,
  };
}
