import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconClose, IconPlus } from "../shared/mono-icons";
import { SHOWCASE_CAROUSEL_LIMIT } from "./admin-showcase-constants";
import type { ShowcaseMediaAsset, ShowcaseMediaState, ShowcaseViewportKey } from "./admin-showcase-media-types";
import "./admin-showcase-media-section.css";

function toShowcaseMediaUrl(assetId: number): string {
  return `/api/v1/showcase/media/${assetId}/file`;
}

function formatBytes(byteSize: number): string {
  if (byteSize >= 1024 * 1024) {
    return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (byteSize >= 1024) {
    return `${Math.round(byteSize / 1024)} KB`;
  }
  return `${byteSize} B`;
}

function formatMimeLabel(asset: ShowcaseMediaAsset): string {
  const rawMime = String(asset.mimeType || "").trim().toLowerCase();
  if (rawMime === "image/svg+xml") {
    return "SVG";
  }
  if (rawMime === "image/gif") {
    return "GIF";
  }
  if (rawMime === "video/quicktime") {
    return "MOV";
  }
  if (rawMime.includes("/")) {
    return rawMime.split("/")[1].toUpperCase();
  }
  return asset.mediaKind === "video" ? "VIDEO" : "IMAGE";
}

function renderMediaPreview(asset: ShowcaseMediaAsset, { label }: { label: string }) {
  if (asset.mediaKind === "video") {
    return (
      <video
        className="showcase-media-editor__preview-media"
        src={toShowcaseMediaUrl(asset.id)}
        aria-label={label}
        muted
        playsInline
        loop
        autoPlay
        preload="metadata"
      />
    );
  }
  return (
    <img
      className="showcase-media-editor__preview-media"
      src={toShowcaseMediaUrl(asset.id)}
      alt={label}
      loading="lazy"
      decoding="async"
    />
  );
}

type Props = {
  showcaseState: ShowcaseMediaState;
  showcaseSaving: boolean;
  heroInputRefs: Record<ShowcaseViewportKey, RefObject<HTMLInputElement | null>>;
  carouselInputRefs: Record<ShowcaseViewportKey, RefObject<HTMLInputElement | null>>;
  onPickHeroAsset: (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveHeroAsset: (viewport: ShowcaseViewportKey, event?: MouseEvent<HTMLButtonElement>) => Promise<void>;
  onPickCarouselAssets: (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveCarouselAsset: (viewport: ShowcaseViewportKey, assetId: number) => Promise<void>;
  onCommitCarouselOrder: (viewport: ShowcaseViewportKey, orderedAssetIds: number[]) => Promise<void>;
};

type DragState = {
  viewport: ShowcaseViewportKey;
  assetId: number;
  pointerId: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
} | null;

const VIEWPORTS: Array<{
  key: ShowcaseViewportKey;
  title: string;
  note: string;
  heroToneClassName: string;
}> = [
  {
    key: "desktop",
    title: "Компьютерная версия",
    note: "Широкая заставка и карусель для полноценной витрины.",
    heroToneClassName: "showcase-media-editor__hero-tile--desktop",
  },
  {
    key: "mobile",
    title: "Мобильная версия",
    note: "Отдельный мобильный набор. Можно собирать другой ритм и другой кроп.",
    heroToneClassName: "showcase-media-editor__hero-tile--mobile",
  },
];

function reorderAssets(assets: ShowcaseMediaAsset[], activeId: number, overId: number): ShowcaseMediaAsset[] {
  if (activeId === overId) {
    return assets;
  }
  const fromIndex = assets.findIndex((item) => item.id === activeId);
  const toIndex = assets.findIndex((item) => item.id === overId);
  if (fromIndex < 0 || toIndex < 0) {
    return assets;
  }
  const nextAssets = [...assets];
  const [movedAsset] = nextAssets.splice(fromIndex, 1);
  nextAssets.splice(toIndex, 0, movedAsset);
  return nextAssets;
}

function findHoveredAssetId(
  viewport: ShowcaseViewportKey,
  pointerX: number,
  pointerY: number,
  activeAssetId: number,
  cardRefs: Record<ShowcaseViewportKey, Map<number, HTMLDivElement>>,
): number | null {
  for (const [assetId, element] of cardRefs[viewport].entries()) {
    if (assetId === activeAssetId) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    const inside = pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;
    if (inside) {
      return assetId;
    }
  }
  return null;
}

function ShowcaseCarouselCard({
  viewportTitle,
  asset,
  index,
  isDragging,
  registerRef,
  disabled,
  onPointerDown,
  onRemove,
}: {
  viewportTitle: string;
  asset: ShowcaseMediaAsset;
  index: number;
  isDragging: boolean;
  registerRef: (assetId: number, element: HTMLDivElement | null) => void;
  disabled: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, asset: ShowcaseMediaAsset) => void;
  onRemove: () => void;
}) {
  return (
    <div
      ref={(element) => registerRef(asset.id, element)}
      className={isDragging ? "showcase-media-editor__carousel-card showcase-media-editor__carousel-card--dragging" : "showcase-media-editor__carousel-card"}
      onPointerDown={(event) => onPointerDown(event, asset)}
      aria-disabled={disabled}
    >
      <div className="showcase-media-editor__drag-handle" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="showcase-media-editor__order-badge">{index + 1}</div>
      {renderMediaPreview(asset, { label: `Карусель ${viewportTitle} #${index + 1}` })}
      <button
        type="button"
        data-drag-disabled="true"
        className="showcase-media-editor__remove-btn"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`Удалить слайд ${index + 1} (${viewportTitle})`}
      >
        <IconClose className="icon-svg icon-svg--sm" />
      </button>
      <div className="showcase-media-editor__card-meta">
        <span>{formatMimeLabel(asset)}</span>
        <span>{formatBytes(asset.byteSize)}</span>
      </div>
    </div>
  );
}

function ShowcaseCarouselDragOverlay({
  asset,
  index,
  dragState,
}: {
  asset: ShowcaseMediaAsset;
  index: number;
  dragState: NonNullable<DragState>;
}) {
  return (
    <div
      className="showcase-media-editor__carousel-card showcase-media-editor__carousel-card--overlay"
      style={{
        width: dragState.width,
        height: dragState.height,
        left: dragState.pointerX - dragState.offsetX,
        top: dragState.pointerY - dragState.offsetY,
      }}
    >
      <div className="showcase-media-editor__drag-handle" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="showcase-media-editor__order-badge">{index + 1}</div>
      {renderMediaPreview(asset, { label: `Карусель #${index + 1}` })}
      <div className="showcase-media-editor__card-meta">
        <span>{formatMimeLabel(asset)}</span>
        <span>{formatBytes(asset.byteSize)}</span>
      </div>
    </div>
  );
}

export function AdminShowcaseMediaSection({
  showcaseState,
  showcaseSaving,
  heroInputRefs,
  carouselInputRefs,
  onPickHeroAsset,
  onRemoveHeroAsset,
  onPickCarouselAssets,
  onRemoveCarouselAsset,
  onCommitCarouselOrder,
}: Props) {
  const [localCarouselAssets, setLocalCarouselAssets] = useState<Record<ShowcaseViewportKey, ShowcaseMediaAsset[]>>({
    desktop: showcaseState.desktop.carouselAssets,
    mobile: showcaseState.mobile.carouselAssets,
  });
  const [dragState, setDragState] = useState<DragState>(null);
  const cardRefs = useRef<Record<ShowcaseViewportKey, Map<number, HTMLDivElement>>>({
    desktop: new Map<number, HTMLDivElement>(),
    mobile: new Map<number, HTMLDivElement>(),
  });
  const localCarouselAssetsRef = useRef(localCarouselAssets);
  const showcaseStateRef = useRef(showcaseState);
  const lastAnimatedOrderRef = useRef<Record<ShowcaseViewportKey, number[]>>({
    desktop: showcaseState.desktop.carouselAssets.map((item) => item.id),
    mobile: showcaseState.mobile.carouselAssets.map((item) => item.id),
  });

  useEffect(() => {
    localCarouselAssetsRef.current = localCarouselAssets;
  }, [localCarouselAssets]);

  useEffect(() => {
    showcaseStateRef.current = showcaseState;
  }, [showcaseState]);

  useEffect(() => {
    setLocalCarouselAssets((current) => ({
      desktop: dragState?.viewport === "desktop" ? current.desktop : showcaseState.desktop.carouselAssets,
      mobile: dragState?.viewport === "mobile" ? current.mobile : showcaseState.mobile.carouselAssets,
    }));
  }, [dragState?.viewport, showcaseState.desktop.carouselAssets, showcaseState.mobile.carouselAssets]);

  useLayoutEffect(() => {
    for (const viewport of ["desktop", "mobile"] as ShowcaseViewportKey[]) {
      const previousOrder = lastAnimatedOrderRef.current[viewport];
      const nextOrder = localCarouselAssets[viewport].map((item) => item.id);
      if (previousOrder.length > 0 && nextOrder.join(",") !== previousOrder.join(",")) {
        for (const assetId of nextOrder) {
          const element = cardRefs.current[viewport].get(assetId);
          if (!element) {
            continue;
          }
          const previousIndex = previousOrder.indexOf(assetId);
          const currentIndex = nextOrder.indexOf(assetId);
          if (previousIndex < 0 || currentIndex < 0 || previousIndex === currentIndex) {
            continue;
          }
          element.animate(
            [
              {
                transform: `scale(0.985) translateY(${previousIndex < currentIndex ? "-8px" : "8px"})`,
              },
              {
                transform: "scale(1) translateY(0)",
              },
            ],
            {
              duration: 220,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            },
          );
        }
      }
      lastAnimatedOrderRef.current[viewport] = nextOrder;
    }
  }, [localCarouselAssets]);

  const activeDragAsset = useMemo(() => {
    if (!dragState) {
      return null;
    }
    return localCarouselAssets[dragState.viewport].find((item) => item.id === dragState.assetId) || null;
  }, [dragState, localCarouselAssets]);

  const activeDragIndex = useMemo(() => {
    if (!dragState) {
      return -1;
    }
    return localCarouselAssets[dragState.viewport].findIndex((item) => item.id === dragState.assetId);
  }, [dragState, localCarouselAssets]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }
      const pointerX = event.clientX;
      const pointerY = event.clientY;
      setDragState((current) => (current ? { ...current, pointerX, pointerY } : current));

      const overId = findHoveredAssetId(dragState.viewport, pointerX, pointerY, dragState.assetId, cardRefs.current);
      if (overId == null) {
        return;
      }
      setLocalCarouselAssets((current) => {
        const nextAssets = reorderAssets(current[dragState.viewport], dragState.assetId, overId);
        if (nextAssets === current[dragState.viewport]) {
          return current;
        }
        return {
          ...current,
          [dragState.viewport]: nextAssets,
        };
      });
    };

    const finishDrag = async (pointerId: number) => {
      if (pointerId !== dragState.pointerId) {
        return;
      }
      const nextAssets = localCarouselAssetsRef.current[dragState.viewport];
      setDragState(null);
      await onCommitCarouselOrder(dragState.viewport, nextAssets.map((item) => item.id));
    };

    const handlePointerUp = (event: PointerEvent) => {
      void finishDrag(event.pointerId);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }
      setLocalCarouselAssets({
        desktop: showcaseStateRef.current.desktop.carouselAssets,
        mobile: showcaseStateRef.current.mobile.carouselAssets,
      });
      setDragState(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      setLocalCarouselAssets({
        desktop: showcaseStateRef.current.desktop.carouselAssets,
        mobile: showcaseStateRef.current.mobile.carouselAssets,
      });
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragState, onCommitCarouselOrder]);

  const registerCardRef = (viewport: ShowcaseViewportKey, assetId: number, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current[viewport].set(assetId, element);
      return;
    }
    cardRefs.current[viewport].delete(assetId);
  };

  const handleCardPointerDown = (
    viewport: ShowcaseViewportKey,
    event: ReactPointerEvent<HTMLDivElement>,
    asset: ShowcaseMediaAsset,
  ) => {
    if (showcaseSaving || dragState) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("[data-drag-disabled='true']")) {
      return;
    }
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    event.preventDefault();
    setDragState({
      viewport,
      assetId: asset.id,
      pointerId: event.pointerId,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerX: event.clientX,
      pointerY: event.clientY,
    });
  };

  return (
    <div className="showcase-media-editor">
      {VIEWPORTS.map((viewport) => {
        const state = showcaseState[viewport.key];
        const carouselAssets = localCarouselAssets[viewport.key];

        return (
          <section key={viewport.key} className="showcase-media-editor__viewport">
            <header className="showcase-media-editor__viewport-head">
              <div>
                <h3 className="settings-subtitle showcase-media-editor__viewport-title">{viewport.title}</h3>
                <p className="showcase-media-editor__viewport-note">{viewport.note}</p>
              </div>
            </header>

            <div className="showcase-media-editor__viewport-grid">
              <div className="showcase-media-editor__slot">
                <div className="showcase-media-editor__slot-head">
                  <strong>Заставка</strong>
                  <span>Фото, GIF или видео без звука</span>
                </div>
                <div
                  className={`showcase-media-editor__hero-tile ${viewport.heroToneClassName}`}
                  onClick={() => {
                    if (!showcaseSaving) {
                      heroInputRefs[viewport.key].current?.click();
                    }
                  }}
                  onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                    if (showcaseSaving) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      heroInputRefs[viewport.key].current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-disabled={showcaseSaving}
                >
                  {state.heroAsset ? (
                    <>
                      {renderMediaPreview(state.heroAsset, { label: `Заставка ${viewport.title}` })}
                      <button
                        type="button"
                        className="showcase-media-editor__remove-btn"
                        onClick={(event) => void onRemoveHeroAsset(viewport.key, event)}
                        aria-label={`Удалить заставку ${viewport.title}`}
                      >
                        <IconClose className="icon-svg icon-svg--sm" />
                      </button>
                      <div className="showcase-media-editor__media-chip">
                        <span>{formatMimeLabel(state.heroAsset)}</span>
                        <span>{formatBytes(state.heroAsset.byteSize)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="showcase-media-editor__empty-state">
                      <IconPlus className="icon-svg icon-svg--sm" />
                      <strong>Загрузить заставку</strong>
                      <span>PNG, JPG, WebP, GIF, SVG, MP4, WebM, MOV</span>
                    </div>
                  )}
                </div>
                <input
                  ref={heroInputRefs[viewport.key]}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.mov,image/*,video/mp4,video/webm,video/quicktime"
                  className="input-hidden"
                  onChange={(event) => void onPickHeroAsset(viewport.key, event)}
                />
              </div>

              <div className="showcase-media-editor__slot">
                <div className="showcase-media-editor__slot-head">
                  <strong>{`Карусель (${carouselAssets.length}/${SHOWCASE_CAROUSEL_LIMIT})`}</strong>
                  <span>Тяни карточку за любую часть. Порядок меняется прямо во время движения.</span>
                </div>
                <div className="showcase-media-editor__carousel-grid">
                  {carouselAssets.map((asset, index) => (
                    <ShowcaseCarouselCard
                      key={`${viewport.key}-${asset.id}`}
                      viewportTitle={viewport.title}
                      asset={asset}
                      index={index}
                      isDragging={dragState?.viewport === viewport.key && dragState.assetId === asset.id}
                      registerRef={(assetId, element) => registerCardRef(viewport.key, assetId, element)}
                      disabled={showcaseSaving}
                      onPointerDown={(event, currentAsset) => handleCardPointerDown(viewport.key, event, currentAsset)}
                      onRemove={() => void onRemoveCarouselAsset(viewport.key, asset.id)}
                    />
                  ))}

                  {carouselAssets.length < SHOWCASE_CAROUSEL_LIMIT ? (
                    <button
                      type="button"
                      className="showcase-media-editor__add-card"
                      onClick={() => carouselInputRefs[viewport.key].current?.click()}
                      disabled={showcaseSaving}
                    >
                      <span className="showcase-media-editor__empty-state">
                        <IconPlus className="icon-svg icon-svg--sm" />
                        <strong>Добавить в карусель</strong>
                        <span>{`${SHOWCASE_CAROUSEL_LIMIT - carouselAssets.length} мест свободно`}</span>
                      </span>
                    </button>
                  ) : null}
                </div>
                <input
                  ref={carouselInputRefs[viewport.key]}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.mov,image/*,video/mp4,video/webm,video/quicktime"
                  className="input-hidden"
                  multiple
                  onChange={(event) => void onPickCarouselAssets(viewport.key, event)}
                />
              </div>
            </div>
          </section>
        );
      })}

      {dragState && activeDragAsset ? (
        <ShowcaseCarouselDragOverlay
          asset={activeDragAsset}
          index={Math.max(activeDragIndex, 0)}
          dragState={dragState}
        />
      ) : null}
    </div>
  );
}
