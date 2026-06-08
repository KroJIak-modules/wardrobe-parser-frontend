import { IconPlus } from "../shared/mono-icons";
import { AdminSectionSkeleton } from "../shared/skeleton";
import type { CategoryManualProduct } from "../shared/live-data-context";
import { toExternalHttpUrl } from "../shared/external-links";
import { toCompressedThumbUrl } from "./admin-formatters";
import { EmptyState } from "../shared/empty-state";

type Props = {
  manualSearchInput: string;
  setManualSearchInput: (value: string) => void;
  manualSearchLoading: boolean;
  manualSearchResults: CategoryManualProduct[];
  onAddManualProduct: (productId: number) => Promise<void>;
  manualAssignedLoading: boolean;
  manualAssignedProducts: CategoryManualProduct[];
  onRemoveManualProduct: (productId: number) => Promise<void>;
  disabled: boolean;
};

function ManualProductRow({
  item,
  action,
  actionLabel,
  icon,
}: {
  item: CategoryManualProduct;
  action: () => Promise<void>;
  actionLabel: string;
  icon?: boolean;
}) {
  const categoryLabel = item.category_names.length > 0 ? item.category_names.join(", ") : "Прочее";
  const sourceHref = toExternalHttpUrl(item.url);
  return (
    <div className="manual-product-row">
      <div className="manual-product-media">
        {item.image_url ? (
          <img
            src={toCompressedThumbUrl(item.image_url, 120, 120, 55) || item.image_url}
            alt={item.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <span className="manual-product-media-placeholder photo-placeholder">Нет фото</span>
        )}
      </div>
      <div className="manual-product-main">
        <a href={`/product/${item.product_id}?from=admin`} target="_blank" rel="noreferrer">
          {item.title}
        </a>
        <p className="muted">
          {sourceHref ? (
            <a href={sourceHref} target="_blank" rel="noreferrer">
              {item.source_name || `Source #${item.source_id}`}
            </a>
          ) : (
            <span>{item.source_name || `Source #${item.source_id}`}</span>
          )}
        </p>
        <p className="muted">{categoryLabel}</p>
      </div>
      <button type="button" onClick={() => void action()}>
        {icon ? <IconPlus className="icon-svg icon-svg--sm" /> : actionLabel}
      </button>
    </div>
  );
}

export function AdminCategoryManualProducts({
  manualSearchInput,
  setManualSearchInput,
  manualSearchLoading,
  manualSearchResults,
  onAddManualProduct,
  manualAssignedLoading,
  manualAssignedProducts,
  onRemoveManualProduct,
  disabled,
}: Props) {
  return (
    <>
      <h4 className="category-section-title">Ручное добавление товаров в категорию</h4>
      <div className="form">
        <input
          value={manualSearchInput}
          onChange={(event) => setManualSearchInput(event.target.value)}
          placeholder="Поиск"
          disabled={disabled}
        />
      </div>
      {manualSearchLoading ? <AdminSectionSkeleton rows={2} /> : null}
      {!manualSearchLoading && manualSearchInput.trim() && manualSearchResults.length === 0 ? (
        <EmptyState compact title="Ничего не найдено" subtitle="Попробуй изменить поисковый запрос." />
      ) : null}
      {manualSearchResults.map((item) => (
        <ManualProductRow
          key={`manual-search-${item.product_id}`}
          item={item}
          action={() => onAddManualProduct(item.product_id)}
          actionLabel="Добавить"
          icon
        />
      ))}

      {manualAssignedLoading || manualAssignedProducts.length > 0 ? <p className="muted">Добавленные товары</p> : null}
      {manualAssignedLoading ? <AdminSectionSkeleton rows={2} /> : null}
      {manualAssignedProducts.map((item) => (
        <ManualProductRow
          key={`manual-added-${item.product_id}`}
          item={item}
          action={() => onRemoveManualProduct(item.product_id)}
          actionLabel="Удалить"
        />
      ))}
    </>
  );
}
