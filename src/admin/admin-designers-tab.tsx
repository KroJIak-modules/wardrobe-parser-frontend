import { useMemo, useState } from "react";
import type { AdminFinalDesigner, AdminDesignerSourceRow } from "./admin-types";
import { EmptyState } from "../shared/empty-state";

type DesignersViewMode = "designers" | "sources";

type Props = {
  loading: boolean;
  rows: AdminDesignerSourceRow[];
  designers: AdminFinalDesigner[];
  onChangeDesignerName: (sourceBrand: string, designerName: string) => void;
  onToggleIncludeInDesigners: (sourceBrand: string, includeInDesigners: boolean) => void;
  onChangeFinalDesignerName: (designerId: string, designerName: string) => void;
  onChangeFinalDesignerDescription: (designerId: string, description: string) => void;
  onCreateDesigner: (designerName: string) => void;
  onDeleteDesigner: (designerId: string) => void;
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
  designers,
  onChangeDesignerName,
  onToggleIncludeInDesigners,
  onChangeFinalDesignerName,
  onChangeFinalDesignerDescription,
  onCreateDesigner,
  onDeleteDesigner,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<DesignersViewMode>("sources");

  const designerNameOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => normalizeText(row.designer_name)).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, "en", { numeric: true, sensitivity: "base" })
      ),
    [rows]
  );

  const rowsByDesignerName = useMemo(() => {
    const groups = new Map<string, AdminDesignerSourceRow[]>();
    for (const row of rows) {
      const designerName = normalizeText(row.designer_name);
      if (!designerName) {
        continue;
      }
      const key = designerName.toLowerCase();
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }
    return groups;
  }, [rows]);

  const designerProductCountByName = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const designerName = normalizeText(row.designer_name);
      if (!designerName) {
        continue;
      }
      const key = designerName.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + row.source_product_count);
    }
    return counts;
  }, [rows]);

  const designerItems = useMemo(() => {
    const validNameSet = new Set(designerNameOptions.map((name) => name.toLowerCase()));
    const selectedNameByDesignerId = new Map(
      designers
        .map((designer) => {
          const name = normalizeText(designer.name);
          return [designer.id, validNameSet.has(name.toLowerCase()) ? name.toLowerCase() : ""];
        })
        .filter((entry) => entry[1])
    );

    return designers.map((designer) => {
      const rawName = normalizeText(designer.name);
      const nameKey = rawName.toLowerCase();
      const hasValidName = Boolean(rawName) && validNameSet.has(nameKey);
      const linkedRows = hasValidName ? [...(rowsByDesignerName.get(nameKey) ?? [])] : [];
      linkedRows.sort((left, right) =>
        normalizeText(left.source_brand).localeCompare(normalizeText(right.source_brand), "en", {
          numeric: true,
          sensitivity: "base",
        })
      );

      const selectedByOthers = new Set(
        [...selectedNameByDesignerId.entries()]
          .filter(([designerId, selectedKey]) => designerId !== designer.id && selectedKey)
          .map(([, selectedKey]) => selectedKey)
      );
      const enabledSourceCount = linkedRows.filter((row) => row.include_in_designers).length;
      const allIncluded = linkedRows.length > 0 && enabledSourceCount === linkedRows.length;
      const partiallyIncluded = enabledSourceCount > 0 && enabledSourceCount < linkedRows.length;

      return {
        designer,
        hasValidName,
        linkedRows,
        selectedByOthers,
        selectableNames: designerNameOptions,
        totalProductCount: linkedRows.reduce((sum, row) => sum + row.source_product_count, 0),
        enabledSourceCount,
        allIncluded,
        partiallyIncluded,
      };
    });
  }, [designerNameOptions, designers, rowsByDesignerName]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const source = normalizeText(row.source_brand).toLowerCase();
      const designerName = normalizeText(row.designer_name).toLowerCase();
      return source.includes(query) || designerName.includes(query);
    });
  }, [rows, search]);

  const filteredDesignerItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return designerItems;
    }

    return designerItems.filter((item) => {
      const title = normalizeText(item.designer.name).toLowerCase();
      const description = normalizeText(item.designer.description).toLowerCase();
      const sources = item.linkedRows.map((row) => normalizeText(row.source_brand).toLowerCase()).join(" ");
      return title.includes(query) || description.includes(query) || sources.includes(query);
    });
  }, [designerItems, search]);

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
                {`Исходные бренды (${rows.length})`}
              </button>
              <button
                type="button"
                className={viewMode === "designers" ? "tab tab--active" : "tab"}
                onClick={() => setViewMode("designers")}
              >
                {`Дизайнеры каталога (${designers.length})`}
              </button>
            </div>
            <input
              className="input designers-tab-search"
              placeholder={
                viewMode === "designers"
                  ? "Поиск по дизайнеру, описанию или бренду-источнику"
                  : "Поиск по бренду-источнику или имени дизайнера"
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className="designers-tab-create"
              disabled={designerNameOptions.length === 0}
              onClick={() => onCreateDesigner("")}
            >
              Создать дизайнера
            </button>
          </div>
        </div>
      </div>

      <div className="designers-list">
        {loading ? <p className="muted">Загрузка дизайнеров...</p> : null}
        {!loading && viewMode === "sources" && filteredRows.length === 0 ? <EmptyState compact title="Ничего не найдено" /> : null}
        {!loading && viewMode === "designers" && filteredDesignerItems.length === 0 ? <EmptyState compact title="Ничего не найдено" /> : null}

        {!loading && viewMode === "sources"
          ? filteredRows.map((row) => {
              const designerNameKey = normalizeText(row.designer_name).toLowerCase();
              const relatedRows =
                rowsByDesignerName
                  .get(designerNameKey)
                  ?.filter((candidate) => candidate.source_brand !== row.source_brand)
                  .map((candidate) => candidate.source_brand) ?? [];
              const nextDesignerProductCount = designerProductCountByName.get(designerNameKey) ?? row.source_product_count;
              const currentDesignerProductCount = Math.max(0, nextDesignerProductCount - row.source_product_count);

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
                      <span className="designers-item__label">Название в источнике</span>
                      <div className="designers-item__field-body">
                        <div className="designers-item__readonly">{row.source_brand}</div>
                        <span className="designers-item__count-pill">{formatProductCount(row.source_product_count)}</span>
                      </div>
                    </div>

                    <label className="designers-item__field">
                      <span className="designers-item__label">Имя дизайнера</span>
                      <div className="designers-item__field-body">
                        <input
                          className="input"
                          value={row.designer_name}
                          onChange={(event) => onChangeDesignerName(row.source_brand, event.target.value)}
                          placeholder="Например, Rick Owens"
                        />
                        <span className="designers-item__count-pill">
                          {`${nextDesignerProductCount} ${getProductCountLabel(nextDesignerProductCount)} (${currentDesignerProductCount} + ${row.source_product_count})`}
                        </span>
                      </div>
                    </label>

                    {relatedRows.length > 0 ? (
                      <div className="designers-item__field designers-item__field--related">
                        <span className="designers-item__label">Другие бренды с этим именем</span>
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

        {!loading && viewMode === "designers"
          ? filteredDesignerItems.map((item) => {
              const stateLabel = item.linkedRows.length === 0
                ? "Выключено"
                : item.allIncluded
                  ? "Включено"
                  : item.partiallyIncluded
                    ? "Частично включено"
                    : "Выключено";

              return (
                <article
                  key={item.designer.id}
                  className={item.allIncluded ? "designers-item designers-item--enabled" : "designers-item designers-item--catalog"}
                >
                  <div className="designers-item__header designers-item__header--between">
                    <div className="designers-item__actions">
                      <span className="designers-item__count-pill">{formatProductCount(item.totalProductCount)}</span>
                    </div>
                    <div className="designers-item__actions">
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
                      <button
                        type="button"
                        className="designers-item__delete"
                        onClick={() => onDeleteDesigner(item.designer.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="designers-item__fields">
                    <label className="designers-item__field">
                      <span className="designers-item__label">Имя дизайнера</span>
                      <div className="designers-item__field-body">
                        <select
                          className="input"
                          value={item.hasValidName || !normalizeText(item.designer.name) ? item.designer.name : ""}
                          onChange={(event) => onChangeFinalDesignerName(item.designer.id, event.target.value)}
                        >
                          <option value="" disabled={item.hasValidName}>
                            {!normalizeText(item.designer.name) ? "Выберите имя" : "Имя больше недоступно"}
                          </option>
                          {item.selectableNames.map((title) => (
                            <option
                              key={`${item.designer.id}-${title}`}
                              value={title}
                              disabled={item.selectedByOthers.has(title.toLowerCase())}
                            >
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
                        value={item.designer.description}
                        onChange={(event) => onChangeFinalDesignerDescription(item.designer.id, event.target.value)}
                        placeholder="Описание дизайнера."
                      />
                    </label>

                    <div className="designers-item__field designers-item__field--related">
                      <span className="designers-item__label">Связанные бренды</span>
                      <div className="designers-item__related-list">
                        {item.linkedRows.length > 0 ? (
                          item.linkedRows.map((row) => (
                            <span
                              key={`${item.designer.id}-${row.source_brand}`}
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
