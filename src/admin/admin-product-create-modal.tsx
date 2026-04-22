import type { ChangeEvent, DragEvent, Dispatch, SetStateAction } from "react";
import { IconChevronDown, IconPlus } from "../shared/mono-icons";
import type { CurrencyCode, UploadPreview } from "./admin-types";

type Props = {
  open: boolean;
  closeProductModal: () => void;
  productUrl: string;
  setProductUrl: Dispatch<SetStateAction<string>>;
  onFetchPreview: () => void;
  productTitle: string;
  setProductTitle: Dispatch<SetStateAction<string>>;
  productVendor: string;
  setProductVendor: Dispatch<SetStateAction<string>>;
  productCategory: string;
  setProductCategory: Dispatch<SetStateAction<string>>;
  productPrice: string;
  setProductPrice: Dispatch<SetStateAction<string>>;
  productCurrency: string;
  setProductCurrency: Dispatch<SetStateAction<string>>;
  currencyOptions: CurrencyCode[];
  onDropImage: (event: DragEvent<HTMLDivElement>) => void;
  onPickImage: (event: ChangeEvent<HTMLInputElement>) => void;
  imagePreviews: UploadPreview[];
  setZoomedImageUrl: Dispatch<SetStateAction<string | null>>;
  removePreviewImage: (index: number) => void;
  onSaveProduct: () => void;
};

export function AdminProductCreateModal({
  open,
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
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={closeProductModal}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>Добавить товар</h2>
          <button type="button" onClick={closeProductModal}>
            Закрыть
          </button>
        </div>

        <div className="form">
          <div className="url-fetch-row">
            <input
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="Ссылка (опционально): https://shop.example.com/products/..."
            />
            <button type="button" className="mini-btn" onClick={onFetchPreview} title="Подтянуть поля из URL">
              <IconChevronDown className="icon-svg" />
            </button>
          </div>

          <input value={productTitle} onChange={(event) => setProductTitle(event.target.value)} placeholder="Название" />

          <div className="row2">
            <input value={productVendor} onChange={(event) => setProductVendor(event.target.value)} placeholder="Бренд" />
            <input
              value={productCategory}
              onChange={(event) => setProductCategory(event.target.value)}
              placeholder="Категория / product_type"
            />
          </div>

          <div className="row2">
            <input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} placeholder="Цена" />
            <select value={productCurrency} onChange={(event) => setProductCurrency(event.target.value)}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="dropzone" onDrop={onDropImage} onDragOver={(event) => event.preventDefault()}>
            Drag-and-drop изображений сюда
          </div>
          <label className="btn-link" htmlFor="image-file">
            <IconPlus className="icon-svg icon-svg--sm" /> добавить фото
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            multiple
            onChange={onPickImage}
            className="input-hidden"
          />

          {imagePreviews.length > 0 ? (
            <div className="image-preview-grid">
              {imagePreviews.map((item, index) => (
                <div key={`${item.file.name}-${index}`} className="image-preview-card">
                  <button type="button" className="image-preview-btn" onClick={() => setZoomedImageUrl(item.url)}>
                    <img src={item.url} alt={item.file.name} className="image-preview" />
                  </button>
                  <div className="actions actions--compact-top">
                    <button type="button" onClick={() => removePreviewImage(index)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Фото не выбраны</p>
          )}

          <button type="button" onClick={onSaveProduct}>
            Сохранить товар
          </button>
        </div>
      </div>
    </div>
  );
}
