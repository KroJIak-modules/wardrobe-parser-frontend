import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../shared/empty-state";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { optimizeImageUrl } from "../shared/product-image";
import { getProductPriceSummary, withPriceRangePrefix } from "../shared/product-pricing";
import { SkeletonBlock } from "../shared/skeleton";
import { useAdminBodyScrollLock } from "./hooks/use-admin-body-scroll-lock";
import { IconClose, IconExternalLink, IconEye, IconEyeOff, IconPencil, IconPlus, IconStar } from "../shared/mono-icons";
import type { ServiceProduct } from "../shared/live-data-types";
import type { ProductCreateVariant } from "./hooks/use-admin-product-create";
import {
  isManualVariantCompareAtEnabled,
  MANUAL_VARIANT_CURRENCY_OPTIONS,
  normalizeManualVariantCompareAtValue,
} from "./manual-variant-pricing";

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
  weightGrams: string;
  gender: "male" | "female" | "unisex";
  availabilityMode: "in_stock" | "by_order";
  favorite: boolean;
  bindSync: boolean;
  designerName: string;
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

function parseOptionalDecimal(rawValue: unknown): number | null {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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
  useAdminBodyScrollLock(open);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const designerCloseTimerRef = useRef<number | null>(null);
  const [favoritePickerOpen, setFavoritePickerOpen] = useState<boolean>(false);
  const [designerComboboxOpen, setDesignerComboboxOpen] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const originalPrice = useMemo(() => {
    if (!lookup.product) return "—";
    const summary = getProductPriceSummary(lookup.product);
    return withPriceRangePrefix(
      formatPrice(summary?.source_display_price ?? null, summary?.source_currency ?? "USD"),
      Boolean(summary?.source_has_range),
    );
  }, [lookup.product]);

  const rubPrice = useMemo(() => {
    if (!lookup.product) return "—";
    const summary = getProductPriceSummary(lookup.product);
    return withPriceRangePrefix(
      formatRub(summary?.final_display_price ?? null),
      Boolean(summary?.final_has_range),
    );
  }, [lookup.product]);
  const titleRequiredError = showValidation && !draft.title.trim();
  const validVariantsCount = useMemo(
    () =>
      draft.variants.filter((variant) => {
        const hasTitle = String(variant.title || "").trim().length > 0;
        const price = parseOptionalDecimal(variant.price);
        return hasTitle && price !== null;
      }).length,
    [draft.variants]
  );
  const canCreate = Boolean(draft.title.trim() && validVariantsCount > 0) && !isHydrating && !isCreating;
  const hasExistingLookupProduct = lookup.state === "found" && Number(lookup.product?.id || 0) > 0;
  const hasSourcePreview = lookup.state === "found" && Boolean(lookup.product) && !hasExistingLookupProduct;
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

  const favoriteSummary = "Кастомные каталоги";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal product-create-modal product-create-modal--add" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>Добавить товар</h3>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}>
            <IconClose className="icon-svg" />
          </button>
        </div>

        <section className="product-create__entry">
          <div className="product-create__entry-head">
            <div className="product-create__entry-copy">
              <h4>Сценарий добавления</h4>
              <p>Товар можно заполнить вручную, подтянуть из источника по ссылке или взять существующую карточку за основу.</p>
            </div>
          </div>

          <div className="product-create__entry-grid">
            <article className="product-create__route-card product-create__route-card--primary">
              <div className="product-create__route-head">
                <div>
                  <h5>Импорт из источника</h5>
                  <p>Вставь ссылку магазина, проверь совпадение и при необходимости подтяни поля из источника.</p>
                </div>
              </div>
              <div className="url-fetch-row product-create__source-row">
                <input
                  value={draft.sourceUrl}
                  onChange={(event) => onSetField("sourceUrl", event.target.value)}
                  placeholder="Ссылка на товар магазина-продавца"
                  disabled={isHydrating || isCreating}
                />
                <button
                  type="button"
                  className="mini-btn icon-btn product-create__source-action"
                  aria-label="Заполнить форму данными по ссылке"
                  disabled={!canRunLookup || isHydrating || isCreating}
                  onClick={() => {
                    void onHydrateFromSourceUrl();
                  }}
                >
                  <IconExternalLink className="icon-svg" />
                  <span>Заполнить из ссылки</span>
                </button>
              </div>

              {sourceDomainError ? <p className="product-create__error">{sourceDomainError}</p> : null}
              {matchedSourceDomain ? (
                <div className="product-create__source-meta">
                  <span className="product-create__source-name">{matchedSourceDomain.sourceName}</span>
                  <span className="product-create__source-mode">{matchedSourceDomain.modeLabel}</span>
                </div>
              ) : null}

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

                  {lookup.state === "not_found" ? (
                    <div className="product-create__lookup-state">
                      <strong>В базе такой карточки пока нет.</strong>
                      <span>Можно импортировать данные из источника или просто заполнить форму вручную.</span>
                    </div>
                  ) : null}

                  {hasSourcePreview ? (
                    <div className="product-create__lookup-state product-create__lookup-state--success">
                      <strong>Источник распознан.</strong>
                      <span>Нажми «Заполнить из ссылки», чтобы подтянуть описание, фото и варианты.</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="product-create__route-note">
                  Если ссылка не нужна, оставь поле пустым и переходи к ручному заполнению.
                </div>
              )}
            </article>

            <article className="product-create__route-card">
              <div className="product-create__route-head">
                <div>
                  <h5>Копия существующего товара</h5>
                  <p>Если эта ссылка уже есть в базе, можно взять текущую карточку как основу и переделать ее вручную.</p>
                </div>
              </div>

              {hasExistingLookupProduct && lookup.product ? (
                <div className="product-create__found-row">
                  {lookup.product.image_urls?.[0] ? (
                    <ProductThumb src={lookup.product.image_urls[0]} alt={lookup.product.title || "preview"} />
                  ) : (
                    <div className="manual-product-media product-create__thumb-fallback">
                      <span className="photo-placeholder">Нет фото</span>
                    </div>
                  )}

                  <div className="product-create__found-body">
                    {hasExistingLookupProduct ? (
                      <Link
                        className="product-create__found-title"
                        to={`/product/${lookup.product.id}`}
                        state={{ fromControlPanel: true }}
                      >
                        {lookup.product.title || `Товар #${lookup.product.id}`}
                      </Link>
                    ) : (
                      <span className="product-create__found-title">
                        {lookup.product.title || "Данные источника готовы"}
                      </span>
                    )}
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
                    {hasExistingLookupProduct ? (
                      <>
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
                          aria-label="Скопировать существующий товар"
                          disabled={isHydrating || isCreating}
                          onClick={() => {
                            void onHydrateFromExisting();
                          }}
                        >
                          <IconPencil className="icon-svg" />
                        </button>
                      </>
                    ) : (
                      <span className="product-create__copy-placeholder">Сначала проверь ссылку</span>
                    )}
                  </div>
                </div>
              ) : hasSourcePreview ? (
                <div className="product-create__route-empty product-create__route-empty--centered">
                  <EmptyState compact title="В базе такого товара пока нет." description="Скопировать можно только уже существующий товар." />
                </div>
              ) : lookup.state === "loading" ? (
                <div className="product-create__route-empty product-create__route-empty--centered">
                  <EmptyState compact title="Ищем товар в базе..." />
                </div>
              ) : (
                <div className="product-create__route-empty product-create__route-empty--centered">
                  <EmptyState compact title="Ссылка еще не проверена." />
                </div>
              )}
            </article>

            <article className="product-create__route-card product-create__route-card--manual">
              <div className="product-create__route-head">
                <div>
                  <h5>Ручное заполнение</h5>
                  <p>Подходит для личного товара или когда карточку нужно собрать с нуля без привязки к синхронизации.</p>
                </div>
              </div>
              <div className="product-create__route-note product-create__route-note--manual">
                Ручной товар можно создать вообще без ссылки. Если включить привязку, фото и варианты будут управляться источником.
              </div>
            </article>
          </div>
        </section>

        <div className="product-create__divider" aria-hidden="true" />

        <section className="product-create__editor">
          <div className="product-create__section-head">
            <div>
              <h4>Карточка товара</h4>
            </div>
          </div>
          <div className="product-create__editor-grid">
            <div className="product-create__editor-left">
              <label className="product-create__field product-create__field--title">
                <span>Название товара</span>
                <input
                  value={draft.title}
                  onChange={(event) => onSetField("title", event.target.value)}
                  disabled={isHydrating || isCreating}
                  aria-invalid={titleRequiredError}
                />
                {titleRequiredError ? <span className="product-create__field-error">Название товара обязательно.</span> : null}
              </label>

              <div className="product-create__line2 product-create__line2--wide">
                <div
                  className={`product-create__designer-combobox${designerComboboxOpen ? " product-create__designer-combobox--open" : ""}`}
                  onBlur={scheduleDesignerClose}
                >
                  <label className="product-create__field">
                    <span>Дизайнер</span>
                    <input
                      value={draft.designerName}
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={designerComboboxOpen}
                      aria-controls="product-create-designer-listbox"
                      onFocus={() => setDesignerComboboxOpen(true)}
                      onChange={(event) => {
                        onSetField("designerName", event.target.value);
                        setDesignerComboboxOpen(true);
                      }}
                      disabled={isHydrating || isCreating}
                    />
                  </label>
                  {designerComboboxOpen && designerSuggestions.length > 0 ? (
                    <div
                      id="product-create-designer-listbox"
                      className="product-create__designer-combobox-list"
                      role="listbox"
                      aria-label="Подсказки исходного дизайнера"
                    >
                      {designerSuggestions.map((value) => (
                        <button
                          key={`create-designer-${value}`}
                          type="button"
                          className="product-create__designer-combobox-item"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSetField("designerName", value);
                            setDesignerComboboxOpen(false);
                          }}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <label className="product-create__field">
                  <span>Вес (граммы)</span>
                  <input
                    value={draft.weightGrams}
                    onChange={(event) => onSetField("weightGrams", event.target.value)}
                    inputMode="numeric"
                    disabled={isHydrating || isCreating}
                  />
                </label>
              </div>

              <div className="product-create__line2">
                <label className="product-create__field">
                  <span>Гендер</span>
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
                  className={draft.favorite ? "btn btn-light product-create__favorite-action product-create__favorite-action--active" : "btn btn-light product-create__favorite-action"}
                  title="Кастомные каталоги"
                  onClick={() => setFavoritePickerOpen((prev) => !prev)}
                  disabled={isHydrating || isCreating}
                >
                  <IconStar className="icon-svg" />
                  <span>{favoriteSummary}</span>
                </button>
                {favoritePickerOpen ? (
                  <div className="star-picker" role="dialog" aria-label="Выбор личных каталогов">
                    <div className="star-picker-head">
                      <strong>Кастомные каталоги</strong>
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
              <span className="product-create__bind-sync-note">
                При включении блокируются фото и варианты.
              </span>
            </div>

            <div className="product-create__editor-right">
              <label className="product-create__field product-create__field--description">
                <span>Описание товара</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => onSetField("description", event.target.value)}
                  disabled={isHydrating || isCreating}
                />
              </label>
            </div>
          </div>
        </section>

        <section className={`product-create__images${draft.bindSync ? " product-create__section-disabled" : ""}`}>
          <div className="product-create__section-head">
            <div>
              <h4 className="product-create__images-title">Фотографии</h4>
              {draft.bindSync ? <p>Фото управляются источником и поэтому временно недоступны для ручного редактирования.</p> : null}
            </div>
          </div>
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
            <div className="product-create__variants-copy">
              <h4 className="product-create__images-title">Варианты</h4>
              <p>Цена в RUB считается уже финальной и не проходит через формулу. Старая цена доступна для любой валюты.</p>
              {draft.bindSync ? <p>При активной синхронизации список вариантов берется из источника.</p> : null}
            </div>
            <button
              type="button"
              className="btn btn-light"
              disabled={isHydrating || isCreating || draft.bindSync}
              onClick={() => {
                const lastCurrency = draft.variants[draft.variants.length - 1]?.currency ?? "RUB";
                onSetField("variants", [
                  ...draft.variants,
                  { id: `v-${Date.now()}`, title: "", price: "", compareAtPrice: "", currency: lastCurrency, available: true },
                ]);
              }}
            >
              Добавить вариант
            </button>
          </div>
          <div className="product-create__variants-list">
            {draft.variants.map((variant) => {
              const compareAtEnabled = isManualVariantCompareAtEnabled({
                price: variant.price,
                currency: variant.currency,
              });
              const pricePlaceholder = variant.currency === "RUB" ? "Финальная цена, RUB" : "Цена источника";
              return (
                <div key={variant.id} className="product-create__variant-row">
                  <input
                    className="input product-create__variant-input product-create__variant-input--title"
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
                    className="input product-create__variant-input"
                    placeholder={pricePlaceholder}
                    inputMode="decimal"
                    value={variant.price}
                    onChange={(event) =>
                      onSetField(
                        "variants",
                        draft.variants.map((item) => (
                          item.id === variant.id
                            ? {
                                ...item,
                                price: event.target.value,
                                compareAtPrice: normalizeManualVariantCompareAtValue({
                                  compareAtPrice: item.compareAtPrice,
                                  price: event.target.value,
                                  currency: item.currency,
                                }),
                              }
                            : item
                        ))
                      )
                    }
                    disabled={isHydrating || isCreating || draft.bindSync}
                  />
                  <input
                    className="input product-create__variant-input"
                    placeholder="Старая цена"
                    inputMode="decimal"
                    value={compareAtEnabled ? variant.compareAtPrice : ""}
                    onChange={(event) =>
                      onSetField(
                        "variants",
                        draft.variants.map((item) => (item.id === variant.id ? { ...item, compareAtPrice: event.target.value } : item))
                      )
                    }
                    disabled={isHydrating || isCreating || draft.bindSync || !compareAtEnabled}
                    title={compareAtEnabled ? undefined : "Сначала укажи цену варианта."}
                  />
                  <select
                    className="input product-create__variant-input product-create__variant-input--currency"
                    value={variant.currency}
                    onChange={(event) =>
                      onSetField(
                        "variants",
                        draft.variants.map((item) =>
                          item.id === variant.id
                            ? {
                                ...item,
                                currency: event.target.value as ProductCreateVariant["currency"],
                                compareAtPrice: normalizeManualVariantCompareAtValue({
                                  compareAtPrice: item.compareAtPrice,
                                  price: item.price,
                                  currency: event.target.value,
                                }),
                              }
                            : item
                        )
                      )
                    }
                    disabled={isHydrating || isCreating || draft.bindSync}
                  >
                    {MANUAL_VARIANT_CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label className="ui-switch ui-switch--compact product-create__variant-switch">
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
                    className="icon-btn product-create__variant-remove"
                    onClick={() => onSetField("variants", draft.variants.filter((item) => item.id !== variant.id))}
                    disabled={isHydrating || isCreating || draft.bindSync || draft.variants.length <= 1}
                  >
                    <IconClose className="icon-svg" />
                  </button>
                </div>
              );
            })}
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
