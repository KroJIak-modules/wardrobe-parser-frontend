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
  productDescription: string;
  setProductDescription: Dispatch<SetStateAction<string>>;
  productCurrency: string;
  setProductCurrency: Dispatch<SetStateAction<string>>;
  productVariants: Array<{ title: string; price: string; available: boolean }>;
  setProductVariants: Dispatch<SetStateAction<Array<{ title: string; price: string; available: boolean }>>>;
  currencyOptions: CurrencyCode[];
  onDropImage: (event: DragEvent<HTMLDivElement>) => void;
  onPickImage: (event: ChangeEvent<HTMLInputElement>) => void;
  imagePreviews: UploadPreview[];
  setZoomedImageUrl: Dispatch<SetStateAction<string | null>>;
  removePreviewImage: (url: string) => void;
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
  productDescription,
  setProductDescription,
  productCurrency,
  setProductCurrency,
  productVariants,
  setProductVariants,
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
            <select value={productCurrency} onChange={(event) => setProductCurrency(event.target.value)}>
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
            placeholder="Описание"
            rows={4}
          />

          <div className="card card--pad-md">
            <div className="row-between">
              <h3>Варианты</h3>
              <button
                type="button"
                className="btn-link"
                onClick={() => setProductVariants((prev) => [...prev, { title: "", price: "", available: true }])}
              >
                <IconPlus className="icon-svg icon-svg--sm" /> добавить вариант
              </button>
            </div>
            {productVariants.map((variant, index) => (
              <div key={`variant-${index}`} className="row3" style={{ marginTop: 8 }}>
                <input
                  value={variant.title}
                  onChange={(event) =>
                    setProductVariants((prev) => prev.map((item, idx) => (idx === index ? { ...item, title: event.target.value } : item)))
                  }
                  placeholder="Название варианта"
                />
                <input
                  value={variant.price}
                  onChange={(event) =>
                    setProductVariants((prev) => prev.map((item, idx) => (idx === index ? { ...item, price: event.target.value } : item)))
                  }
                  placeholder="Цена"
                />
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={variant.available}
                    onChange={(event) =>
                      setProductVariants((prev) => prev.map((item, idx) => (idx === index ? { ...item, available: event.target.checked } : item)))
                    }
                  />
                  <span>В наличии</span>
                </label>
                <button
                  type="button"
                  onClick={() => setProductVariants((prev) => prev.filter((_, idx) => idx !== index))}
                  disabled={productVariants.length <= 1}
                >
                  Удалить
                </button>
              </div>
            ))}
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
                    <button type="button" onClick={() => removePreviewImage(item.url)}>
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
