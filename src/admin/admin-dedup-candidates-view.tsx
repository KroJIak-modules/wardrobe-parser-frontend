import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { DedupCandidate, ServiceProduct } from "../shared/live-data-types";
import { AdminDedupSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import { formatDedupReason } from "./admin-formatters";
import { Merge, CopyMinus, Ban, Info, X } from "lucide-react";
import "./admin-dedup-actions.css";
import { AdminDedupProductCard } from "./admin-dedup-product-card";

type DedupMergeMode = "combine" | "keep_left" | "keep_right";

type PairResolution =
  | { kind: "combine"; product: ServiceProduct | null }
  | { kind: "keep"; keptProductId: number }
  | { kind: "reject" };

type ResolvedPair = {
  candidate: DedupCandidate;
  resolution: PairResolution;
};

type Props = {
  dedupCandidates: DedupCandidate[];
  dedupScanResetKey: string;
  loadingDedupCandidates: boolean;
  dedupCandidatesHasMore: boolean;
  loadingMoreDedupCandidates: boolean;
  dedupBusyPairKeys: Set<string>;
  dedupChoosingPairKey: string | null;
  setDedupChoosingPairKey: (key: string | null | ((prev: string | null) => string | null)) => void;
  openProductCard: (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>, productId: number) => void;
  getProductById: (id: number, opts?: { forceFetch?: boolean }) => Promise<ServiceProduct | null>;
  onMergeProducts: (productIds: number[], mergeMode?: DedupMergeMode, primaryProductId?: number) => Promise<{
    ok: boolean;
    createdProductId?: number;
    createdProduct?: ServiceProduct;
    relatedCandidates?: DedupCandidate[];
  } | undefined>;
  onRejectProducts: (productIds: number[]) => Promise<{ ok: boolean } | undefined>;
  onLoadMore: () => Promise<void>;
};

function isProductDisabled(resolution: PairResolution | undefined, productId: number): boolean {
  if (!resolution) {
    return false;
  }
  if (resolution.kind === "keep") {
    return resolution.keptProductId !== productId;
  }
  return true;
}

export function AdminDedupCandidatesView({
  dedupCandidates,
  dedupScanResetKey,
  loadingDedupCandidates,
  dedupCandidatesHasMore,
  loadingMoreDedupCandidates,
  dedupBusyPairKeys,
  dedupChoosingPairKey,
  setDedupChoosingPairKey,
  openProductCard,
  getProductById,
  onMergeProducts,
  onRejectProducts,
  onLoadMore,
}: Props) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const candidateOrderRef = useRef<string[]>(dedupCandidates.map((candidate) => candidate.pair_key));
  const [autoLoadArmed, setAutoLoadArmed] = useState(false);
  const [resolvedPairs, setResolvedPairs] = useState<Record<string, ResolvedPair>>({});
  const [staleProductIds, setStaleProductIds] = useState<Set<number>>(new Set());
  const [recomputedCandidates, setRecomputedCandidates] = useState<DedupCandidate[]>([]);
  const [combiningPairKey, setCombiningPairKey] = useState<string | null>(null);

  useEffect(() => {
    setResolvedPairs({});
    setStaleProductIds(new Set());
    setRecomputedCandidates([]);
    setCombiningPairKey(null);
    candidateOrderRef.current = [];
  }, [dedupScanResetKey]);

  useEffect(() => {
    const known = new Set(candidateOrderRef.current);
    for (const candidate of [...dedupCandidates, ...recomputedCandidates]) {
      if (!known.has(candidate.pair_key)) {
        candidateOrderRef.current.push(candidate.pair_key);
        known.add(candidate.pair_key);
      }
    }
  }, [dedupCandidates, recomputedCandidates]);

  const candidateByPair = new Map<string, DedupCandidate>();
  for (const candidate of dedupCandidates) {
    candidateByPair.set(candidate.pair_key, candidate);
  }
  for (const candidate of recomputedCandidates) {
    candidateByPair.set(candidate.pair_key, candidate);
  }
  const visibleCandidates = candidateOrderRef.current
    .map((pairKey) => resolvedPairs[pairKey]?.candidate || candidateByPair.get(pairKey))
    .filter((candidate): candidate is DedupCandidate => Boolean(candidate))
    .filter((candidate) => (
      Boolean(resolvedPairs[candidate.pair_key])
      || ![candidate.left.id, candidate.right.id].some((id) => staleProductIds.has(Number(id)))
    ));

  const setPairResolution = (candidate: DedupCandidate, resolution: PairResolution) => {
    setResolvedPairs((current) => ({
      ...current,
      [candidate.pair_key]: { candidate, resolution },
    }));
  };

  const handleCombine = async (candidate: DedupCandidate, primaryProductId: number) => {
    setDedupChoosingPairKey(null);
    setStaleProductIds((current) => new Set([...current, candidate.left.id, candidate.right.id]));
    setPairResolution(candidate, { kind: "combine", product: null });

    setCombiningPairKey(null);
    const result = await onMergeProducts([candidate.left.id, candidate.right.id], "combine", primaryProductId);
    if (!result?.ok || !result.createdProductId) {
      setResolvedPairs((current) => {
        const next = { ...current };
        delete next[candidate.pair_key];
        return next;
      });
      setStaleProductIds((current) => {
        const next = new Set(current);
        next.delete(candidate.left.id);
        next.delete(candidate.right.id);
        return next;
      });
      return;
    }

    setRecomputedCandidates(result.relatedCandidates || []);
    setPairResolution(candidate, { kind: "combine", product: result.createdProduct || null });
    const product = result.createdProduct || await getProductById(result.createdProductId, { forceFetch: true });
    setResolvedPairs((current) => {
      const currentPair = current[candidate.pair_key];
      if (!currentPair || currentPair.resolution.kind !== "combine") {
        return current;
      }
      return {
        ...current,
        [candidate.pair_key]: {
          ...currentPair,
          resolution: { kind: "combine", product },
        },
      };
    });
  };

  const handleKeep = async (
    candidate: DedupCandidate,
    keptProductId: number,
    mode: "keep_left" | "keep_right",
  ) => {
    const result = await onMergeProducts([candidate.left.id, candidate.right.id], mode);
    if (result?.ok) {
      setDedupChoosingPairKey(null);
      setPairResolution(candidate, { kind: "keep", keptProductId });
    }
  };

  const handleReject = async (candidate: DedupCandidate) => {
    const result = await onRejectProducts([candidate.left.id, candidate.right.id]);
    if (result?.ok) {
      setDedupChoosingPairKey(null);
      setPairResolution(candidate, { kind: "reject" });
    }
  };

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
        if (entries[0]?.isIntersecting) {
          void onLoadMore();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [autoLoadArmed, dedupCandidatesHasMore, loadingMoreDedupCandidates, onLoadMore]);

  return (
    <>
      {loadingDedupCandidates && visibleCandidates.length === 0 ? <AdminDedupSkeleton rows={3} /> : null}
      <div className="dedup-legend" aria-label="Описание действий">
        <Info size={18} aria-label="Как работают действия" />
        <div className="dedup-legend__icons">
          <span className="dedup-tooltip" tabIndex={0} aria-label="Соединить: объединяет товары в одну карточку. Например, две одинаковые модели из разных источников станут одним товаром.">
            <Merge size={20} />
            <span className="dedup-tooltip__content" role="tooltip">Соединить: объединяет товары в одну карточку. Например, две одинаковые модели из разных источников станут одним товаром.</span>
          </span>
          <span className="dedup-tooltip" tabIndex={0} aria-label="Оставить один: выберите левый или правый товар; второй будет скрыт. Например, когда одна карточка заполнена точнее.">
            <CopyMinus size={20} />
            <span className="dedup-tooltip__content" role="tooltip">Оставить один: выберите левый или правый товар; второй будет скрыт. Например, когда одна карточка заполнена точнее.</span>
          </span>
          <span className="dedup-tooltip" tabIndex={0} aria-label="Не дубль: помечает пару как разные товары. Например, похожие модели обуви больше не будут предложены как дубликаты.">
            <Ban size={20} />
            <span className="dedup-tooltip__content" role="tooltip">Не дубль: помечает пару как разные товары; например, похожие модели обуви больше не будут предложены как дубликаты.</span>
          </span>
        </div>
      </div>
      <div className="dedup-list">
        {visibleCandidates.map((candidate) => {
          const pairResolution = resolvedPairs[candidate.pair_key]?.resolution;
          const pairBusy = dedupBusyPairKeys.has(`merge:${candidate.left.id},${candidate.right.id}`)
            || dedupBusyPairKeys.has(`reject:${candidate.left.id},${candidate.right.id}`);
          const choosing = dedupChoosingPairKey === candidate.pair_key;
          const combining = combiningPairKey === candidate.pair_key;
          const combinedProduct = pairResolution?.kind === "combine" ? pairResolution.product : null;

          return (
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
                  disabled={isProductDisabled(pairResolution, candidate.left.id)}
                  chooseAction={!pairResolution && choosing ? {
                    label: "Оставить левый товар",
                    direction: "left",
                    busy: pairBusy,
                    onChoose: () => void handleKeep(candidate, candidate.left.id, "keep_left"),
                  } : !pairResolution && combining ? {
                    label: "Сделать левый товар основой объединения",
                    direction: "left",
                    busy: pairBusy,
                    onChoose: () => void handleCombine(candidate, candidate.left.id),
                  } : undefined}
                />
                {!pairResolution && !combining ? (
                  <div className="dedup-pair-actions">
                    {choosing ? (
                      <button type="button" data-tooltip="Отменить выбор основы" aria-label="Отменить выбор основы" disabled={pairBusy} onClick={() => setDedupChoosingPairKey(null)}>
                        <X size={20} />
                      </button>
                    ) : (
                      <>
                        <button type="button" data-tooltip="Соединить товары" aria-label="Соединить товары" disabled={pairBusy} onClick={() => setCombiningPairKey(candidate.pair_key)}>
                          <Merge size={20} />
                        </button>
                        <button type="button" data-tooltip="Оставить только один товар" aria-label="Оставить только один товар" disabled={pairBusy} onClick={() => setDedupChoosingPairKey(candidate.pair_key)}>
                          <CopyMinus size={20} />
                        </button>
                        <button type="button" data-tooltip="Это разные товары" aria-label="Это разные товары" disabled={pairBusy} onClick={() => void handleReject(candidate)}>
                          <Ban size={20} />
                        </button>
                      </>
                    )}
                  </div>
                ) : !pairResolution && combining ? (
                  <div className="dedup-pair-actions">
                    <button type="button" data-tooltip="Отменить выбор основы" aria-label="Отменить выбор основы" disabled={pairBusy} onClick={() => setCombiningPairKey(null)}>
                      <X size={20} />
                    </button>
                  </div>
                ) : null}
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
                  disabled={isProductDisabled(pairResolution, candidate.right.id)}
                  chooseAction={!pairResolution && choosing ? {
                    label: "Оставить правый товар",
                    direction: "right",
                    busy: pairBusy,
                    onChoose: () => void handleKeep(candidate, candidate.right.id, "keep_right"),
                  } : !pairResolution && combining ? {
                    label: "Сделать правый товар основой объединения",
                    direction: "right",
                    busy: pairBusy,
                    onChoose: () => void handleCombine(candidate, candidate.right.id),
                  } : undefined}
                />
                {pairResolution?.kind === "combine" && combinedProduct ? (
                  <div className="dedup-merged-card">
                    <AdminDedupProductCard
                      id={combinedProduct.id}
                      title={combinedProduct.title}
                      designerName={combinedProduct.display_designer_name || combinedProduct.designer_name || combinedProduct.source_designer_name || null}
                      priceSummary={combinedProduct.price_summary}
                      imageCount={combinedProduct.image_count}
                      imageUrls={combinedProduct.image_urls}
                      imageIds={combinedProduct.image_ids || []}
                      url={combinedProduct.url || ""}
                      onOpen={openProductCard}
                    />
                  </div>
                ) : null}
              </div>

              <div className="dedup-reasons">
                <span className="muted dedup-reasons-label">Совпадение по:</span>
                {(candidate.reasons.length > 0 ? candidate.reasons : ["auto_match"]).map((reason) => (
                  <span key={`${candidate.pair_key}-${reason}`} className="dedup-reason-pill">
                    {formatDedupReason(reason)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {loadingDedupCandidates && visibleCandidates.length > 0 ? <AdminDedupSkeleton rows={1} /> : null}
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
        {!loadingDedupCandidates && !loadingMoreDedupCandidates && visibleCandidates.length === 0 ? <EmptyState compact title="Дубликатов пока нет" /> : null}
      </div>
    </>
  );
}
