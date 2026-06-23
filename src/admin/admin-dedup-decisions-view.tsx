import { useEffect, useState, useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupDecision } from "../shared/live-data-context";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatDedupAction } from "./admin-formatters";
import { AdminDedupProductCard } from "./admin-dedup-product-card";

type Props = {
  dedupDecisions: DedupDecision[];
  loadingDedupDecisions: boolean;
  dedupDecisionsHasMore: boolean;
  loadingMoreDedupDecisions: boolean;
  dedupBusyPairKeys: Set<string>;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onUndoDecision: (decisionId: number) => Promise<void>;
  onLoadMore: () => Promise<void>;
};

export function AdminDedupDecisionsView({
  dedupDecisions,
  loadingDedupDecisions,
  dedupDecisionsHasMore,
  loadingMoreDedupDecisions,
  dedupBusyPairKeys,
  openProductCard,
  onUndoDecision,
  onLoadMore,
}: Props) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [autoLoadArmed, setAutoLoadArmed] = useState(false);

  useEffect(() => {
    const armAutoLoad = () => {
      if (window.scrollY > 0) {
        setAutoLoadArmed(true);
      }
    };
    window.addEventListener("scroll", armAutoLoad, { passive: true });
    return () => window.removeEventListener("scroll", armAutoLoad);
  }, []);

  useEffect(() => {
    if (!autoLoadArmed || !dedupDecisionsHasMore || loadingMoreDedupDecisions) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          void onLoadMore();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [autoLoadArmed, dedupDecisionsHasMore, loadingMoreDedupDecisions, onLoadMore]);

  return (
    <>
      {loadingDedupDecisions && dedupDecisions.length === 0 ? <AdminDedupSkeleton rows={3} /> : null}
      <div className="dedup-list">
        {dedupDecisions.map((decision) => {
          const members = Array.isArray(decision.members) ? decision.members : [];
          return (
            <div key={decision.pair_key} className="dedup-item">
              <div className="dedup-grid">
                {members.map((member) => (
                  <AdminDedupProductCard
                    key={`${decision.pair_key}-${member.id}`}
                    id={member.id}
                    title={member.title}
                    designerName={member.display_designer_name || member.designer_name || member.source_designer_name || null}
                    price={member.price}
                    currency={member.currency}
                    imageCount={member.image_count}
                    imageUrls={member.image_urls}
                    imageIds={member.image_ids}
                    url={member.url}
                    onOpen={openProductCard}
                  />
                ))}
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
                  disabled={dedupBusyPairKeys.has(`undo:${decision.id}`) || decision.can_undo === false}
                  title={decision.can_undo === false ? (decision.undo_blocked_reason || "Отмена недоступна") : undefined}
                  onClick={() => void onUndoDecision(decision.id)}
                >
                  Отменить решение
                </button>
              </div>
            </div>
          );
        })}
        {loadingDedupDecisions ? <AdminDedupSkeleton rows={1} /> : null}
        {!loadingDedupDecisions && dedupDecisionsHasMore ? <div ref={loadMoreRef} style={{ height: 1 }} /> : null}
        {loadingMoreDedupDecisions ? (
          <div className="actions">
            <span className="muted">Загрузка...</span>
          </div>
        ) : null}
        {!loadingDedupDecisions && !loadingMoreDedupDecisions && dedupDecisionsHasMore ? (
          <div className="actions">
            <button type="button" onClick={() => void onLoadMore()}>
              Показать еще
            </button>
          </div>
        ) : null}
        {!loadingDedupDecisions && dedupDecisions.length === 0 ? <EmptyState compact title="Решений пока нет" /> : null}
      </div>
    </>
  );
}
