import { useCallback, type Dispatch, type SetStateAction } from "react";
import { API_BASE } from "../admin-auth";
import { errResult, okResult } from "../action-result";
import { apiJson, apiNoContent } from "../api-client";
import { normalizeServiceProduct } from "../live-product-normalizer";
import type { DedupCandidate, DedupDecision } from "../live-data-types";

export function useLiveDataCategoryDedupActions(params: {
  refreshAfterDedupMutation: () => Promise<void>;
  refreshDedupOnly: () => Promise<void>;
  refreshDedupStatusOnly: () => Promise<void>;
  setDedupDecisions: Dispatch<SetStateAction<DedupDecision[]>>;
}) {
  const { refreshAfterDedupMutation, refreshDedupOnly, refreshDedupStatusOnly, setDedupDecisions } = params;

  const runDedupScan = useCallback(async () => {
    try {
      await apiNoContent(`${API_BASE}/dedup/scan`, {
        method: "POST",
      });
      await Promise.all([refreshDedupStatusOnly(), refreshDedupOnly()]);
      return okResult("Поиск дубликатов запущен");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshDedupOnly, refreshDedupStatusOnly]);

  const mergeDedupProducts = useCallback(async (payload: {
    product_ids: number[];
    primary_product_id?: number | null;
    primary_listing_id?: number | null;
    merge_mode?: "combine" | "keep_left" | "keep_right" | null;
  }) => {
    try {
      const result = await apiJson<{
        created_product_id: number;
        created_product?: unknown;
        related_candidates?: DedupCandidate[];
      }>(`${API_BASE}/dedup/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      void refreshAfterDedupMutation();
      return {
        ...okResult("ok"),
        createdProductId: result.created_product_id,
        createdProduct: result.created_product ? normalizeServiceProduct(result.created_product as never) : undefined,
        relatedCandidates: (result.related_candidates || []).map((candidate) => ({
          ...candidate,
          left: normalizeServiceProduct(candidate.left as never),
          right: normalizeServiceProduct(candidate.right as never),
        })),
      };
    } catch (e) {
      void refreshDedupOnly();
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation, refreshDedupOnly]);

  const rejectDedupProducts = useCallback(async (productIds: number[]) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds }),
      });
      void refreshAfterDedupMutation();
      return okResult("ok");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation]);

  const undoDedupDecision = useCallback(async (decisionId: number) => {
    try {
      await apiNoContent(`${API_BASE}/dedup/decisions/${decisionId}/undo`, {
        method: "POST",
      });
      setDedupDecisions((previous) => previous.filter((decision) => Number(decision.id) !== Number(decisionId)));
      void refreshAfterDedupMutation();
      return okResult("ok");
    } catch (e) {
      return errResult(e instanceof Error ? e.message : "Unknown error");
    }
  }, [refreshAfterDedupMutation, setDedupDecisions]);

  return {
    runDedupScan,
    mergeDedupProducts,
    rejectDedupProducts,
    undoDedupDecision,
  };
}
