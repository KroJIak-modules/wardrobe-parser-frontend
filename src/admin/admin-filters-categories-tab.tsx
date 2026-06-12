import { useState } from "react";
import type { AdminCategoryTreeNode, AdminFilterTreeNode, AdminRuleManualProduct, AdminRuleTreeNode } from "./admin-filters-categories-types";
import { useAdminFiltersCategories } from "./hooks/use-admin-filters-categories";
import { IconPlus, IconTrash } from "../shared/mono-icons";
import { AdminSectionSkeleton } from "../shared/skeleton";

type FilterSectionState = ReturnType<typeof useAdminFiltersCategories>["filtersSection"];
type CategorySectionState = ReturnType<typeof useAdminFiltersCategories>["categoriesSection"];

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getReasonLabel(reason: AdminRuleTreeNode["sample_hits"][number]["reason"]) {
  if (reason === "local_category_keyword") {
    return "локальные категории";
  }
  if (reason === "title_keyword") {
    return "название товара";
  }
  return "ручное добавление";
}

function getNodeKindLabel(node: AdminRuleTreeNode) {
  if (node.entity === "filter") {
    return node.children.length > 0 ? "Мультифильтр" : "Фильтр";
  }
  return node.children.length > 0 ? "Раздел" : "Категория";
}

function getPlacementLabel(value: AdminFilterTreeNode["placement"]) {
  if (value === "showcase_navigation") {
    return "Верхняя навигация витрины";
  }
  if (value === "catalog_toolbar") {
    return "Фильтр-бар каталога";
  }
  return "Поиск и refinement";
}

function getVisibilityLabel(value: AdminCategoryTreeNode["visibility"]) {
  if (value === "public") {
    return "Публичная";
  }
  if (value === "hidden") {
    return "Скрытая";
  }
  return "Служебная";
}

function flattenTreeNodes<T extends AdminRuleTreeNode>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children as T[])]);
}

function TaxonomyTree<T extends AdminRuleTreeNode>({
  nodes,
  selectedId,
  onSelect,
  onCreateChild,
}: {
  nodes: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateChild: (parentId: number) => void;
}) {
  return (
    <div className="cat-tree-column">
      {nodes.map((node) => (
        <TaxonomyTreeNode key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} onCreateChild={onCreateChild} />
      ))}
    </div>
  );
}

function TaxonomyTreeNode<T extends AdminRuleTreeNode>({
  node,
  depth,
  selectedId,
  onSelect,
  onCreateChild,
}: {
  node: T;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateChild: (parentId: number) => void;
}) {
  return (
    <div className="cat-tree-node" style={{ marginLeft: `${depth * 12}px` }}>
      <div className="cat-tree-item taxonomy-tree-item">
        <button
          type="button"
          className={selectedId === node.id ? "tab tab--active cat-tree-btn taxonomy-tree-btn" : "tab cat-tree-btn taxonomy-tree-btn"}
          onClick={() => onSelect(node.id)}
        >
          <span>{node.label}</span>
        </button>
        <button type="button" className="tree-plus" onClick={() => onCreateChild(node.id)} title="Добавить дочерний узел">
          <IconPlus className="icon-svg icon-svg--sm" />
        </button>
        <div className="taxonomy-tree-meta">
          <span className="tag tag--muted">{getNodeKindLabel(node)}</span>
          <span className="muted">{node.product_count} товаров</span>
          {!node.is_enabled ? <span className="muted">выключен</span> : null}
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="cat-tree-children">
          {node.children.map((child) => (
            <TaxonomyTreeNode
              key={child.id}
              node={child as T}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function KeywordField({
  title,
  items,
  onRemove,
  onAdd,
  placeholder,
}: {
  title: string;
  items: string[];
  onRemove: (value: string) => void;
  onAdd: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState<string>("");

  return (
    <div className="taxonomy-panel-block">
      <h4 className="taxonomy-panel-title">{title}</h4>
      <div className="chip-list">
        {items.map((item) => (
          <span key={item} className="tag tag--with-action">
            <span>{item}</span>
            <button
              type="button"
              className="tag-x"
              onClick={() => onRemove(item)}
              aria-label={`Удалить ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="taxonomy-keyword-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd(draft);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          Добавить
        </button>
      </div>
    </div>
  );
}

function ManualProductList({
  items,
  actionLabel,
  onAction,
}: {
  items: AdminRuleManualProduct[];
  actionLabel: string;
  onAction: (productId: number) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <div key={`${actionLabel}-${item.product_id}`} className="manual-product-row">
          <div className="manual-product-media">
            {item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" /> : <span className="manual-product-media-placeholder photo-placeholder">Нет фото</span>}
          </div>
          <div className="manual-product-main">
            <a href={`/product/${item.product_id}?from=admin`} target="_blank" rel="noreferrer">
              {item.vendor} {item.title}
            </a>
            <p className="muted">{item.source_name} • {item.price_label}</p>
            <p className="muted">{item.matched_local_categories.join(", ") || "Без локальных категорий"}</p>
            <p className="muted">{item.inventory_hint}</p>
          </div>
          <button type="button" onClick={() => onAction(item.product_id)}>
            {actionLabel}
          </button>
        </div>
      ))}
    </>
  );
}

function TaxonomySection({
  kind,
  title,
  subtitle,
  section,
}: {
  kind: "filter" | "category";
  title: string;
  subtitle: string;
  section: FilterSectionState | CategorySectionState;
}) {
  const selectedNode = section.selectedNode;
  const isFilterSection = kind === "filter";
  const createParentLabel = section.createParentId === null ? "корневого уровня" : flattenTreeNodes(section.nodes).find((node) => node.id === section.createParentId)?.label || `#${section.createParentId}`;

  return (
    <section className="taxonomy-section">
      <div className="taxonomy-section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{subtitle}</p>
        </div>
        <div className="taxonomy-section-pills">
          <span className="tag tag--muted">{section.nodeCount} узлов</span>
          {selectedNode ? <span className="tag tag--muted">{getNodeKindLabel(selectedNode)}</span> : null}
        </div>
      </div>

      <div className="taxonomy-layout">
        <div className="card taxonomy-tree-card">
          <div className="taxonomy-tree-toolbar">
            <button type="button" className="tree-plus" onClick={() => section.openCreate(null)}>
              <IconPlus className="icon-svg icon-svg--sm" /> Корень
            </button>
            <p className="muted">
              {isFilterSection ? "Структура фильтров и мультифильтров." : "Структура конечных категорий и разделов каталога."}
            </p>
          </div>
          {section.createOpen ? (
            <div className="taxonomy-create-card">
              <p className="muted">
                {section.createParentId === null ? "Создание корневого узла" : `Создание дочернего узла для ${createParentLabel}`}
              </p>
              <div className="taxonomy-keyword-row">
                <input
                  value={section.createLabel}
                  onChange={(event) => section.setCreateLabel(event.target.value)}
                  placeholder={isFilterSection ? "Название фильтра" : "Название категории"}
                />
                <button type="button" onClick={section.createNode}>Создать</button>
                <button type="button" onClick={section.closeCreate}>Отмена</button>
              </div>
            </div>
          ) : null}
          <div className="cat-tree-wrap">
            <TaxonomyTree nodes={section.nodes} selectedId={section.selectedId} onSelect={section.setSelectedId} onCreateChild={section.openCreate} />
          </div>
        </div>

        <div className="card taxonomy-editor-card">
          {!selectedNode ? (
            <p className="muted">Выбери узел слева, чтобы настроить его правила и структуру.</p>
          ) : (
            <>
              <div className="taxonomy-editor-head">
                <div>
                  <h3>{selectedNode.label}</h3>
                  <p className="muted">
                    {getNodeKindLabel(selectedNode)} • slug `{selectedNode.slug}`
                  </p>
                </div>
                <button type="button" className="taxonomy-delete-btn" onClick={section.deleteSelectedNode}>
                  <IconTrash className="icon-svg icon-svg--sm" /> Удалить
                </button>
              </div>

              <div className="taxonomy-fields-grid">
                <label className="taxonomy-field">
                  <span>Название</span>
                  <input value={selectedNode.label} onChange={(event) => section.updateLabel(event.target.value)} />
                </label>
                <label className="taxonomy-field">
                  <span>Slug</span>
                  <input value={selectedNode.slug} onChange={(event) => section.updateSlug(event.target.value)} />
                </label>
              </div>

              <div className="taxonomy-fields-grid">
                <label className="ui-switch ui-switch--compact">
                  <input type="checkbox" checked={selectedNode.is_enabled} onChange={(event) => section.updateEnabled(event.target.checked)} />
                  <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
                  <span className="ui-switch-text">{selectedNode.is_enabled ? "Включен" : "Выключен"}</span>
                </label>

                {selectedNode.entity === "filter" ? (
                  <>
                    <label className="taxonomy-field">
                      <span>Позиция</span>
                      <select value={selectedNode.placement} onChange={(event) => section.updatePlacement?.(event.target.value as AdminFilterTreeNode["placement"])}>
                        <option value="showcase_navigation">Верхняя навигация витрины</option>
                        <option value="catalog_toolbar">Фильтр-бар каталога</option>
                        <option value="search_refinement">Поиск и refinement</option>
                      </select>
                    </label>
                    <label className="taxonomy-field">
                      <span>Выбор</span>
                      <select value={selectedNode.selection_mode} onChange={(event) => section.updateSelectionMode?.(event.target.value as AdminFilterTreeNode["selection_mode"])}>
                        <option value="single">Один вариант</option>
                        <option value="multiple">Несколько вариантов</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="taxonomy-field">
                      <span>Видимость</span>
                      <select value={selectedNode.visibility} onChange={(event) => section.updateVisibility?.(event.target.value as AdminCategoryTreeNode["visibility"])}>
                        <option value="public">Публичная</option>
                        <option value="hidden">Скрытая</option>
                        <option value="internal">Служебная</option>
                      </select>
                    </label>
                    <label className="taxonomy-field">
                      <span>Route path</span>
                      <input value={selectedNode.route_path} onChange={(event) => section.updateRoutePath?.(event.target.value)} />
                    </label>
                  </>
                )}
              </div>

              <div className="taxonomy-meta-grid">
                <div className="taxonomy-meta-card">
                  <span className="taxonomy-meta-label">Товаров</span>
                  <strong>{selectedNode.product_count}</strong>
                </div>
                <div className="taxonomy-meta-card">
                  <span className="taxonomy-meta-label">Ручных товаров</span>
                  <strong>{selectedNode.rules.manual_products.length}</strong>
                </div>
                <div className="taxonomy-meta-card">
                  <span className="taxonomy-meta-label">Обновил</span>
                  <strong>{selectedNode.audit.updated_by}</strong>
                </div>
                <div className="taxonomy-meta-card">
                  <span className="taxonomy-meta-label">Обновлено</span>
                  <strong>{formatDateTime(selectedNode.audit.updated_at)}</strong>
                </div>
              </div>

              <div className="taxonomy-panel-block">
                <h4 className="taxonomy-panel-title">Текущее поведение</h4>
                <p className="muted">
                  {selectedNode.entity === "filter"
                    ? `${getPlacementLabel(selectedNode.placement)} • ${selectedNode.selection_mode === "single" ? "одиночный выбор" : "множественный выбор"}`
                    : `${getVisibilityLabel(selectedNode.visibility)} • ${selectedNode.route_path}`}
                </p>
                <p className="muted">{selectedNode.audit.source_note}</p>
              </div>

              <KeywordField
                title="Ключевые слова локальных категорий"
                items={selectedNode.rules.local_category_keywords}
                onRemove={(value) => section.removeKeyword("local_category_keywords", value)}
                onAdd={(value) => section.addKeyword("local_category_keywords", value)}
                placeholder="Например: outerwear"
              />

              <KeywordField
                title="Ключевые слова по названию товара"
                items={selectedNode.rules.title_keywords}
                onRemove={(value) => section.removeKeyword("title_keywords", value)}
                onAdd={(value) => section.addKeyword("title_keywords", value)}
                placeholder="Например: bomber"
              />

              <div className="taxonomy-panel-block">
                <h4 className="taxonomy-panel-title">Ручное добавление товаров</h4>
                <div className="taxonomy-keyword-row">
                  <input
                    value={section.manualSearchInput}
                    onChange={(event) => section.setManualSearchInput(event.target.value)}
                    placeholder="Искать по бренду, title, источнику, цене или локальной категории"
                  />
                </div>
                {section.manualSearchLoading ? <AdminSectionSkeleton rows={2} /> : null}
                {!section.manualSearchLoading && section.manualSearchInput.trim() && section.manualSearchResults.length === 0 ? (
                  <p className="muted">По текущему запросу ничего не найдено.</p>
                ) : null}
                <ManualProductList items={section.manualSearchResults} actionLabel="Добавить" onAction={section.addManualProduct} />
                {selectedNode.rules.manual_products.length > 0 ? <p className="muted">Уже добавлено</p> : null}
                <ManualProductList items={selectedNode.rules.manual_products} actionLabel="Удалить" onAction={section.removeManualProduct} />
              </div>

              <div className="taxonomy-panel-block">
                <h4 className="taxonomy-panel-title">Примеры совпадений</h4>
                {selectedNode.sample_hits.length === 0 ? (
                  <p className="muted">Пока нет примеров совпадений для этого узла.</p>
                ) : (
                  <div className="taxonomy-match-list">
                    {selectedNode.sample_hits.map((item) => (
                      <div key={`${selectedNode.id}-${item.product_id}-${item.reason}`} className="taxonomy-match-row">
                        <div>
                          <strong>{item.vendor}</strong> {item.title}
                        </div>
                        <span className="tag tag--muted">{getReasonLabel(item.reason)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminFiltersCategoriesTab() {
  const { loading, payloadMeta, productLibraryCount, stats, filtersSection, categoriesSection } = useAdminFiltersCategories();

  return (
    <div className="card">
      <h2>Фильтры и Категории</h2>
      <p className="muted">
        Моковый admin API: `{payloadMeta?.endpoint || "/api/admin/filters-categories"}` • фильтры `{payloadMeta?.filters_endpoint || "/api/admin/filters-categories/filters"}` • категории `{payloadMeta?.categories_endpoint || "/api/admin/filters-categories/categories"}`
      </p>

      {loading ? (
        <AdminSectionSkeleton rows={8} />
      ) : (
        <>
          <div className="taxonomy-summary-grid">
            <div className="taxonomy-summary-card">
              <span className="taxonomy-meta-label">Фильтры</span>
              <strong>{stats.filters_count}</strong>
              <span className="muted">{stats.multifilters_count} из них уже мультифильтры</span>
            </div>
            <div className="taxonomy-summary-card">
              <span className="taxonomy-meta-label">Категории</span>
              <strong>{stats.categories_count}</strong>
              <span className="muted">{categoriesSection.nodeCount} узлов в дереве категорий</span>
            </div>
            <div className="taxonomy-summary-card">
              <span className="taxonomy-meta-label">Ключевые слова</span>
              <strong>{stats.catalog_keywords_count}</strong>
              <span className="muted">локальные категории + title keywords</span>
            </div>
            <div className="taxonomy-summary-card">
              <span className="taxonomy-meta-label">Ручные привязки</span>
              <strong>{stats.manual_bindings_count}</strong>
              <span className="muted">{productLibraryCount} товаров доступно в моковой библиотеке</span>
            </div>
          </div>

          <TaxonomySection
            kind="filter"
            title="Дерево фильтров"
            subtitle="Здесь живут фильтры и мультифильтры. Мультифильтр определяется фактом наличия дочерних фильтров, без отдельного флага."
            section={filtersSection}
          />

          <TaxonomySection
            kind="category"
            title="Дерево категорий"
            subtitle="Это отдельная структура ниже фильтров. Она не использует избранное и не содержит фильтр по статусу товара."
            section={categoriesSection}
          />
        </>
      )}
    </div>
  );
}
