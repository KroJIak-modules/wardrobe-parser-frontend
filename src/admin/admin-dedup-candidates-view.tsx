import { useEffect, useState, useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupCandidate } from "../shared/live-data-context";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatDedupReason } from "./admin-formatters";
import { AdminDedupProductCard } from "./admin-dedup-product-card";

type DedupMergeMode = "combine" | "keep_left" | "keep_right";

type Props = {
  dedupCandidates: DedupCandidate[];
  loadingDedupCandidates: boolean;
  dedupCandidatesHasMore: boolean;
  loadingMoreDedupCandidates: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onMergeProducts: (productIds: number[], mergeMode?: DedupMergeMode) => Promise<void>;
  onRejectProducts: (productIds: number[]) => Promise<void>;
  onLoadMore: () => Promise<void>;
};

export function AdminDedupCandidatesView({
  dedupCandidates,
  loadingDedupCandidates,
  dedupCandidatesHasMore,
  loadingMoreDedupCandidates,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  onMergeProducts,
  onRejectProducts,
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
    if (!autoLoadArmed || !dedupCandidatesHasMore || loadingMoreDedupCandidates) return;
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
  }, [autoLoadArmed, dedupCandidatesHasMore, loadingMoreDedupCandidates, onLoadMore]);

  return (
    <>
      {loadingDedupCandidates && dedupCandidates.length === 0 ? <AdminDedupSkeleton rows={3} /> : null}
      <div className="dedup-list">
        {dedupCandidates.map((candidate) => (
          <div key={candidate.pair_key} className="dedup-item">
            <div className="dedup-grid">
              <AdminDedupProductCard
                id={candidate.left.id}
                title={candidate.left.title}
                designerName={candidate.left.display_designer_name || candidate.left.designer_name || candidate.left.source_designer_name || null}
                priceSummary={candidate.left.price_summary}
                imageCount={candidate.left.image_count}
                imageUrls={candidate.left.image_urls}
                imageIds={candidate.left.image_ids}
                url={candidate.left.url}
                onOpen={openProductCard}
              />
              <AdminDedupProductCard
                id={candidate.right.id}
                title={candidate.right.title}
                designerName={candidate.right.display_designer_name || candidate.right.designer_name || candidate.right.source_designer_name || null}
                priceSummary={candidate.right.price_summary}
                imageCount={candidate.right.image_count}
                imageUrls={candidate.right.image_urls}
                imageIds={candidate.right.image_ids}
                url={candidate.right.url}
                onOpen={openProductCard}
              />
            </div>

            <div className="dedup-reasons">
              <span className="muted dedup-reasons-label">Совпадение по:</span>
              {(candidate.reasons.length > 0 ? candidate.reasons : ["auto_match"]).map((reason) => (
                <span key={`${candidate.pair_key}-${reason}`} className="dedup-reason-pill">
                  {formatDedupReason(reason)}
                </span>
              ))}
            </div>

            <div className="actions dedup-actions dedup-actions--stack">
              <button
                type="button"
                disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                onClick={() => void onMergeProducts([candidate.left.id, candidate.right.id], "combine")}
              >
                Соединить
              </button>
              {dedupChoosingPairKey === candidate.pair_key ? (
                <div className="dedup-actions-row">
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onMergeProducts([candidate.left.id, candidate.right.id], "keep_left")}
                  >
                    Оставить левый
                  </button>
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onMergeProducts([candidate.left.id, candidate.right.id], "keep_right")}
                  >
                    Оставить правый
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                  onClick={() => setDedupChoosingPairKey((prev) => (prev === candidate.pair_key ? null : candidate.pair_key))}
                >
                  Оставить только один
                </button>
              )}
              <button
                type="button"
                disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                onClick={() => void onRejectProducts([candidate.left.id, candidate.right.id])}
              >
                Не дубль
              </button>
            </div>
          </div>
        ))}
        {loadingDedupCandidates ? <AdminDedupSkeleton rows={1} /> : null}
        {!loadingDedupCandidates && dedupCandidatesHasMore ? <div ref={loadMoreRef} style={{ height: 1 }} /> : null}
        {loadingMoreDedupCandidates ? (
          <div className="actions">
            <span className="muted">Загрузка...</span>
          </div>
        ) : null}
        {!loadingDedupCandidates && !loadingMoreDedupCandidates && dedupCandidatesHasMore ? (
          <div className="actions">
            <button type="button" onClick={() => void onLoadMore()}>
              Показать еще
            </button>
          </div>
        ) : null}
        {!loadingDedupCandidates && dedupCandidates.length === 0 ? <EmptyState compact title="Дубликатов пока нет" /> : null}
      </div>
    </>
  );
}
