import { useState } from "react";

type ResultMessage = { ok: boolean; message: string };
type MergeMode = "combine" | "keep_left" | "keep_right";

type MergePayload = {
  product_ids: number[];
  primary_product_id?: number | null;
  primary_listing_id?: number | null;
  merge_mode?: MergeMode | null;
};

type UseAdminDedupActionsParams = {
  mergeDedupProducts: (payload: MergePayload) => Promise<ResultMessage>;
  rejectDedupProducts: (productIds: number[]) => Promise<ResultMessage>;
  undoDedupDecision: (decisionId: number) => Promise<ResultMessage>;
  pushToast: (message: string) => void;
};

function normalizeProductIds(productIds: number[]): number[] {
  return Array.from(new Set(productIds.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)));
}

export function useAdminDedupActions(params: UseAdminDedupActionsParams) {
  const { mergeDedupProducts, rejectDedupProducts, undoDedupDecision, pushToast } = params;

  const [dedupChoosingPairKey, setDedupChoosingPairKey] = useState<string | null>(null);
  const [dedupBusyPairKeys, setDedupBusyPairKeys] = useState<Set<string>>(new Set());
  const [dedupView, setDedupView] = useState<"candidates" | "decisions">("candidates");

  const withDedupBusy = async (pairKey: string, task: () => Promise<ResultMessage>, successMessage?: string) => {
    setDedupBusyPairKeys((previous) => new Set(previous).add(pairKey));
    try {
      const result = await task();
      if (result.ok) {
        setDedupChoosingPairKey((previous) => (previous === pairKey ? null : previous));
      }
      pushToast(result.ok && successMessage ? successMessage : result.message);
      return result;
    } finally {
      setDedupBusyPairKeys((previous) => {
        const next = new Set(previous);
        next.delete(pairKey);
        return next;
      });
    }
  };

  const onMergeProducts = async (productIds: number[], mergeMode: MergeMode = "combine") => {
    const normalizedIds = normalizeProductIds(productIds);
    if (normalizedIds.length < 2) {
      pushToast("Для объединения выбери минимум два товара");
      return;
    }
    const pairKey = `merge:${normalizedIds.join(",")}`;
    const payload: MergePayload = {
      product_ids: normalizedIds,
      merge_mode: mergeMode,
    };
    if (mergeMode === "keep_left") {
      payload.primary_product_id = normalizedIds[0];
    } else if (mergeMode === "keep_right") {
      payload.primary_product_id = normalizedIds[normalizedIds.length - 1];
    }
    const successMessage =
      mergeMode === "combine"
        ? "Товары соединены"
        : mergeMode === "keep_left"
          ? "Оставлен левый товар"
          : "Оставлен правый товар";
    const result = await withDedupBusy(pairKey, () => mergeDedupProducts(payload), successMessage);
    void result;
  };

  const onRejectProducts = async (productIds: number[]) => {
    const normalizedIds = normalizeProductIds(productIds);
    if (normalizedIds.length < 2) {
      pushToast("Для отклонения нужно минимум два товара");
      return;
    }
    const pairKey = `reject:${normalizedIds.join(",")}`;
    await withDedupBusy(pairKey, () => rejectDedupProducts(normalizedIds), "Пара помечена как не дубль");
  };

  const onUndoDecision = async (decisionId: number) => {
    const normalizedId = Number(decisionId);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
      pushToast("Решение не найдено");
      return;
    }
    await withDedupBusy(`undo:${normalizedId}`, () => undoDedupDecision(normalizedId), "Решение отменено");
  };

  return {
    dedupChoosingPairKey,
    setDedupChoosingPairKey,
    dedupBusyPairKeys,
    dedupView,
    setDedupView,
    onMergeProducts,
    onRejectProducts,
    onUndoDecision,
  };
}
