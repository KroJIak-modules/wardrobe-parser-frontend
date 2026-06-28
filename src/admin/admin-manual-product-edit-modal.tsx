import { useMemo, useRef } from "react";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { IconClose, IconPlus, IconStar } from "../shared/mono-icons";
import { optimizeImageUrl } from "../shared/product-image";

export type ManualEditVariant = {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string;
  currency: "USD" | "EUR" | "GBP" | "JPY";
  available: boolean;
};

export type ManualEditImage = {
  id: string;
  url: string;
};

export type ManualProductEditDraft = {
  title: string;
  description: string;
  descriptionHtml: string;
  weightGrams: string;
  gender: "male" | "female" | "unisex";
  availabilityMode: "in_stock" | "by_order";
  designerName: string;
  bindSync: boolean;
  favorite: boolean;
  images: ManualEditImage[];
  variants: ManualEditVariant[];
};

type Props = {
  open: boolean;
  saving: boolean;
  productTitle: string;
  draft: ManualProductEditDraft;
  knownDesignerOptions: string[];
  favoriteCategoryOptions: Array<{ slug: string; name: string }>;
  favoriteCategorySlugs: string[];
  showBindSync: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onSetFavoriteCategorySlugs: (slugs: string[]) => void;
  onSetField: <K extends keyof ManualProductEditDraft>(key: K, value: ManualProductEditDraft[K]) => void;
  onAddImage: (file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onZoomImage: (url: string) => void;
};

const CURRENCY_OPTIONS: Array<{ value: ManualEditVariant["currency"]; label: string }> = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
];

export function AdminManualProductEditModal({
  open,
  saving,
  productTitle,
  draft,
  knownDesignerOptions,
  favoriteCategoryOptions,
  favoriteCategorySlugs,
  showBindSync,
  onClose,
  onSave,
  onDelete,
  onSetFavoriteCategorySlugs,
  onSetField,
  onAddImage,
  onRemoveImage,
  onZoomImage,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validVariantsCount = useMemo(
    () =>
      draft.variants.filter((variant) => {
        const hasTitle = String(variant.title || "").trim().length > 0;
        const price = Number(String(variant.price || "").replace(",", "."));
        return hasTitle && Number.isFinite(price);
      }).length,
    [draft.variants]
  );
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal product-create-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{`Редактировать товар${productTitle ? `: ${productTitle}` : ""}`}</h3>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose} disabled={saving}>
            <IconClose className="icon-svg" />
          </button>
        </div>

        <section className="product-create__editor">
          <div className="product-create__editor-grid">
            <div className="product-create__editor-left">
              <label className="product-create__field">
                <span>Название товара</span>
                <input value={draft.title} onChange={(event) => onSetField("title", event.target.value)} disabled={saving} />
              </label>

              <div className="product-create__line3">
                <label className="product-create__field">
                  <span>Вес (граммы)</span>
                  <input value={draft.weightGrams} onChange={(event) => onSetField("weightGrams", event.target.value)} inputMode="numeric" disabled={saving} />
                </label>
                <label className="product-create__field">
                  <span>Дизайнер</span>
                  <input list="manual-edit-designer-options" value={draft.designerName} onChange={(event) => onSetField("designerName", event.target.value)} disabled={saving} />
                </label>
                <label className="product-create__field">
                  <span>Гендер</span>
                  <select value={draft.gender} onChange={(event) => onSetField("gender", event.target.value as "male" | "female" | "unisex")} disabled={saving}>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="unisex">Унисекс</option>
                  </select>
                </label>
                <label className="product-create__field">
                  <span>Режим продажи</span>
                  <select value={draft.availabilityMode} onChange={(event) => onSetField("availabilityMode", event.target.value as "in_stock" | "by_order")} disabled={saving}>
                    <option value="in_stock">В наличии</option>
                    <option value="by_order">Под заказ</option>
                  </select>
                </label>
              </div>

              <div className="product-create__favorite">
                {showBindSync ? (
                  <label className="ui-switch ui-switch--compact product-create__bind-sync">
                    <input type="checkbox" checked={Boolean(draft.bindSync)} disabled={saving} onChange={(event) => onSetField("bindSync", event.target.checked)} />
                    <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                    <span className="ui-switch-text">Привязать синхронизацию</span>
                  </label>
                ) : null}
                <button
                  type="button"
                  className={draft.favorite ? "icon-btn icon-btn--active" : "icon-btn"}
                  title="Кастомные каталоги"
                  onClick={() => {
                    const has = favoriteCategorySlugs.length > 0;
                    onSetField("favorite", !has);
                    if (has) onSetFavoriteCategorySlugs([]);
                  }}
                  disabled={saving}
                >
                  <IconStar className="icon-svg" />
                </button>
              </div>

              {knownDesignerOptions.length > 0 ? (
                <datalist id="manual-edit-designer-options">
                  {knownDesignerOptions.map((designer) => (
                    <option key={`manual-edit-designer-${designer}`} value={designer} />
                  ))}
                </datalist>
              ) : null}

              {favoriteCategoryOptions.length > 0 ? (
                <div className="star-picker">
                  {favoriteCategoryOptions.map((option) => (
                    <label key={option.slug} className="star-picker-option">
                      <input
                        type="checkbox"
                        checked={favoriteCategorySlugs.includes(option.slug)}
                        disabled={saving}
                        onChange={() => {
                          const next = favoriteCategorySlugs.includes(option.slug)
                            ? favoriteCategorySlugs.filter((item) => item !== option.slug)
                            : [...favoriteCategorySlugs, option.slug];
                          onSetFavoriteCategorySlugs(next);
                          onSetField("favorite", next.length > 0);
                        }}
                      />
                      <span>{option.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-create__editor-right">
              <label className="product-create__field product-create__field--description">
                <span>Описание товара (text)</span>
                <textarea value={draft.description} onChange={(event) => onSetField("description", event.target.value)} disabled={saving} />
              </label>
              <label className="product-create__field product-create__field--description">
                <span>Описание товара (HTML)</span>
                <textarea value={draft.descriptionHtml} onChange={(event) => onSetField("descriptionHtml", event.target.value)} disabled={saving} />
              </label>
            </div>
          </div>
        </section>

        <section className={`product-create__images${draft.bindSync ? " product-create__section-disabled" : ""}`}>
          <h4 className="product-create__images-title">Фотографии</h4>
          <div className="product-create__images-grid">
            {draft.images.map((image) => (
              <div key={image.id} className="product-create__image-tile">
                <button type="button" className="product-create__image-open" aria-label="Открыть фото" onClick={() => onZoomImage(image.url)}>
                  <ImageWithFallback
                    src={optimizeImageUrl(image.url, { width: 240, height: 240, quality: 55 })}
                    alt="product"
                    className="product-create__image-preview"
                    placeholderClassName="manual-product-media product-create__thumb-fallback"
                    placeholderText="Нет фото"
                  />
                </button>
                <button type="button" className="product-create__image-remove" aria-label="Удалить фото" onClick={() => onRemoveImage(image.id)} disabled={saving || draft.bindSync}>
                  <IconClose className="icon-svg" />
                </button>
              </div>
            ))}
            <button type="button" className="product-create__image-tile product-create__image-tile--add" onClick={() => fileInputRef.current?.click()} disabled={saving || draft.bindSync}>
              <IconPlus className="icon-svg product-create__image-plus" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onAddImage(file);
              event.currentTarget.value = "";
            }}
          />
        </section>

        <section className={`product-create__variants${draft.bindSync ? " product-create__section-disabled" : ""}`}>
          <div className="product-create__variants-head">
            <h4 className="product-create__images-title">Варианты</h4>
            <button
              type="button"
              className="btn btn-light"
              disabled={saving || draft.bindSync}
              onClick={() => onSetField("variants", [...draft.variants, { id: `v-${Date.now()}`, title: "", price: "", compareAtPrice: "", currency: "USD", available: true }])}
            >
              Добавить вариант
            </button>
          </div>
          <div className="product-create__variants-list">
            {draft.variants.map((variant) => (
              <div key={variant.id} className="product-create__variant-row">
                <input className="input" placeholder="Название варианта" value={variant.title} disabled={saving || draft.bindSync}
                  onChange={(event) => onSetField("variants", draft.variants.map((item) => (item.id === variant.id ? { ...item, title: event.target.value } : item)))} />
                <input className="input" placeholder="Цена" inputMode="decimal" value={variant.price} disabled={saving || draft.bindSync}
                  onChange={(event) => onSetField("variants", draft.variants.map((item) => (item.id === variant.id ? { ...item, price: event.target.value } : item)))} />
                <input className="input" placeholder="Старая цена" inputMode="decimal" value={variant.compareAtPrice} disabled={saving || draft.bindSync}
                  onChange={(event) => onSetField("variants", draft.variants.map((item) => (item.id === variant.id ? { ...item, compareAtPrice: event.target.value } : item)))} />
                <select className="input" value={variant.currency} disabled={saving || draft.bindSync}
                  onChange={(event) => onSetField("variants", draft.variants.map((item) => (item.id === variant.id ? { ...item, currency: event.target.value as ManualEditVariant["currency"] } : item)))}>
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <label className="ui-switch ui-switch--compact">
                  <input type="checkbox" checked={variant.available} disabled={saving || draft.bindSync}
                    onChange={(event) => onSetField("variants", draft.variants.map((item) => (item.id === variant.id ? { ...item, available: event.target.checked } : item)))} />
                  <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                  <span className="ui-switch-text">В наличии</span>
                </label>
                <button type="button" className="icon-btn" disabled={saving || draft.bindSync || draft.variants.length <= 1}
                  onClick={() => onSetField("variants", draft.variants.filter((item) => item.id !== variant.id))}>
                  <IconClose className="icon-svg" />
                </button>
              </div>
            ))}
          </div>
          {validVariantsCount === 0 ? <span className="product-create__field-error">Добавь хотя бы один вариант с названием и ценой.</span> : null}
        </section>

        <div className="product-create__actions">
          <button type="button" className="btn btn-danger" onClick={onDelete} disabled={saving}>Удалить</button>
          <button type="button" onClick={onClose} disabled={saving}>Отменить</button>
          <button type="button" disabled={saving || !draft.title.trim() || validVariantsCount === 0} onClick={onSave}>
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
