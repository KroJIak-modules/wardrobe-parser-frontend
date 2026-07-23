import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { getProductPrimaryImageUrl } from "../shared/product-image";
import { getProductPriceSummary, withPriceRangePrefix } from "../shared/product-pricing";
import { getProductSourceLabel } from "../shared/product-source-label";
import { AdminTableSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import {
  buildHiddenProductWriteState,
  canSwitchAvailabilityToInStock,
  getAvailabilityModeLockedReason,
  type ProductWriteState,
} from "../shared/product-state";
import type { AdminProductsTableItem } from "./admin-types";
import { captureAdminProductsReturnState } from "./admin-products-return-state";
import { FloatingPopover } from "./floating-popover";
import { deriveStatusAfterUnhide } from "./showcase-catalog-helpers";
import "./admin-action-popover.css";
import "./admin-products-table.css";

type SourceLabel = {
  name: string;
};

type StatePill = {
  label: string;
  cls: string;
};

type Props = {
  tableLoading: boolean;
  tableProducts: AdminProductsTableItem[];
  productsReturnHref: string;
  sourceById: Map<number, SourceLabel>;
  tableLoadingMore: boolean;
  productsSentinelRef: RefObject<HTMLDivElement | null>;
  deletingProductId: number | null;
  statusUpdatingProductId: number | null;
  onDeleteProduct: (productId: number) => Promise<boolean>;
  onUpdateProductStatus: (productId: number, state: ProductWriteState) => Promise<boolean>;
};

function formatPriceSummary(price: number | null | undefined, currency: string | null | undefined, hasRange: boolean): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return "—";
  }
  const normalizedCurrency = String(currency || "").trim().toUpperCase() || "RUB";
  const rounded = normalizedCurrency === "RUB" ? Math.round(Number(price)) : Number(price);
  return withPriceRangePrefix(`${rounded} ${normalizedCurrency}`, hasRange);
}

function visibilityPill(product: AdminProductsTableItem): StatePill {
  const hidden = String(product.visibility_status || "").trim().toLowerCase() === "hidden";
  return hidden
    ? { label: "Скрыт", cls: "status-pill status-pill--muted" }
    : { label: "Показан", cls: "status-pill status-pill--visible" };
}

function availabilityPill(product: AdminProductsTableItem): StatePill {
  const mode = String(product.availability_mode || "").trim().toLowerCase();
  return mode === "by_order"
    ? { label: "Под заказ", cls: "status-pill status-pill--warn" }
    : { label: "В наличии", cls: "status-pill status-pill--ok" };
}

function orderabilityPill(product: AdminProductsTableItem): StatePill {
  const status = String(product.orderability_status || "").trim().toLowerCase();
  if (status === "unavailable") {
    return { label: "Недоступен", cls: "status-pill status-pill--bad" };
  }
  if (status === "sold_out") {
    return { label: "Распродан", cls: "status-pill status-pill--warn" };
  }
  return { label: "Доступен", cls: "status-pill status-pill--ok" };
}

function unavailableReasonRu(reason: string | null | undefined): string | null {
  const normalized = String(reason || "").trim().toLowerCase();
  if (!normalized) {
    return "Причина недоступности не указана";
  }
  if (normalized === "missing_weight") {
    return "Не указан вес товара";
  }
  if (normalized === "missing_images") {
    return "У товара нет ни одной фотографии";
  }
  if (normalized === "missing_source_price") {
    return "У товара не указана цена";
  }
  if (normalized === "missing_final_price") {
    return "Не удалось рассчитать итоговую цену";
  }
  if (normalized === "missing_currency") {
    return "Не указана валюта товара";
  }
  if (normalized === "unsupported_currency") {
    return "У товара указана неподдерживаемая валюта";
  }
  if (normalized === "invalid_fx_settings") {
    return "Не настроен курс валют для расчета цены";
  }
  if (normalized === "source_removed") {
    return "Товар больше не найден в источнике";
  }
  if (normalized === "missing_variants") {
    return "У товара нет доступных вариантов";
  }
  if (normalized === "product_not_found") {
    return "Товар не найден";
  }
  if (normalized === "dedup_combined_source") {
    return "Товар отключен после объединения дубликатов";
  }
  if (normalized === "dedup_hidden_by_keep") {
    return "Товар отключен решением оставить другой дубль";
  }
  return `Техническая причина: ${normalized}`;
}

function pricingReasonRu(reason: string | null | undefined): string | null {
  const normalized = String(reason || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "missing_source_price") {
    return "У источника нет цены";
  }
  if (normalized === "missing_weight") {
    return "Не хватает веса для расчета";
  }
  if (normalized === "missing_supplier") {
    return "У источника не назначен поставщик";
  }
  if (normalized === "missing_tariff") {
    return "У поставщика нет тарифов доставки";
  }
  if (normalized === "unsupported_currency") {
    return "Валюта источника не поддерживается";
  }
  if (normalized === "invalid_fx_settings") {
    return "Некорректные валютные настройки";
  }
  if (normalized.startsWith("pricing_error:")) {
    return "Внутренняя ошибка расчета цены";
  }
  return `Техническая причина: ${normalized}`;
}

function DeleteConfirmPopover({
  anchorRef,
  open,
  title,
  deleting,
  onConfirm,
  onClose,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  title: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <FloatingPopover anchorRef={anchorRef} open={open} className="admin-action-popover" onClose={onClose}>
      <p className="admin-action-popover__title">Удалить товар?</p>
      <p className="admin-action-popover__text">
        {title ? `Вы точно хотите удалить «${title}»?` : "Вы точно хотите удалить этот товар?"}
      </p>
      <div className="admin-action-popover__actions">
        <button type="button" className="admin-action-popover__button admin-action-popover__button--danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Удаляем..." : "Да, удалить"}
        </button>
        <button type="button" className="admin-action-popover__button" onClick={onClose} disabled={deleting}>
          Отмена
        </button>
      </div>
    </FloatingPopover>
  );
}

function AdminProductsTableRow({
  product,
  productsReturnHref,
  loadedCount,
  sourceById,
  deleting,
  updatingStatus,
  onDeleteProduct,
  onUpdateProductStatus,
}: {
  product: AdminProductsTableItem;
  productsReturnHref: string;
  loadedCount: number;
  sourceById: Map<number, SourceLabel>;
  deleting: boolean;
  updatingStatus: boolean;
  onDeleteProduct: (productId: number) => Promise<boolean>;
  onUpdateProductStatus: (productId: number, state: ProductWriteState) => Promise<boolean>;
}) {
  const deleteAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  const visibility = visibilityPill(product);
  const availability = availabilityPill(product);
  const orderability = orderabilityPill(product);
  const priceSummary = getProductPriceSummary(product);
  const sourcePrice = priceSummary?.source_display_price ?? null;
  const sourceCurrency = priceSummary?.source_currency ?? null;
  const finalPrice = priceSummary?.final_display_price ?? null;
  const finalCurrency = priceSummary?.final_currency ?? "RUB";
  const finalPriceReason = finalPrice === null ? pricingReasonRu(product.pricing_reason) : null;
  const source = product.source_id === null ? undefined : sourceById.get(product.source_id);
  const sourceLabel = getProductSourceLabel({
    sourceName: product.source_name || source?.name,
    sourceMode: product.source_mode,
    emptyLabel: "—",
  });
  const adminProductHref = `/product/${product.id}`;
  const orderabilityStatus = String(product.orderability_status || "").trim().toLowerCase();
  const unavailableReason = orderabilityStatus === "unavailable" ? unavailableReasonRu(product.status_reason) : null;
  const hidden = String(product.visibility_status || "").trim().toLowerCase() === "hidden";
  const canSwitchToInStock = canSwitchAvailabilityToInStock(orderabilityStatus);
  const availabilityLockedReason = getAvailabilityModeLockedReason(orderabilityStatus);
  const externalProductUrl = toExternalHttpUrl(product.url);
  const assignedCatalogsAndFilters = (product.internal_category_names || [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const sourceTags = (product.source_tags || [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const rememberTableState = () => {
    captureAdminProductsReturnState({
      href: productsReturnHref,
      scrollY: window.scrollY,
      loadedCount,
    });
  };

  useEffect(() => {
    if (!deleting) {
      return;
    }
    setDeleteConfirmOpen(false);
  }, [deleting]);

  const toggleVisibility = () => {
    const nextState = hidden
      ? deriveStatusAfterUnhide((product as { variants?: unknown }).variants, product)
      : buildHiddenProductWriteState(product);
    void onUpdateProductStatus(product.id, nextState);
  };

  const toggleAvailability = () => {
    const currentAvailabilityMode = String(product.availability_mode || "").trim().toLowerCase() === "by_order" ? "by_order" : "in_stock";
    const nextAvailabilityMode = currentAvailabilityMode === "by_order" ? "in_stock" : "by_order";
    if (nextAvailabilityMode === "in_stock" && !canSwitchToInStock) {
      return;
    }
    void onUpdateProductStatus(product.id, {
      visibility_status: hidden ? "hidden" : "visible",
      availability_mode: nextAvailabilityMode,
    });
  };

  return (
    <tr>
      <td>
        <Link
          className="thumb-mini-link"
          to={adminProductHref}
          state={{ fromControlPanel: true, adminReturnHref: productsReturnHref }}
          title={unavailableReason || undefined}
          onClick={rememberTableState}
        >
          <ImageWithFallback
            src={getProductPrimaryImageUrl(product, { w: 216, h: 288, q: 55 })}
            alt={product.title}
            className="thumb-mini-image"
            placeholderClassName="thumb-mini photo-placeholder"
            placeholderText={product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}
            loadingText={product.image_count > 0 ? "Загружаем..." : "Нет фото"}
          />
        </Link>
      </td>
      <td>
        <Link
          className="btn-link"
          to={adminProductHref}
          state={{ fromControlPanel: true, adminReturnHref: productsReturnHref }}
          title={unavailableReason || undefined}
          onClick={rememberTableState}
        >
          {product.title}
        </Link>
      </td>
      <td>
        {externalProductUrl ? (
          <a className="btn-link" href={externalProductUrl} target="_blank" rel="noreferrer">
            {sourceLabel}
          </a>
        ) : (
          sourceLabel
        )}
      </td>
      <td>
        {assignedCatalogsAndFilters.length > 0
          ? assignedCatalogsAndFilters.join(", ")
          : ((product.internal_category_name || "").trim() || "—")}
      </td>
      <td>
        <div>{(product.display_designer_name || product.designer_name || product.source_designer_name || "").trim() || "—"}</div>
        <div className="muted">{(product.source_category_name || "").trim() || "—"}</div>
        <div className="muted">{sourceTags.length > 0 ? sourceTags.join(", ") : "—"}</div>
      </td>
      <td>
        <div className="status-stack">
          <button
            type="button"
            className={`${visibility.cls} products-table-status-btn products-table-status-btn--state-pill`}
            onClick={toggleVisibility}
            disabled={updatingStatus}
            title={hidden ? "Показать товар" : "Скрыть товар"}
            aria-pressed={!hidden}
          >
            {visibility.label}
          </button>
          <button
            type="button"
            className={`${availability.cls} products-table-status-btn products-table-status-btn--state-pill`}
            onClick={toggleAvailability}
            disabled={updatingStatus || (String(product.availability_mode || "").trim().toLowerCase() === "by_order" && !canSwitchToInStock)}
            title={
              String(product.availability_mode || "").trim().toLowerCase() === "by_order"
                ? (availabilityLockedReason || "Переключить на В наличии")
                : "Переключить на Под заказ"
            }
            aria-pressed={String(product.availability_mode || "").trim().toLowerCase() === "by_order"}
          >
            {availability.label}
          </button>
          <span className={orderability.cls} title={unavailableReason || undefined}>
            {orderability.label}
          </span>
        </div>
      </td>
      <td>
        {formatPriceSummary(sourcePrice, sourceCurrency, Boolean(priceSummary?.source_has_range))}
      </td>
      <td title={finalPriceReason || undefined}>
        <div className="products-table-price-main">
          <div>{formatPriceSummary(finalPrice, finalCurrency, Boolean(priceSummary?.final_has_range))}</div>
          {finalPriceReason ? <div className="muted">{finalPriceReason}</div> : null}
        </div>
      </td>
      <td className="products-table-actions-cell">
        <div className="products-table-actions">
          <Link
            className="products-table-icon-btn"
            to={adminProductHref}
            state={{ openEditMode: true, fromControlPanel: true, adminReturnHref: productsReturnHref }}
            title={unavailableReason || "Открыть товар сразу в режиме редактирования"}
            aria-label="Редактировать товар"
            onClick={rememberTableState}
          >
            <Pencil className="icon-svg" />
          </Link>
          <button
            ref={deleteAnchorRef}
            type="button"
            className="products-table-icon-btn products-table-icon-btn--danger"
            onClick={() => setDeleteConfirmOpen((current) => !current)}
            disabled={deleting}
            title="Удалить товар"
            aria-label="Удалить товар"
          >
            <Trash2 className="icon-svg" />
          </button>
          <DeleteConfirmPopover
            anchorRef={deleteAnchorRef}
            open={deleteConfirmOpen}
            title={product.title}
            deleting={deleting}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={() => {
              void onDeleteProduct(product.id);
            }}
          />
        </div>
      </td>
    </tr>
  );
}

export function AdminProductsTable({
  tableLoading,
  tableProducts,
  productsReturnHref,
  sourceById,
  tableLoadingMore,
  productsSentinelRef,
  deletingProductId,
  statusUpdatingProductId,
  onDeleteProduct,
  onUpdateProductStatus,
}: Props) {
  return (
    <div className="table-wrap table-wrap--spaced">
      <table className="products-table">
        <thead>
          <tr>
            <th>Фото</th>
            <th>Название</th>
            <th>Сайт</th>
            <th>Кастомные каталоги / фильтры</th>
            <th>Дизайнер / source категория и теги</th>
            <th>Состояние</th>
            <th>Оригинальная цена</th>
            <th>Итоговая цена (RUB)</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {tableProducts.map((product) => (
            <AdminProductsTableRow
              key={product.id}
              product={product}
              productsReturnHref={productsReturnHref}
              loadedCount={tableProducts.length}
              sourceById={sourceById}
              deleting={deletingProductId === product.id}
              updatingStatus={statusUpdatingProductId === product.id}
              onDeleteProduct={onDeleteProduct}
              onUpdateProductStatus={onUpdateProductStatus}
            />
          ))}
        </tbody>
      </table>
      {!tableLoading && tableProducts.length === 0 ? (
        <EmptyState compact title="По текущим фильтрам товаров нет" />
      ) : null}
      {tableLoadingMore ? <AdminTableSkeleton rows={3} cols={9} portraitThumbs /> : null}
      <div ref={productsSentinelRef} className="products-sentinel" />
    </div>
  );
}
