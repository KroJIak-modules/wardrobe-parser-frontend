import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { getProductPrimaryImageUrl } from "../shared/product-image";
import { AdminTableSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import type { AdminProductsTableItem } from "./admin-types";
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
  sourceById: Map<number, SourceLabel>;
  tableLoadingMore: boolean;
  productsSentinelRef: RefObject<HTMLDivElement | null>;
};

function visibilityPill(product: AdminProductsTableItem): StatePill {
  const hidden = String(product.visibility_status || "").trim().toLowerCase() === "hidden";
  return hidden
    ? { label: "Скрыт", cls: "status-pill status-pill--muted" }
    : { label: "Показан", cls: "status-pill status-pill--ok" };
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

function lifecyclePill(product: AdminProductsTableItem): StatePill | null {
  return String(product.lifecycle_status || "").trim().toLowerCase() === "merged"
    ? { label: "Объединен", cls: "status-pill status-pill--muted" }
    : null;
}

function unavailableReasonRu(reason: string | null | undefined): string | null {
  const normalized = String(reason || "").trim().toLowerCase();
  if (!normalized) {
    return "Причина недоступности не указана";
  }
  if (normalized === "missing_weight") {
    return "Не указан вес товара";
  }
  if (normalized === "missing_currency") {
    return "Не указана валюта товара";
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

export function AdminProductsTable({
  tableLoading,
  tableProducts,
  sourceById,
  tableLoadingMore,
  productsSentinelRef,
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
          </tr>
        </thead>
        <tbody>
          {tableProducts.map((product) => {
            const visibility = visibilityPill(product);
            const availability = availabilityPill(product);
            const orderability = orderabilityPill(product);
            const lifecycle = lifecyclePill(product);
            const sourcePrice = product.source_price;
            const sourceCurrency = product.source_currency;
            const finalPrice = product.final_price ?? null;
            const finalCurrency = product.final_currency ?? "RUB";
            const finalPriceReason = finalPrice === null ? pricingReasonRu(product.pricing_reason) : null;
            const source = product.source_id === null ? undefined : sourceById.get(product.source_id);
            const sourceLabel = String(product.source_name || "").trim() || source?.name || (product.source_id === null ? "—" : `#${product.source_id}`);
            const adminProductHref = `/product/${product.id}?from=admin`;
            const orderabilityStatus = String(product.orderability_status || "").trim().toLowerCase();
            const unavailableReason = orderabilityStatus === "unavailable" ? unavailableReasonRu(product.status_reason) : null;
            const externalProductUrl = toExternalHttpUrl(product.url);
            const assignedCatalogsAndFilters = (product.internal_category_names || [])
              .map((item) => String(item || "").trim())
              .filter(Boolean);
            const sourceTags = (product.source_tags || [])
              .map((item) => String(item || "").trim())
              .filter(Boolean);
            return (
              <tr key={product.id}>
                <td>
                  <Link className="thumb-mini-link" to={adminProductHref}>
                    <ImageWithFallback
                      src={getProductPrimaryImageUrl(product, { w: 180, h: 180, q: 55 })}
                      alt={product.title}
                      className="thumb-mini-image"
                      placeholderClassName="thumb-mini photo-placeholder"
                      placeholderText={product.image_count > 0 ? `${product.image_count} фото` : "Нет фото"}
                      loadingText={product.image_count > 0 ? "Загружаем..." : "Нет фото"}
                    />
                  </Link>
                </td>
                <td>
                  <Link className="btn-link" to={adminProductHref}>
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
                    <span className={visibility.cls}>{visibility.label}</span>
                    <span className={availability.cls}>{availability.label}</span>
                    <span className={orderability.cls} title={unavailableReason || undefined}>
                      {orderability.label}
                    </span>
                    {lifecycle ? <span className={lifecycle.cls}>{lifecycle.label}</span> : null}
                  </div>
                </td>
                <td>
                  {sourcePrice ?? "-"} {sourceCurrency ?? "-"}
                </td>
                <td title={finalPriceReason || undefined}>
                  <div>{finalPrice === null ? "—" : `${Math.round(finalPrice)} ${finalCurrency || "RUB"}`}</div>
                  {finalPriceReason ? <div className="muted">{finalPriceReason}</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!tableLoading && tableProducts.length === 0 ? (
        <EmptyState compact title="По текущим фильтрам товаров нет" />
      ) : null}
      {tableLoadingMore ? <AdminTableSkeleton rows={3} cols={8} /> : null}
      <div ref={productsSentinelRef} className="products-sentinel" />
    </div>
  );
}
