import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupDecision } from "../shared/live-data-context";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatDedupAction } from "./admin-formatters";
import { AdminDedupProductCard } from "./admin-dedup-product-card";

type Props = {
  dedupDecisions: DedupDecision[];
  loadingDedupDecisions: boolean;
  dedupBusyPairKeys: Set<string>;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onUndoDecision: (pairKey: string) => Promise<void>;
};

export function AdminDedupDecisionsView({
  dedupDecisions,
  loadingDedupDecisions,
  dedupBusyPairKeys,
  openProductCard,
  onUndoDecision,
}: Props) {
  return (
    <>
      {loadingDedupDecisions && dedupDecisions.length === 0 ? <AdminDedupSkeleton rows={3} /> : null}
      <div className="dedup-list">
        {dedupDecisions.map((decision) => (
          <div key={decision.pair_key} className="dedup-item">
            <div className="dedup-grid">
              <AdminDedupProductCard
                id={decision.left.id}
                title={decision.left.title}
                vendor={decision.left.vendor}
                price={decision.left.price}
                currency={decision.left.currency}
                imageCount={decision.left.image_count}
                imageUrls={decision.left.image_urls}
                imageIds={decision.left.image_ids}
                url={decision.left.url}
                onOpen={openProductCard}
              />
              <AdminDedupProductCard
                id={decision.right.id}
                title={decision.right.title}
                vendor={decision.right.vendor}
                price={decision.right.price}
                currency={decision.right.currency}
                imageCount={decision.right.image_count}
                imageUrls={decision.right.image_urls}
                imageIds={decision.right.image_ids}
                url={decision.right.url}
                onOpen={openProductCard}
              />
            </div>
            <div className="dedup-reasons">
              <span className="muted dedup-reasons-label">Решение:</span>
              <span className="dedup-reason-pill">{formatDedupAction(decision.action)}</span>
              {decision.decided_at ? (
                <span className="muted dedup-reasons-label dedup-reasons-label--soft">{new Date(decision.decided_at).toLocaleString("ru-RU")}</span>
              ) : null}
            </div>
            <div className="actions dedup-actions">
              <button
                type="button"
                disabled={!decision.can_undo || dedupBusyPairKeys.has(decision.pair_key)}
                title={decision.undo_block_reason || "Отменить решение"}
                onClick={() => void onUndoDecision(decision.pair_key)}
              >
                Отменить решение
              </button>
            </div>
          </div>
        ))}
        {loadingDedupDecisions ? <AdminDedupSkeleton rows={1} /> : null}
        {!loadingDedupDecisions && dedupDecisions.length === 0 ? <EmptyState compact title="Решений пока нет" /> : null}
      </div>
    </>
  );
}
