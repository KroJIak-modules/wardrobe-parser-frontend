import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupCandidate } from "../shared/live-data-context";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { formatDedupReason } from "./admin-formatters";
import { AdminDedupProductCard } from "./admin-dedup-product-card";

type Props = {
  dedupCandidates: DedupCandidate[];
  loadingDedupCandidates: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  onCombinePair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
  onMergePair: (pairKey: string, primaryId: number, duplicateId: number) => Promise<void>;
  onRejectPair: (pairKey: string, leftId: number, rightId: number) => Promise<void>;
};

export function AdminDedupCandidatesView({
  dedupCandidates,
  loadingDedupCandidates,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  onCombinePair,
  onMergePair,
  onRejectPair,
}: Props) {
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
                vendor={candidate.left.vendor}
                price={candidate.left.price}
                currency={candidate.left.currency}
                imageCount={candidate.left.image_count}
                imageUrls={candidate.left.image_urls}
                imageIds={candidate.left.image_ids}
                url={candidate.left.url}
                onOpen={openProductCard}
              />
              <AdminDedupProductCard
                id={candidate.right.id}
                title={candidate.right.title}
                vendor={candidate.right.vendor}
                price={candidate.right.price}
                currency={candidate.right.currency}
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
                onClick={() => void onCombinePair(candidate.pair_key, candidate.left.id, candidate.right.id)}
              >
                Соединить дубликаты
              </button>
              {dedupChoosingPairKey === candidate.pair_key ? (
                <div className="dedup-actions-row">
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onMergePair(candidate.pair_key, candidate.left.id, candidate.right.id)}
                  >
                    Оставить левый
                  </button>
                  <button
                    type="button"
                    disabled={dedupBusyPairKeys.has(candidate.pair_key)}
                    onClick={() => void onMergePair(candidate.pair_key, candidate.right.id, candidate.left.id)}
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
                onClick={() => void onRejectPair(candidate.pair_key, candidate.left.id, candidate.right.id)}
              >
                Не дубль
              </button>
            </div>
          </div>
        ))}
        {loadingDedupCandidates ? <AdminDedupSkeleton rows={1} /> : null}
        {!loadingDedupCandidates && dedupCandidates.length === 0 ? <p className="muted">Кандидатов нет</p> : null}
      </div>
    </>
  );
}
