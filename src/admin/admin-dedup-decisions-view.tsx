import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupDecision, ServiceProduct } from "../shared/live-data-types";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatDedupAction } from "./admin-formatters";
import { AdminDedupProductCard } from "./admin-dedup-product-card";
import "./admin-dedup-actions.css";

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

function isDisabledMember(action: string, members: ServiceProduct[], productId: number): boolean {
  const normalizedAction = String(action || "").trim().toLowerCase();
  if (normalizedAction === "combine" || normalizedAction === "reject") {
    return true;
  }
  if (normalizedAction === "keep_left") {
    return members.length > 0 && productId !== members[0].id;
  }
  if (normalizedAction === "keep_right") {
    return members.length > 0 && productId !== members[members.length - 1].id;
  }
  return false;
}

function ProductCard({
  product,
  disabled,
  onOpen,
}: {
  product: ServiceProduct;
  disabled?: boolean;
  onOpen: Props["openProductCard"];
}) {
  return (
    <AdminDedupProductCard
      id={product.id}
      title={product.title}
      designerName={product.display_designer_name || product.designer_name || product.source_designer_name || null}
      priceSummary={product.price_summary}
      imageCount={product.image_count}
      imageUrls={product.image_urls}
      imageIds={product.image_ids || []}
      url={product.url}
      onOpen={onOpen}
      disabled={disabled}
    />
  );
}

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
      if (window.scrollY > 0) setAutoLoadArmed(true);
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
        if (entries[0]?.isIntersecting) void onLoadMore();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 },
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
          const action = String(decision.action || "").trim().toLowerCase();
          return (
            <div key={decision.pair_key} className="dedup-item">
              <div className="dedup-grid">
                {members.map((member) => (
                  <ProductCard
                    key={`${decision.pair_key}-${member.id}`}
                    product={member}
                    disabled={isDisabledMember(action, members, member.id)}
                    onOpen={openProductCard}
                  />
                ))}
                {action === "combine" && decision.created_product ? (
                  <div className="dedup-merged-card">
                    <ProductCard product={decision.created_product} onOpen={openProductCard} />
                  </div>
                ) : null}
              </div>
              <div className="dedup-reasons">
                <span className="muted dedup-reasons-label">Решение:</span>
                <span className="dedup-reason-pill">{formatDedupAction(decision.action)}</span>
                {decision.decided_at ? (
                  <span className="muted dedup-reasons-label dedup-reasons-label--soft">
                    {new Date(decision.decided_at).toLocaleString("ru-RU")}
                  </span>
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
        {loadingDedupDecisions && dedupDecisions.length > 0 ? <AdminDedupSkeleton rows={1} /> : null}
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
        {!loadingDedupDecisions && !loadingMoreDedupDecisions && dedupDecisions.length === 0 ? (
          <EmptyState compact title="Решений пока нет" />
        ) : null}
      </div>
    </>
  );
}
