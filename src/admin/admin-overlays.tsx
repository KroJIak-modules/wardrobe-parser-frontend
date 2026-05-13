import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { ToastStack } from "../shared/toast-stack";
import type { ToastItem } from "../shared/use-toasts";
import { AdminProductCreateModal } from "./admin-product-create-modal";

type ImagePreview = {
  file: File;
  url: string;
};

type Props = {
  openModal: boolean;
  closeProductModal: () => void;
  productUrl: string;
  setProductUrl: Dispatch<SetStateAction<string>>;
  onFetchPreview: () => Promise<void>;
  productTitle: string;
  setProductTitle: Dispatch<SetStateAction<string>>;
  productVendor: string;
  setProductVendor: Dispatch<SetStateAction<string>>;
  productCategory: string;
  setProductCategory: Dispatch<SetStateAction<string>>;
  productPrice: string;
  setProductPrice: Dispatch<SetStateAction<string>>;
  productCurrency: "RUB" | "USD" | "EUR" | "GBP";
  setProductCurrency: Dispatch<SetStateAction<"RUB" | "USD" | "EUR" | "GBP">>;
  currencyOptions: Array<{ value: string; label: string }>;
  onDropImage: (files: File[]) => void;
  onPickImage: (event: ChangeEvent<HTMLInputElement>) => void;
  imagePreviews: ImagePreview[];
  setZoomedImageUrl: Dispatch<SetStateAction<string | null>>;
  removePreviewImage: (url: string) => void;
  onSaveProduct: () => Promise<void>;
  toasts: ToastItem[];
  closeToast: (id: number) => void;
  pauseToast: (id: number) => void;
  resumeToast: (id: number) => void;
  zoomedImageUrl: string | null;
};

export function AdminOverlays({
  openModal,
  closeProductModal,
  productUrl,
  setProductUrl,
  onFetchPreview,
  productTitle,
  setProductTitle,
  productVendor,
  setProductVendor,
  productCategory,
  setProductCategory,
  productPrice,
  setProductPrice,
  productCurrency,
  setProductCurrency,
  currencyOptions,
  onDropImage,
  onPickImage,
  imagePreviews,
  setZoomedImageUrl,
  removePreviewImage,
  onSaveProduct,
  toasts,
  closeToast,
  pauseToast,
  resumeToast,
  zoomedImageUrl,
}: Props) {
  return (
    <>
      <AdminProductCreateModal
        open={openModal}
        closeProductModal={closeProductModal}
        productUrl={productUrl}
        setProductUrl={setProductUrl}
        onFetchPreview={onFetchPreview}
        productTitle={productTitle}
        setProductTitle={setProductTitle}
        productVendor={productVendor}
        setProductVendor={setProductVendor}
        productCategory={productCategory}
        setProductCategory={setProductCategory}
        productPrice={productPrice}
        setProductPrice={setProductPrice}
        productCurrency={productCurrency}
        setProductCurrency={setProductCurrency}
        currencyOptions={currencyOptions}
        onDropImage={onDropImage}
        onPickImage={onPickImage}
        imagePreviews={imagePreviews}
        setZoomedImageUrl={setZoomedImageUrl}
        removePreviewImage={removePreviewImage}
        onSaveProduct={onSaveProduct}
      />

      <ToastStack toasts={toasts} onClose={closeToast} onPause={pauseToast} onResume={resumeToast} />

      {zoomedImageUrl ? (
        <div className="modal-backdrop" onClick={() => setZoomedImageUrl(null)}>
          <div className="zoom-modal" onClick={(event) => event.stopPropagation()}>
            <img src={zoomedImageUrl} alt="preview" className="zoom-image" />
          </div>
        </div>
      ) : null}
    </>
  );
}
