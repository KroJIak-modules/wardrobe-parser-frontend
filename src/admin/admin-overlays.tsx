import { useEffect, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import { useAdminBodyScrollLock } from "./hooks/use-admin-body-scroll-lock";
import { ToastStack } from "../shared/toast-stack";
import type { ToastItem } from "../shared/use-toasts";
import { AdminProductCreateModal } from "./admin-product-create-modal";
import type { ServiceProduct } from "../shared/live-data-types";

type MatchedSourceDomain = {
  host: string;
  sourceName: string;
  sourceKey: string;
  modeLabel: "Авто" | "Ручной";
};

type ProductCreateImage = {
  id: string;
  url: string;
  isManual: boolean;
};

type ProductCreateDraft = {
  sourceUrl: string;
  title: string;
  description: string;
  descriptionHtml: string;
  weightGrams: string;
  gender: "male" | "female" | "unisex";
  availabilityMode: "in_stock" | "by_order";
  favorite: boolean;
  bindSync: boolean;
  designerName: string;
  images: ProductCreateImage[];
  variants: Array<{ id: string; title: string; price: string; compareAtPrice: string; currency: "RUB" | "USD" | "EUR" | "GBP" | "JPY"; available: boolean }>;
};

type Props = {
  setZoomedImageUrl: Dispatch<SetStateAction<string | null>>;
  toasts: ToastItem[];
  closeToast: (id: number) => void;
  pauseToast: (id: number) => void;
  resumeToast: (id: number) => void;
  zoomedImageUrl: string | null;
  productCreateOpen: boolean;
  productCreateDraft: ProductCreateDraft;
  productCreateLookup: {
    state: "idle" | "loading" | "not_found" | "found";
    product: ServiceProduct | null;
  };
  productCreateSourceError: string | null;
  productCreateMatchedDomain: MatchedSourceDomain | null;
  productCreateCanRunLookup: boolean;
  productCreateHydrating: boolean;
  productCreateCreating: boolean;
  productCreateHiddenIds: Set<number>;
  productCreateKnownDesigners: string[];
  productCreateFavoriteOptions: Array<{ slug: string; name: string }>;
  productCreateFavoriteSlugs: string[];
  productCreateBoundFromSourceLookup: boolean;
  onSetProductCreateFavoriteSlugs: (slugs: string[]) => void;
  onCloseProductCreate: () => void;
  onSetProductCreateField: <K extends keyof ProductCreateDraft>(key: K, value: ProductCreateDraft[K]) => void;
  onHydrateFromSourceUrl: () => Promise<void>;
  onHydrateFromExisting: () => Promise<void>;
  onToggleHideExisting: () => void;
  onAddProductImage: (file: File) => void;
  onRemoveProductImage: (imageId: string) => void;
  onCreateProductDraft: () => void;
  onZoomProductImage: (url: string) => void;
};

export function AdminOverlays({
  setZoomedImageUrl,
  toasts,
  closeToast,
  pauseToast,
  resumeToast,
  zoomedImageUrl,
  productCreateOpen,
  productCreateDraft,
  productCreateLookup,
  productCreateSourceError,
  productCreateMatchedDomain,
  productCreateCanRunLookup,
  productCreateHydrating,
  productCreateCreating,
  productCreateHiddenIds,
  productCreateKnownDesigners,
  productCreateFavoriteOptions,
  productCreateFavoriteSlugs,
  productCreateBoundFromSourceLookup,
  onSetProductCreateFavoriteSlugs,
  onCloseProductCreate,
  onSetProductCreateField,
  onHydrateFromSourceUrl,
  onHydrateFromExisting,
  onToggleHideExisting,
  onAddProductImage,
  onRemoveProductImage,
  onCreateProductDraft,
  onZoomProductImage,
}: Props) {
  useAdminBodyScrollLock(Boolean(zoomedImageUrl));
  useEffect(() => {
    if (!zoomedImageUrl) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setZoomedImageUrl(null);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [zoomedImageUrl, setZoomedImageUrl]);

  return (
    <>
      <ToastStack toasts={toasts} onClose={closeToast} onPause={pauseToast} onResume={resumeToast} />

      <AdminProductCreateModal
        open={productCreateOpen}
        draft={productCreateDraft}
        lookup={productCreateLookup}
        sourceDomainError={productCreateSourceError}
        matchedSourceDomain={productCreateMatchedDomain}
        canRunLookup={productCreateCanRunLookup}
        isHydrating={productCreateHydrating}
        isCreating={productCreateCreating}
        hiddenProductIds={productCreateHiddenIds}
        knownDesignerOptions={productCreateKnownDesigners}
        favoriteCategoryOptions={productCreateFavoriteOptions}
        favoriteCategorySlugs={productCreateFavoriteSlugs}
        boundFromSourceLookup={productCreateBoundFromSourceLookup}
        onSetFavoriteCategorySlugs={onSetProductCreateFavoriteSlugs}
        onClose={onCloseProductCreate}
        onSetField={onSetProductCreateField}
        onHydrateFromSourceUrl={onHydrateFromSourceUrl}
        onHydrateFromExisting={onHydrateFromExisting}
        onToggleHideExisting={onToggleHideExisting}
        onAddManualImage={onAddProductImage}
        onRemoveImage={onRemoveProductImage}
        onCreate={onCreateProductDraft}
        onZoomImage={onZoomProductImage}
      />

      {zoomedImageUrl ? (
        <div
          className="modal-backdrop zoom-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото товара"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="zoom-modal" onClick={(event) => event.stopPropagation()}>
            <img src={zoomedImageUrl} alt="preview" className="zoom-image" loading="eager" decoding="async" />
            <button
              type="button"
              className="zoom-close"
              aria-label="Закрыть просмотр"
              title="Закрыть (Esc)"
              autoFocus
              onClick={(event) => {
                event.stopPropagation();
                setZoomedImageUrl(null);
              }}
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
