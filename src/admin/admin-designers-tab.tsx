import { useMemo, useState } from "react";
import type { AdminDesignerMappingRow } from "./admin-types";
import { EmptyState } from "../shared/empty-state";

type Props = {
  loading: boolean;
  rows: AdminDesignerMappingRow[];
  onChangeCatalogTitle: (sourceBrand: string, catalogTitle: string) => void;
  onChangeCatalogDescription: (sourceBrand: string, catalogDescription: string) => void;
  onToggleIncludeInDesigners: (sourceBrand: string, includeInDesigners: boolean) => void;
};

export function AdminDesignersTab({
  loading,
  rows,
  onChangeCatalogTitle,
  onChangeCatalogDescription,
  onToggleIncludeInDesigners,
}: Props) {
  const [search, setSearch] = useState<string>("");

  const rowsByCatalogTitle = useMemo(() => {
    const groups = new Map<string, AdminDesignerMappingRow[]>();
    for (const row of rows) {
      const key = String(row.catalog_title || "").trim().toLowerCase();
      if (!key) {
        continue;
      }
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }
    return groups;
  }, [rows]);

  const catalogProductCountByTitle = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = String(row.catalog_title || "").trim().toLowerCase();
      if (!key) {
        continue;
      }
      counts.set(key, (counts.get(key) ?? 0) + row.source_product_count);
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const source = String(row.source_brand || "").toLowerCase();
      const title = String(row.catalog_title || "").toLowerCase();
      const description = String(row.catalog_description || "").toLowerCase();
      return source.includes(query) || title.includes(query) || description.includes(query);
    });
  }, [rows, search]);

  const getProductCountLabel = (count: number) => {
    const absCount = Math.abs(count) % 100;
    const lastDigit = absCount % 10;

    if (absCount >= 11 && absCount <= 19) {
      return "товаров";
    }
    if (lastDigit === 1) {
      return "товар";
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return "товара";
    }
    return "товаров";
  };

  const formatProductCount = (count: number) => `${count} ${getProductCountLabel(count)}`;

  return (
    <div className="card designers-tab-card">
      <div className="designers-tab-head">
        <div className="designers-tab-title-block">
          <h2>Дизайнеры</h2>
          <div className="designers-tab-summary">
            <span className="designers-tab-pill">{rows.length} брендов</span>
            {rows.length > 0 || loading ? (
              <input
                className="input designers-tab-search"
                placeholder="Поиск по бренду, названию или описанию"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="designers-list">
        {loading ? <p className="muted">Загрузка дизайнеров...</p> : null}
        {!loading && filteredRows.length === 0 ? <EmptyState compact title="Ничего не найдено" /> : null}
        {!loading
          ? filteredRows.map((row) => {
              const catalogTitleKey = String(row.catalog_title || "").trim().toLowerCase();
              const relatedRows =
                rowsByCatalogTitle
                  .get(catalogTitleKey)
                  ?.filter((candidate) => candidate.source_brand !== row.source_brand)
                  .map((candidate) => candidate.source_brand) ?? [];
              const nextCatalogProductCount = catalogProductCountByTitle.get(catalogTitleKey) ?? row.source_product_count;
              const currentCatalogProductCount = Math.max(0, nextCatalogProductCount - row.source_product_count);

              return (
                <article
                  key={row.source_brand}
                  className={row.include_in_designers ? "designers-item designers-item--enabled" : "designers-item"}
                >
                  <div className="designers-item__header">
                    <label className="ui-switch designers-item__toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(row.include_in_designers)}
                        onChange={(event) => onToggleIncludeInDesigners(row.source_brand, event.target.checked)}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">{row.include_in_designers ? "Включен" : "Выключен"}</span>
                    </label>
                  </div>

                  <div className="designers-item__fields">
                    <div className="designers-item__field">
                      <span className="designers-item__label">Прошлое название</span>
                      <div className="designers-item__field-body">
                        <div className="designers-item__readonly">{row.source_brand}</div>
                        <span className="designers-item__count-pill">{formatProductCount(row.source_product_count)}</span>
                      </div>
                    </div>

                    <label className="designers-item__field">
                      <span className="designers-item__label">Новое название страницы каталога</span>
                      <div className="designers-item__field-body">
                        <input
                          className="input"
                          value={row.catalog_title}
                          onChange={(event) => onChangeCatalogTitle(row.source_brand, event.target.value)}
                          placeholder="Например, Rick Owens"
                        />
                        <span className="designers-item__count-pill">
                          {`${nextCatalogProductCount} ${getProductCountLabel(nextCatalogProductCount)} (${currentCatalogProductCount} + ${row.source_product_count})`}
                        </span>
                      </div>
                    </label>

                    {relatedRows.length > 0 ? (
                      <div className="designers-item__field designers-item__field--related">
                        <span className="designers-item__label">Дизайнеры с таким же названием</span>
                        <div className="designers-item__related-list">
                          {relatedRows.map((sourceBrand) => (
                            <span key={`${row.source_brand}-${sourceBrand}`} className="designers-item__related-pill">
                              {sourceBrand}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <label className="designers-item__field designers-item__field--description">
                      <span className="designers-item__label">Описание</span>
                      <textarea
                        rows={3}
                        value={row.catalog_description}
                        onChange={(event) => onChangeCatalogDescription(row.source_brand, event.target.value)}
                        placeholder="Описание каталога для сценариев, где оно потребуется."
                      />
                    </label>
                  </div>
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}
