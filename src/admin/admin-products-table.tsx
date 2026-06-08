import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { toExternalHttpUrl } from "../shared/external-links";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { getProductPrimaryImageUrl } from "../shared/product-image";
import { AdminTableSkeleton } from "../shared/skeleton";
import { EmptyState } from "../shared/empty-state";
import type { AdminProductsTableItem } from "./admin-types";

type StatusBadge = {
  cls: string;
  label: string;
};

type SourceLabel = {
  name: string;
};

type Props = {
  tableLoading: boolean;
  tableProducts: AdminProductsTableItem[];
  sourceById: Map<number, SourceLabel>;
  statusBadge: (status: string) => StatusBadge;
  tableLoadingMore: boolean;
  productsSentinelRef: RefObject<HTMLDivElement | null>;
};

export function AdminProductsTable({
  tableLoading,
  tableProducts,
  sourceById,
  statusBadge,
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
            <th>Локальная категория</th>
            <th>Категория/Бренд</th>
            <th>Статус</th>
            <th>Оригинальная цена</th>
            <th>Итоговая цена (RUB)</th>
          </tr>
        </thead>
        <tbody>
          {tableProducts.map((product) => {
            const status = statusBadge(product.status);
            const sourcePrice = product.source_price;
            const sourceCurrency = product.source_currency;
            const finalPrice = product.final_price ?? null;
            const finalCurrency = product.final_currency ?? "RUB";
            const source = sourceById.get(product.source_id);
            const sourceLabel = String(product.source_name || "").trim() || source?.name || `#${product.source_id}`;
            const adminProductHref = `/product/${product.id}?from=admin`;
            const isUnavailable = String(product.status || "").trim().toLowerCase() === "unavailable";
            const externalProductUrl = toExternalHttpUrl(product.url);
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
                  {isUnavailable ? (
                    <span>{product.title}</span>
                  ) : (
                    <Link className="btn-link" to={adminProductHref}>
                      {product.title}
                    </Link>
                  )}
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
                <td>{product.product_type || "-"}</td>
                <td>{(product.internal_category_name || "").trim() || "Прочее"}</td>
                <td>
                  <span className={status.cls}>{status.label}</span>
                </td>
                <td>
                  {sourcePrice ?? "-"} {sourceCurrency ?? "-"}
                </td>
                <td>{finalPrice === null ? "-" : `${Math.round(finalPrice)} ${finalCurrency || "RUB"}`}</td>
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
