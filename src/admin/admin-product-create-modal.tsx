import { useMemo, useRef, useState } from "react";
import { EmptyState } from "../shared/empty-state";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { optimizeImageUrl } from "../shared/product-image";
import { SkeletonBlock } from "../shared/skeleton";
import { IconClose, IconExternalLink, IconEye, IconEyeOff, IconPencil, IconPlus, IconStar } from "../shared/mono-icons";
import type { ServiceProduct } from "../shared/live-data-types";
import type { ProductCreateVariant } from "./hooks/use-admin-product-create";

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
  variants: ProductCreateVariant[];
};

type LookupState = "idle" | "loading" | "not_found" | "found";

type Props = {
  open: boolean;
  draft: ProductCreateDraft;
  lookup: {
    state: LookupState;
    product: ServiceProduct | null;
  };
  sourceDomainError: string | null;
  matchedSourceDomain: MatchedSourceDomain | null;
  canRunLookup: boolean;
  isHydrating: boolean;
  isCreating: boolean;
  hiddenProductIds: Set<number>;
  knownDesignerOptions: string[];
  favoriteCategoryOptions: Array<{ slug: string; name: string }>;
  favoriteCategorySlugs: string[];
  boundFromSourceLookup: boolean;
  onSetFavoriteCategorySlugs: (slugs: string[]) => void;
  onClose: () => void;
  onSetField: <K extends keyof ProductCreateDraft>(key: K, value: ProductCreateDraft[K]) => void;
  onHydrateFromSourceUrl: () => Promise<void>;
  onHydrateFromExisting: () => Promise<void>;
  onToggleHideExisting: () => void;
  onAddManualImage: (file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onCreate: () => void;
  onZoomImage: (url: string) => void;
};

function formatPrice(value: number | null | undefined, currency: string | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const normalizedCurrency = String(currency || "").trim().toUpperCase() || "USD";
  const map: Record<string, string> = {
    RUB: "RUB",
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    JPY: "JPY",
  };
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: map[normalizedCurrency] || "USD",
      maximumFractionDigits: normalizedCurrency === "JPY" ? 0 : 2,
    }).format(Number(value));
  } catch {
    return `${Number(value).toFixed(2)} ${normalizedCurrency}`;
  }
}

function formatRub(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function resolveProductRubPrice(product: ServiceProduct): number | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  let variantCurrency = "";
  for (const variant of variants) {
    const raw = String((variant as { currency?: unknown }).currency || "").toUpperCase();
    if (raw.length === 3) {
      variantCurrency = raw;
      break;
    }
  }
  if (product.final_price !== null && product.final_price !== undefined && Number.isFinite(Number(product.final_price))) {
    return Number(product.final_price);
  }
  if (product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price))) {
    const currency = variantCurrency || "USD";
    if (currency === "RUB") return Number(product.price);
    if (currency === "USD") return Number(product.price) * 92;
    if (currency === "EUR") return Number(product.price) * 103;
    if (currency === "GBP") return Number(product.price) * 121;
    if (currency === "JPY") return Number(product.price) * 0.64;
  }
  return null;
}

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="manual-product-media product-create__thumb">
      <ImageWithFallback
        src={optimizeImageUrl(src, { width: 220, height: 220, quality: 55 })}
        alt={alt}
        className="product-create__thumb-image"
        placeholderClassName="manual-product-media product-create__thumb-fallback"
        placeholderText="Нет фото"
      />
    </div>
  );
}

function prettyHostLabel(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "");
  } catch {
    return "Источник";
  }
}

const CURRENCY_OPTIONS: Array<{ value: ProductCreateVariant["currency"]; label: string }> = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
];

export function AdminProductCreateModal({
  open,
  draft,
  lookup,
  sourceDomainError,
  matchedSourceDomain,
  canRunLookup,
  isHydrating,
  isCreating,
  hiddenProductIds,
  knownDesignerOptions,
  favoriteCategoryOptions,
  favoriteCategorySlugs,
  boundFromSourceLookup,
  onSetFavoriteCategorySlugs,
  onClose,
  onSetField,
  onHydrateFromSourceUrl,
  onHydrateFromExisting,
  onToggleHideExisting,
  onAddManualImage,
  onRemoveImage,
  onCreate,
  onZoomImage,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const designerCloseTimerRef = useRef<number | null>(null);
  const [favoritePickerOpen, setFavoritePickerOpen] = useState<boolean>(false);
  const [designerComboboxOpen, setDesignerComboboxOpen] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const originalPrice = useMemo(() => {
    if (!lookup.product) return "—";
    const variants = Array.isArray(lookup.product.variants) ? lookup.product.variants : [];
    let currency = "";
    for (const variant of variants) {
      const raw = String((variant as { currency?: unknown }).currency || "").toUpperCase();
      if (raw.length === 3) {
        currency = raw;
        break;
      }
    }
    return formatPrice(lookup.product.price, currency || "USD");
  }, [lookup.product]);

  const rubPrice = useMemo(() => {
    if (!lookup.product) return "—";
    return formatRub(resolveProductRubPrice(lookup.product));
  }, [lookup.product]);
  const titleRequiredError = showValidation && !draft.title.trim();
  const validVariantsCount = useMemo(
    () =>
      draft.variants.filter((variant) => {
        const hasTitle = String(variant.title || "").trim().length > 0;
        const price = Number(String(variant.price || "").replace(",", "."));
        return hasTitle && Number.isFinite(price);
      }).length,
    [draft.variants]
  );
  const canCreate = Boolean(draft.title.trim() && validVariantsCount > 0) && !isHydrating && !isCreating;
  const hasExistingLookupProduct = lookup.state === "found" && Number(lookup.product?.id || 0) > 0;
  const lookupSourceHref = toExternalHttpUrl(lookup.product?.url);
  const isExistingProductHidden = Boolean(
    lookup.product
    && (hiddenProductIds.has(lookup.product.id) || String(lookup.product.visibility_status || "").trim().toLowerCase() === "hidden")
  );
  const bindSyncDisabledReason = useMemo(() => {
    if (hasExistingLookupProduct) return "Товар уже есть в базе";
    if (!boundFromSourceLookup) return "Нельзя включить без ссылки источника";
    return "";
  }, [hasExistingLookupProduct, boundFromSourceLookup]);
  const designerSuggestions = useMemo(() => {
    const query = String(draft.designerName || "").trim().toLowerCase();
    const raw = knownDesignerOptions.filter((item) => {
      const normalized = String(item || "").trim();
      if (!normalized) return false;
      if (!query) return true;
      return normalized.toLowerCase().includes(query);
    });
    return Array.from(new Set(raw)).slice(0, 14);
  }, [knownDesignerOptions, draft.designerName]);

  const scheduleDesignerClose = () => {
    if (designerCloseTimerRef.current !== null) {
      window.clearTimeout(designerCloseTimerRef.current);
    }
    designerCloseTimerRef.current = window.setTimeout(() => {
      setDesignerComboboxOpen(false);
    }, 120);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal product-create-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>Добавить товар</h3>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}>
            <IconClose className="icon-svg" />
          </button>
        </div>

        <section className="product-create__source">
          <div className="url-fetch-row product-create__source-row">
            <input
              value={draft.sourceUrl}
              onChange={(event) => onSetField("sourceUrl", event.target.value)}
              placeholder="Ссылка на товар магазина-продавца"
              disabled={isHydrating || isCreating}
            />
            <button
              type="button"
              className="mini-btn icon-btn"
              aria-label="Выгрузить товар по ссылке"
              disabled={!canRunLookup || isHydrating || isCreating}
              onClick={() => {
                void onHydrateFromSourceUrl();
              }}
            >
              <IconPencil className="icon-svg" />
            </button>
          </div>

          {sourceDomainError ? <p className="product-create__error">{sourceDomainError}</p> : null}
          {matchedSourceDomain ? <p className="product-create__source-meta">{matchedSourceDomain.sourceName}</p> : null}

          {!sourceDomainError && draft.sourceUrl.trim() ? (
            <div className="product-create__lookup">
              {lookup.state === "loading" ? (
                <div className="product-create__lookup-skeleton">
                  <SkeletonBlock className="product-create__lookup-skeleton-thumb" />
                  <div className="product-create__lookup-skeleton-body">
                    <SkeletonBlock className="product-create__lookup-skeleton-line" />
                    <SkeletonBlock className="product-create__lookup-skeleton-line product-create__lookup-skeleton-line--short" />
                  </div>
                </div>
              ) : null}

              {lookup.state === "not_found" ? <EmptyState compact title="Товар еще не существует в базе." /> : null}

              {lookup.state === "found" && lookup.product ? (
                <div className="product-create__found-row">
                  {lookup.product.image_urls?.[0] ? (
                    <ProductThumb src={lookup.product.image_urls[0]} alt={lookup.product.title || "preview"} />
                  ) : (
                    <div className="manual-product-media product-create__thumb-fallback">
                      <span className="photo-placeholder">Нет фото</span>
                    </div>
                  )}

                  <div className="product-create__found-body">
                    <a
                      className="product-create__found-title"
                      href={`/product/${lookup.product.id}?from=admin`}
                    >
                      {lookup.product.title || `Товар #${lookup.product.id}`}
                    </a>
                    {lookupSourceHref ? (
                      <a
                        className="product-create__found-link"
                        href={lookupSourceHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {String(lookup.product.source_name || "").trim() || matchedSourceDomain?.sourceName || prettyHostLabel(String(lookup.product.url || ""))}
                      </a>
                    ) : (
                      <span className="product-create__found-link">
                        {String(lookup.product.source_name || "").trim() || matchedSourceDomain?.sourceName || "Ручной товар"}
                      </span>
                    )}
                  </div>

                  <div className="product-create__found-prices">
                    <span>{originalPrice}</span>
                    <strong>{rubPrice}</strong>
                  </div>

                  <div className="product-create__found-actions">
                    <button
                      type="button"
                      className={`icon-btn ${isExistingProductHidden ? "icon-btn--danger" : ""}`}
                      aria-label="Скрыть существующий товар"
                      onClick={onToggleHideExisting}
                    >
                      {isExistingProductHidden ? (
                        <IconEyeOff className="icon-svg" />
                      ) : (
                        <IconEye className="icon-svg" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Выгрузить существующий товар"
                      disabled={isHydrating || isCreating}
                      onClick={() => {
                        void onHydrateFromExisting();
                      }}
                    >
                      <IconPencil className="icon-svg" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="product-create__divider" aria-hidden="true" />

        <section className="product-create__editor">
          <div className="product-create__editor-grid">
            <div className="product-create__editor-left">
              <label className="product-create__field">
                <span>Название товара</span>
                <input
                  value={draft.title}
                  onChange={(event) => onSetField("title", event.target.value)}
                  disabled={isHydrating || isCreating}
                  aria-invalid={titleRequiredError}
                />
                {titleRequiredError ? <span className="product-create__field-error">Название товара обязательно.</span> : null}
              </label>

              <div className="product-create__line3">
                <label className="product-create__field">
                  <span>Вес (граммы)</span>
                  <input
                    value={draft.weightGrams}
                    onChange={(event) => onSetField("weightGrams", event.target.value)}
                    inputMode="numeric"
                    disabled={isHydrating || isCreating}
                  />
                </label>
                <div className="designers-combobox-wrap product-create__brand-wrap" onBlur={scheduleDesignerClose}>
                  <label className="product-create__field">
                    <span>Дизайнер</span>
                    <input
                      list="product-create-designer-options"
                      value={draft.designerName}
                      onFocus={() => setDesignerComboboxOpen(true)}
                      onChange={(event) => {
                        onSetField("designerName", event.target.value);
                        setDesignerComboboxOpen(true);
                      }}
                      disabled={isHydrating || isCreating}
                    />
                  </label>
                  {designerComboboxOpen ? (
                    <div className="designers-combobox-list" role="listbox">
                      {designerSuggestions.length > 0 ? (
                        designerSuggestions.map((value) => (
                          <button
                            key={`create-designer-${value}`}
                            type="button"
                            className="designers-combobox-item"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              onSetField("designerName", value);
                              setDesignerComboboxOpen(false);
                            }}
                          >
                            {value}
                          </button>
                        ))
                      ) : (
                        <div className="designers-combobox-empty">Нет вариантов</div>
                      )}
                    </div>
                  ) : null}
                  {knownDesignerOptions.length > 0 ? (
                    <datalist id="product-create-designer-options">
                      {knownDesignerOptions.map((designer) => (
                        <option key={`designer-opt-${designer}`} value={designer} />
                      ))}
                    </datalist>
                  ) : null}
                </div>
                <label className="product-create__field">
                  <span>Gender</span>
                  <select
                    value={draft.gender}
                    onChange={(event) => onSetField("gender", event.target.value as "male" | "female" | "unisex")}
                    disabled={isHydrating || isCreating}
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="unisex">Унисекс</option>
                  </select>
                </label>
                <label className="product-create__field">
                  <span>Режим продажи</span>
                  <select
                    value={draft.availabilityMode}
                    onChange={(event) => onSetField("availabilityMode", event.target.value as "in_stock" | "by_order")}
                    disabled={isHydrating || isCreating}
                  >
                    <option value="in_stock">В наличии</option>
                    <option value="by_order">Под заказ</option>
                  </select>
                </label>

              </div>

              <div className="product-create__favorite">
                <label
                  className="ui-switch ui-switch--compact product-create__bind-sync"
                  title={bindSyncDisabledReason || undefined}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(draft.bindSync)}
                    disabled={!boundFromSourceLookup || hasExistingLookupProduct || isHydrating || isCreating}
                    onChange={(event) => onSetField("bindSync", event.target.checked)}
                  />
                  <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                  <span className="ui-switch-text">Привязать синхронизацию</span>
                </label>
                <button
                  type="button"
                  className={draft.favorite ? "icon-btn icon-btn--active" : "icon-btn"}
                  title="Выбрать избранные категории"
                  onClick={() => setFavoritePickerOpen((prev) => !prev)}
                  disabled={isHydrating || isCreating}
                >
                  <IconStar className="icon-svg" />
                </button>
                {favoritePickerOpen ? (
                  <div className="star-picker" role="dialog" aria-label="Выбор избранных категорий">
                    <div className="star-picker-head">
                      <strong>Избранные категории</strong>
                      <button type="button" className="icon-btn" onClick={() => setFavoritePickerOpen(false)} title="Закрыть">
                        <IconClose className="icon-svg" />
                      </button>
                    </div>
                    {favoriteCategoryOptions.map((option) => (
                      <label key={option.slug} className="star-picker-option">
                        <input
                          type="checkbox"
                          checked={favoriteCategorySlugs.includes(option.slug)}
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
            </div>

            <div className="product-create__editor-right">
              <label className="product-create__field product-create__field--description">
                <span>Описание товара (text)</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => onSetField("description", event.target.value)}
                  disabled={isHydrating || isCreating}
                />
              </label>
              <label className="product-create__field product-create__field--description">
                <span>Описание товара (HTML)</span>
                <textarea
                  value={draft.descriptionHtml}
                  onChange={(event) => onSetField("descriptionHtml", event.target.value)}
                  disabled={isHydrating || isCreating}
                />
              </label>
              <div className="product-create__line3">
                <label className="product-create__field">
                  <span>Ручная цена, RUB</span>
                  <input
                    value={draft.manualPriceRub}
                    onChange={(event) => onSetField("manualPriceRub", event.target.value)}
                    inputMode="decimal"
                    disabled={isHydrating || isCreating}
                  />
                </label>
                <label className="product-create__field">
                  <span>Старая цена, RUB</span>
                  <input
                    value={draft.manualCompareAtPriceRub}
                    onChange={(event) => onSetField("manualCompareAtPriceRub", event.target.value)}
                    inputMode="decimal"
                    disabled={isHydrating || isCreating}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className={`product-create__images${draft.bindSync ? " product-create__section-disabled" : ""}`}>
          <h4 className="product-create__images-title">Фотографии</h4>
          <div className="product-create__images-grid">
            {draft.images.map((image) => (
              <div key={image.id} className="product-create__image-tile">
                <button
                  type="button"
                  className="product-create__image-open"
                  aria-label="Открыть фото"
                  onClick={() => onZoomImage(image.url)}
                >
                  <ImageWithFallback
                    src={optimizeImageUrl(image.url, { width: 240, height: 240, quality: 55 })}
                    alt="product"
                    className="product-create__image-preview"
                    placeholderClassName="manual-product-media product-create__thumb-fallback"
                    placeholderText="Нет фото"
                  />
                </button>
                <button
                  type="button"
                  className="product-create__image-remove"
                  aria-label="Удалить фото"
                  onClick={() => onRemoveImage(image.id)}
                  disabled={draft.bindSync}
                >
                  <IconClose className="icon-svg" />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="product-create__image-tile product-create__image-tile--add"
              onClick={() => fileInputRef.current?.click()}
              disabled={isHydrating || isCreating || draft.bindSync}
            >
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
              onAddManualImage(file);
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
              disabled={isHydrating || isCreating || draft.bindSync}
              onClick={() => {
                onSetField("variants", [
                  ...draft.variants,
                  { id: `v-${Date.now()}`, title: "", price: "", currency: "USD", available: true },
                ]);
              }}
            >
              Добавить вариант
            </button>
          </div>
          <div className="product-create__variants-list">
            {draft.variants.map((variant) => (
              <div key={variant.id} className="product-create__variant-row">
                <input
                  className="input"
                  placeholder="Название варианта"
                  value={variant.title}
                  onChange={(event) =>
                    onSetField(
                      "variants",
                      draft.variants.map((item) => (item.id === variant.id ? { ...item, title: event.target.value } : item))
                    )
                  }
                  disabled={isHydrating || isCreating || draft.bindSync}
                />
                <input
                  className="input"
                  placeholder="Цена"
                  inputMode="decimal"
                  value={variant.price}
                  onChange={(event) =>
                    onSetField(
                      "variants",
                      draft.variants.map((item) => (item.id === variant.id ? { ...item, price: event.target.value } : item))
                    )
                  }
                  disabled={isHydrating || isCreating || draft.bindSync}
                />
                <select
                  className="input"
                  value={variant.currency}
                  onChange={(event) =>
                    onSetField(
                      "variants",
                      draft.variants.map((item) =>
                        item.id === variant.id ? { ...item, currency: event.target.value as ProductCreateVariant["currency"] } : item
                      )
                    )
                  }
                  disabled={isHydrating || isCreating || draft.bindSync}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label className="ui-switch ui-switch--compact">
                  <input
                    type="checkbox"
                    checked={variant.available}
                    onChange={(event) =>
                      onSetField(
                        "variants",
                        draft.variants.map((item) => (item.id === variant.id ? { ...item, available: event.target.checked } : item))
                      )
                    }
                    disabled={isHydrating || isCreating || draft.bindSync}
                  />
                  <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                  <span className="ui-switch-text">В наличии</span>
                </label>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onSetField("variants", draft.variants.filter((item) => item.id !== variant.id))}
                  disabled={isHydrating || isCreating || draft.bindSync || draft.variants.length <= 1}
                >
                  <IconClose className="icon-svg" />
                </button>
              </div>
            ))}
          </div>
          {showValidation && validVariantsCount === 0 ? (
            <span className="product-create__field-error">Добавь хотя бы один вариант с названием и ценой.</span>
          ) : null}
        </section>

        <div className="product-create__actions">
          <button type="button" onClick={onClose} disabled={isCreating}>
            Отменить
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => {
              if (!draft.title.trim() || validVariantsCount === 0) {
                setShowValidation(true);
                return;
              }
              onCreate();
            }}
          >
            {isCreating ? "Создаем..." : "Создать товар"}
          </button>
        </div>
      </div>
    </div>
  );
}
