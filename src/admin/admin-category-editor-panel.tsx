import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { IconClose, IconStar } from "../shared/mono-icons";
import type { AdminCategoryNode, CategoryManualProduct } from "../shared/live-data-context";
import { HelpHint } from "./help-hint";
import { AdminCategoryManualProducts } from "./admin-category-manual-products";

type Props = {
  createFormOpen: boolean;
  newCategoryParentId: number | null;
  newCategoryParentName: string;
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  newCategoryKeywords: string;
  setNewCategoryKeywords: Dispatch<SetStateAction<string>>;
  onCreateCategory: () => void;
  setCreateFormOpen: Dispatch<SetStateAction<boolean>>;
  selectedCategory: AdminCategoryNode | null;
  renameCategoryName: string;
  setRenameCategoryName: Dispatch<SetStateAction<string>>;
  onToggleCategoryEnabled: (enabled: boolean) => Promise<void>;
  onToggleCategoryFavorite: (isFavorite: boolean) => Promise<void>;
  onDeleteCategory: () => void;
  keywordInput: string;
  setKeywordInput: Dispatch<SetStateAction<string>>;
  titleKeywordInput: string;
  setTitleKeywordInput: Dispatch<SetStateAction<string>>;
  onRemoveKeyword: (keyword: string, scope: "local" | "title" | "status") => Promise<void>;
  onAddKeyword: (scope: "local" | "title" | "status", forcedKeyword?: string) => Promise<void>;
  selectedCategoryIsLeaf: boolean;
  manualSearchInput: string;
  setManualSearchInput: Dispatch<SetStateAction<string>>;
  manualSearchLoading: boolean;
  manualSearchResults: CategoryManualProduct[];
  onAddManualProduct: (productId: number) => Promise<void>;
  manualAssignedLoading: boolean;
  manualAssignedProducts: CategoryManualProduct[];
  onRemoveManualProduct: (productId: number) => Promise<void>;
};

export function AdminCategoryEditorPanel(props: Props) {
  const {
    createFormOpen,
    newCategoryParentId,
    newCategoryParentName,
    newCategoryName,
    setNewCategoryName,
    newCategoryKeywords,
    setNewCategoryKeywords,
    onCreateCategory,
    setCreateFormOpen,
    selectedCategory,
    renameCategoryName,
    setRenameCategoryName,
    onToggleCategoryEnabled,
    onToggleCategoryFavorite,
    onDeleteCategory,
    keywordInput,
    setKeywordInput,
    titleKeywordInput,
    setTitleKeywordInput,
    onRemoveKeyword,
    onAddKeyword,
    selectedCategoryIsLeaf,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    onAddManualProduct,
    manualAssignedLoading,
    manualAssignedProducts,
    onRemoveManualProduct,
  } = props;
  const [statusMenuOpen, setStatusMenuOpen] = useState<boolean>(false);
  const statusOptions = useMemo(
    () => [
      { value: "available", label: "В наличии" },
      { value: "out_of_stock", label: "Не в наличии" },
      { value: "hidden", label: "Скрыто" },
      { value: "unavailable", label: "Недоступен" },
    ],
    []
  );
  const selectedStatusSet = useMemo(() => new Set(selectedCategory?.status_keywords || []), [selectedCategory?.status_keywords]);
  const availableStatusOptions = useMemo(
    () => statusOptions.filter((option) => !selectedStatusSet.has(option.value)),
    [statusOptions, selectedStatusSet]
  );
  const statusLabelMap = useMemo(
    () => new Map(statusOptions.map((option) => [option.value, option.label])),
    [statusOptions]
  );
  const leafOnlyHint = "Добавление ключевых слов и товаров доступно только для конечных категорий.";

  if (createFormOpen) {
    return (
      <div className="form">
        <h3>Создание категории</h3>
        {newCategoryParentId !== null ? <p className="muted">Родитель: {newCategoryParentName}</p> : null}
        <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Название" />
        <textarea
          value={newCategoryKeywords}
          onChange={(event) => setNewCategoryKeywords(event.target.value)}
          placeholder="Ключевые слова (через запятую или с новой строки, опционально)"
        />
        <div className="actions">
          <button type="button" onClick={onCreateCategory}>Создать</button>
          <button type="button" onClick={() => setCreateFormOpen(false)}>Отмена</button>
        </div>
      </div>
    );
  }

  if (!selectedCategory) {
    return <p className="muted">Выбери категорию в дереве слева, чтобы редактировать название и ключи.</p>;
  }

  return (
    <>
      <h3>Редактирование: {selectedCategory.name}</h3>
      <div className="form">
        <input
          value={renameCategoryName}
          onChange={(event) => setRenameCategoryName(event.target.value)}
          placeholder="Название категории"
          disabled={selectedCategory.is_system}
        />
        <div className="category-controls-row">
          <label className="ui-switch ui-switch--compact">
            <input type="checkbox" checked={selectedCategory.is_enabled} onChange={(event) => void onToggleCategoryEnabled(event.target.checked)} />
            <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
            <span className="ui-switch-text">{selectedCategory.is_enabled ? "Включено" : "Выключено"}</span>
          </label>
          {!selectedCategory.is_system ? (
            <div className="favorite-toggle-row">
              <button
                type="button"
                className={selectedCategory.is_favorite ? "icon-btn icon-btn--active" : "icon-btn"}
                onClick={() => void onToggleCategoryFavorite(!selectedCategory.is_favorite)}
                aria-label={selectedCategory.is_favorite ? "Убрать из избранного" : "Сделать избранным"}
              >
                <IconStar className="icon-svg" />
              </button>
              <span className="favorite-toggle-text">{selectedCategory.is_favorite ? "Добавлен в избранное" : "Сделать избранным"}</span>
            </div>
          ) : null}
          <button type="button" className="category-delete-btn" onClick={onDeleteCategory} disabled={selectedCategory.is_system}>Удалить</button>
        </div>
        {selectedCategory.is_system ? <p className="muted">Данная категория системная, ее нельзя удалить.</p> : null}
      </div>

      {selectedCategory.is_designers_root ? (
        <>
          <p className="muted">Список дизайнеров синхронизируется автоматически из брендов товаров.</p>
          <div className="chip-list">
            {[...selectedCategory.children].sort((left, right) => left.name.localeCompare(right.name, "ru")).map((child) => (
              <span key={child.id} className="tag tag--muted">{child.name}</span>
            ))}
          </div>
        </>
      ) : !selectedCategory.is_system ? (
        <>
          <h4 className="category-section-title">Ключевые слова по локальным категориям <HelpHint text="Срабатывают по бренду и типу товара. Товар может попасть сразу в несколько категорий." /></h4>
          <div className="chip-list">
            {selectedCategory.keywords.map((keyword: string) => (
              <span key={keyword} className={selectedCategory.keywords_editable ? "tag tag--with-action" : "tag tag--muted"}>
                <span>{keyword}</span>
                {selectedCategory.keywords_editable ? (
                  <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword, "local")}>
                    <IconClose className="icon-svg icon-svg--sm" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          <div className="form">
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onAddKeyword("local");
                }
              }}
              placeholder="Введите ключ и нажмите Enter"
              disabled={!selectedCategory.keywords_editable}
            />
            <button type="button" onClick={() => void onAddKeyword("local")} disabled={!selectedCategory.keywords_editable}>Добавить ключ</button>
          </div>
          <h4 className="category-section-title">Ключевые слова по названию товара <HelpHint text="Срабатывают только по title товара. Удобно для точных слов, которые не должны матчиться по бренду или URL." /></h4>
          <div className="chip-list">
            {selectedCategory.title_keywords.map((keyword: string) => (
              <span key={keyword} className={selectedCategory.keywords_editable ? "tag tag--with-action" : "tag tag--muted"}>
                <span>{keyword}</span>
                {selectedCategory.keywords_editable ? (
                  <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(keyword, "title")}>
                    <IconClose className="icon-svg icon-svg--sm" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          <div className="form">
            <input
              value={titleKeywordInput}
              onChange={(event) => setTitleKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onAddKeyword("title");
                }
              }}
              placeholder="Введите ключ из названия товара и нажмите Enter"
              disabled={!selectedCategory.keywords_editable}
            />
            <button type="button" onClick={() => void onAddKeyword("title")} disabled={!selectedCategory.keywords_editable}>Добавить ключ</button>
          </div>
          <h4 className="category-section-title">Фильтр по статусу товара</h4>
          <div className="chip-list">
            {(selectedCategory.status_keywords || []).map((statusValue: string) => (
              <span key={statusValue} className={selectedCategory.keywords_editable ? "tag tag--with-action" : "tag tag--muted"}>
                <span>{statusLabelMap.get(statusValue) || statusValue}</span>
                {selectedCategory.keywords_editable ? (
                  <button type="button" className="tag-x" onClick={() => void onRemoveKeyword(statusValue, "status")}>
                    <IconClose className="icon-svg icon-svg--sm" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          <div className="status-filter-select-wrap" tabIndex={0} onBlur={() => setStatusMenuOpen(false)}>
            <button
              type="button"
              className="status-filter-select"
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              disabled={!selectedCategory.keywords_editable || availableStatusOptions.length === 0}
            >
              {availableStatusOptions.length === 0 ? "Все статусы добавлены" : "Добавить статус"}
            </button>
            {statusMenuOpen && selectedCategory.keywords_editable && availableStatusOptions.length > 0 ? (
              <div className="status-filter-menu" role="listbox">
                {availableStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="status-filter-menu-item"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setStatusMenuOpen(false);
                      void onAddKeyword("status", option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {selectedCategoryIsLeaf ? (
            <AdminCategoryManualProducts
              manualSearchInput={manualSearchInput}
              setManualSearchInput={setManualSearchInput}
              manualSearchLoading={manualSearchLoading}
              manualSearchResults={manualSearchResults}
              onAddManualProduct={onAddManualProduct}
              manualAssignedLoading={manualAssignedLoading}
              manualAssignedProducts={manualAssignedProducts}
              onRemoveManualProduct={onRemoveManualProduct}
              disabled={!selectedCategory.keywords_editable}
            />
          ) : (
            <p className="muted">{leafOnlyHint}</p>
          )}

          {!selectedCategory.keywords_editable && selectedCategory.keywords_locked_reason && selectedCategory.keywords_locked_reason !== leafOnlyHint ? (
            <p className="muted">{selectedCategory.keywords_locked_reason}</p>
          ) : null}
        </>
      ) : null}
    </>
  );
}
