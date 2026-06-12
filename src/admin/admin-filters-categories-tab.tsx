import { useState } from "react";
import type {
  AdminCategoryTreeNode,
  AdminFilterTreeNode,
  AdminRuleManualProduct,
} from "./admin-filters-categories-types";
import { useAdminFiltersCategories } from "./hooks/use-admin-filters-categories";
import { AdminSectionSkeleton } from "../shared/skeleton";

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: AdminFilterTreeNode | AdminCategoryTreeNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const isMultifilter = "rules" in node && node.children.length > 0;

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
        {"rules" in node && isMultifilter ? <span className="tag tag--muted">Мультифильтр</span> : null}
      </div>
      {node.children.length > 0 ? (
        <div className="cat-tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TreeBlock({
  title,
  count,
  nodes,
  selectedId,
  onSelect,
  note,
}: {
  title: string;
  count: number;
  nodes: Array<AdminFilterTreeNode | AdminCategoryTreeNode>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  note: string;
}) {
  return (
    <div className="card taxonomy-tree-card">
      <div className="taxonomy-section-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">{note}</p>
        </div>
        <span className="tag tag--muted">{count} узлов</span>
      </div>
      <div className="cat-tree-wrap">
        <div className="cat-tree-column">
          {nodes.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordField({
  title,
  items,
  placeholder,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
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
      <div className="taxonomy-keyword-row taxonomy-keyword-row--compact">
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
            <p className="muted">{item.source_name}</p>
            <p className="muted">{item.matched_local_categories.join(", ")}</p>
          </div>
          <button type="button" onClick={() => onAction(item.product_id)}>
            {actionLabel}
          </button>
        </div>
      ))}
    </>
  );
}

export function AdminFiltersCategoriesTab() {
  const {
    loading,
    filters,
    categories,
    selectedFilterId,
    setSelectedFilterId,
    selectedFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    addKeyword,
    removeKeyword,
    addManualProduct,
    removeManualProduct,
    filtersCount,
    categoriesCount,
  } = useAdminFiltersCategories();

  return (
    <div className="card">
      <h2>Фильтры и Категории</h2>
      <p className="muted">Пока здесь только то, что нужно для определения будущих контрактов фронта: дерево фильтров с правилами и отдельное дерево категорий.</p>

      {loading ? (
        <AdminSectionSkeleton rows={8} />
      ) : (
        <>
          <div className="taxonomy-layout">
            <TreeBlock
              title="Дерево фильтров"
              count={filtersCount}
              nodes={filters}
              selectedId={selectedFilterId}
              onSelect={setSelectedFilterId}
              note="У каждого фильтра или мультифильтра можно задавать ключевые слова локальных категорий, ключевые слова названия товара и ручное добавление товаров."
            />

            <div className="card taxonomy-editor-card">
              {!selectedFilter ? (
                <p className="muted">Выбери фильтр слева.</p>
              ) : (
                <>
                  <h3>{selectedFilter.label}</h3>
                  <p className="muted">{selectedFilter.children.length > 0 ? "Мультифильтр" : "Фильтр"}</p>

                  <KeywordField
                    title="Ключевые слова локальных категорий"
                    items={selectedFilter.rules.local_category_keywords}
                    placeholder="Например: outerwear"
                    onAdd={(value) => addKeyword("local_category_keywords", value)}
                    onRemove={(value) => removeKeyword("local_category_keywords", value)}
                  />

                  <KeywordField
                    title="Ключевые слова по названию товара"
                    items={selectedFilter.rules.title_keywords}
                    placeholder="Например: bomber"
                    onAdd={(value) => addKeyword("title_keywords", value)}
                    onRemove={(value) => removeKeyword("title_keywords", value)}
                  />

                  <div className="taxonomy-panel-block">
                    <h4 className="taxonomy-panel-title">Ручное добавление товаров</h4>
                    <div className="taxonomy-keyword-row taxonomy-keyword-row--single">
                      <input
                        value={manualSearchInput}
                        onChange={(event) => setManualSearchInput(event.target.value)}
                        placeholder="Искать по бренду, названию товара, источнику или локальной категории"
                      />
                    </div>
                    {manualSearchLoading ? <AdminSectionSkeleton rows={2} /> : null}
                    {!manualSearchLoading && manualSearchInput.trim() && manualSearchResults.length === 0 ? (
                      <p className="muted">По текущему запросу ничего не найдено.</p>
                    ) : null}
                    <ManualProductList items={manualSearchResults} actionLabel="Добавить" onAction={addManualProduct} />
                    {selectedFilter.rules.manual_products.length > 0 ? <p className="muted">Добавленные товары</p> : null}
                    <ManualProductList items={selectedFilter.rules.manual_products} actionLabel="Удалить" onAction={removeManualProduct} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="taxonomy-section">
            <div className="taxonomy-layout">
              <TreeBlock
                title="Дерево категорий"
                count={categoriesCount}
                nodes={categories}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                note="Это отдельный раздел ниже фильтров. Пока здесь только сама структура категорий."
              />
              <div className="card taxonomy-category-note">
                <h3>{selectedCategory?.label || "Категория не выбрана"}</h3>
                <p className="muted">
                  {selectedCategory
                    ? `Текущий этап: только дерево категорий без дополнительного функционала. Дочерних узлов: ${selectedCategory.children.length}.`
                    : "Выбери категорию в дереве слева."}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
