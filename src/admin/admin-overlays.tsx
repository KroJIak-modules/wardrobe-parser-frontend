import type { Dispatch, SetStateAction } from "react";
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
  manualPriceRub: string;
  manualCompareAtPriceRub: string;
  images: ProductCreateImage[];
  variants: Array<{ id: string; title: string; price: string; currency: "USD" | "EUR" | "GBP" | "JPY"; available: boolean }>;
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
        <div className="modal-backdrop" onClick={() => setZoomedImageUrl(null)}>
          <div className="zoom-modal" onClick={(event) => event.stopPropagation()}>
            <img src={zoomedImageUrl} alt="preview" className="zoom-image" loading="eager" decoding="async" />
          </div>
        </div>
      ) : null}
    </>
  );
}
