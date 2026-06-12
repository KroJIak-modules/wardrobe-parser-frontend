import { useMemo, useState } from "react";
import type { AdminDesignerCatalogPage, AdminDesignerMappingRow } from "./admin-types";
import { EmptyState } from "../shared/empty-state";

type DesignersViewMode = "pages" | "sources";

type Props = {
  loading: boolean;
  rows: AdminDesignerMappingRow[];
  pages: AdminDesignerCatalogPage[];
  onChangeCatalogTitle: (sourceBrand: string, catalogTitle: string) => void;
  onToggleIncludeInDesigners: (sourceBrand: string, includeInDesigners: boolean) => void;
  onChangeCatalogPageTitle: (pageId: string, titleRef: string) => void;
  onChangeCatalogPageDescription: (pageId: string, catalogDescription: string) => void;
};

function normalizeText(value: string | null | undefined) {
  return String(value || "").trim();
}

function getProductCountLabel(count: number) {
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
}

function formatProductCount(count: number) {
  return `${count} ${getProductCountLabel(count)}`;
}

export function AdminDesignersTab({
  loading,
  rows,
  pages,
  onChangeCatalogTitle,
  onToggleIncludeInDesigners,
  onChangeCatalogPageTitle,
  onChangeCatalogPageDescription,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<DesignersViewMode>("pages");

  const catalogTitleOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => normalizeText(row.catalog_title)).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, "en", { numeric: true, sensitivity: "base" })
      ),
    [rows]
  );

  const rowsByCatalogTitle = useMemo(() => {
    const groups = new Map<string, AdminDesignerMappingRow[]>();
    for (const row of rows) {
      const title = normalizeText(row.catalog_title);
      if (!title) {
        continue;
      }
      const key = title.toLowerCase();
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
      const title = normalizeText(row.catalog_title);
      if (!title) {
        continue;
      }
      const key = title.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + row.source_product_count);
    }
    return counts;
  }, [rows]);

  const pageItems = useMemo(() => {
    const validTitleSet = new Set(catalogTitleOptions.map((title) => title.toLowerCase()));
    const selectedTitleByPageId = new Map(
      pages
        .map((page) => {
          const title = normalizeText(page.title_ref);
          return [page.id, validTitleSet.has(title.toLowerCase()) ? title.toLowerCase() : ""];
        })
        .filter((entry) => entry[1])
    );

    return pages
      .map((page) => {
        const rawTitleRef = normalizeText(page.title_ref);
        const titleKey = rawTitleRef.toLowerCase();
        const hasValidTitle = Boolean(rawTitleRef) && validTitleSet.has(titleKey);
        const linkedRows = hasValidTitle ? [...(rowsByCatalogTitle.get(titleKey) ?? [])] : [];
        linkedRows.sort((left, right) =>
          normalizeText(left.source_brand).localeCompare(normalizeText(right.source_brand), "en", {
            numeric: true,
            sensitivity: "base",
          })
        );

        const selectedByOthers = new Set(
          [...selectedTitleByPageId.entries()]
            .filter(([pageId, selectedKey]) => pageId !== page.id && selectedKey)
            .map(([, selectedKey]) => selectedKey)
        );
        const selectableTitles = catalogTitleOptions.filter((title) => {
          const candidateKey = title.toLowerCase();
          return candidateKey === titleKey || !selectedByOthers.has(candidateKey);
        });
        const enabledSourceCount = linkedRows.filter((row) => row.include_in_designers).length;
        const allIncluded = linkedRows.length > 0 && enabledSourceCount === linkedRows.length;
        const partiallyIncluded = enabledSourceCount > 0 && enabledSourceCount < linkedRows.length;

        return {
          page,
          hasValidTitle,
          linkedRows,
          selectableTitles,
          totalProductCount: linkedRows.reduce((sum, row) => sum + row.source_product_count, 0),
          enabledSourceCount,
          allIncluded,
          partiallyIncluded,
        };
      })
      .sort((left, right) => {
        const leftTitle = left.hasValidTitle ? normalizeText(left.page.title_ref) : "";
        const rightTitle = right.hasValidTitle ? normalizeText(right.page.title_ref) : "";
        if (!leftTitle && !rightTitle) {
          return left.page.id.localeCompare(right.page.id, "en", { numeric: true, sensitivity: "base" });
        }
        if (!leftTitle) {
          return 1;
        }
        if (!rightTitle) {
          return -1;
        }
        return leftTitle.localeCompare(rightTitle, "en", { numeric: true, sensitivity: "base" });
      });
  }, [catalogTitleOptions, pages, rowsByCatalogTitle]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const source = normalizeText(row.source_brand).toLowerCase();
      const title = normalizeText(row.catalog_title).toLowerCase();
      return source.includes(query) || title.includes(query);
    });
  }, [rows, search]);

  const filteredPageItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return pageItems;
    }

    return pageItems.filter((item) => {
      const title = normalizeText(item.page.title_ref).toLowerCase();
      const description = normalizeText(item.page.catalog_description).toLowerCase();
      const sources = item.linkedRows.map((row) => normalizeText(row.source_brand).toLowerCase()).join(" ");
      return title.includes(query) || description.includes(query) || sources.includes(query);
    });
  }, [pageItems, search]);

  return (
    <div className="card designers-tab-card">
      <div className="designers-tab-head">
        <div className="designers-tab-title-block">
          <h2>Дизайнеры</h2>
          <div className="designers-tab-summary">
            <div className="tabs designers-tab-modes" role="tablist" aria-label="Режим просмотра дизайнеров">
              <button
                type="button"
                className={viewMode === "sources" ? "tab tab--active" : "tab"}
                onClick={() => setViewMode("sources")}
              >
                Исходные бренды
              </button>
              <button
                type="button"
                className={viewMode === "pages" ? "tab tab--active" : "tab"}
                onClick={() => setViewMode("pages")}
              >
                Страницы каталога
              </button>
            </div>
            <input
              className="input designers-tab-search"
              placeholder={
                viewMode === "pages"
                  ? "Поиск по странице каталога, описанию или исходному бренду"
                  : "Поиск по бренду или названию страницы каталога"
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="designers-tab-pill">{rows.length} исходных брендов</span>
            <span className="designers-tab-pill">{pages.length} страниц каталога</span>
          </div>
        </div>
      </div>

      <div className="designers-list">
        {loading ? <p className="muted">Загрузка дизайнеров...</p> : null}
        {!loading && viewMode === "sources" && filteredRows.length === 0 ? <EmptyState compact title="Ничего не найдено" /> : null}
        {!loading && viewMode === "pages" && filteredPageItems.length === 0 ? <EmptyState compact title="Ничего не найдено" /> : null}

        {!loading && viewMode === "sources"
          ? filteredRows.map((row) => {
              const catalogTitleKey = normalizeText(row.catalog_title).toLowerCase();
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
                  </div>
                </article>
              );
            })
          : null}

        {!loading && viewMode === "pages"
          ? filteredPageItems.map((item) => {
              const stateLabel = item.linkedRows.length === 0
                ? "Выключена"
                : item.allIncluded
                  ? "Включена"
                  : item.partiallyIncluded
                    ? "Частично включена"
                    : "Выключена";

              return (
                <article
                  key={item.page.id}
                  className={item.allIncluded ? "designers-item designers-item--enabled" : "designers-item designers-item--catalog"}
                >
                  <div className="designers-item__header designers-item__header--between">
                    <div className="designers-item__state">
                      <span className="designers-item__count-pill">{formatProductCount(item.totalProductCount)}</span>
                    </div>
                    <label className="ui-switch designers-item__toggle">
                      <input
                        type="checkbox"
                        checked={item.allIncluded}
                        disabled={item.linkedRows.length === 0}
                        onChange={(event) => {
                          for (const row of item.linkedRows) {
                            onToggleIncludeInDesigners(row.source_brand, event.target.checked);
                          }
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">{stateLabel}</span>
                    </label>
                  </div>

                  <div className="designers-item__fields">
                    <label className="designers-item__field">
                      <span className="designers-item__label">Название страницы каталога</span>
                      <div className="designers-item__field-body">
                        <select
                          className="input"
                          value={item.hasValidTitle ? item.page.title_ref : ""}
                          disabled={!item.hasValidTitle}
                          onChange={(event) => onChangeCatalogPageTitle(item.page.id, event.target.value)}
                        >
                          <option value="" disabled={item.hasValidTitle}>
                            {item.hasValidTitle ? "Выберите название" : "Название больше недоступно"}
                          </option>
                          {item.selectableTitles.map((title) => (
                            <option key={`${item.page.id}-${title}`} value={title}>
                              {title}
                            </option>
                          ))}
                        </select>
                        <span className="designers-item__count-pill">{formatProductCount(item.totalProductCount)}</span>
                      </div>
                    </label>

                    <label className="designers-item__field designers-item__field--description">
                      <span className="designers-item__label">Описание</span>
                      <textarea
                        rows={4}
                        value={item.page.catalog_description}
                        onChange={(event) => onChangeCatalogPageDescription(item.page.id, event.target.value)}
                        placeholder="Описание страницы каталога."
                      />
                    </label>

                    <div className="designers-item__field designers-item__field--related">
                      <span className="designers-item__label">Связанные исходные бренды</span>
                      <div className="designers-item__related-list">
                        {item.linkedRows.length > 0 ? (
                          item.linkedRows.map((row) => (
                            <span
                              key={`${item.page.id}-${row.source_brand}`}
                              className={row.include_in_designers ? "designers-item__related-pill" : "designers-item__related-pill designers-item__related-pill--muted"}
                            >
                              {`${row.source_brand} · ${formatProductCount(row.source_product_count)}`}
                            </span>
                          ))
                        ) : (
                          <span className="designers-item__related-pill designers-item__related-pill--muted">Нет связанных брендов</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}
