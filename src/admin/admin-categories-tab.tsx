import type { Dispatch, ReactNode, SetStateAction } from "react";
import { IconPlus } from "../shared/mono-icons";
import { AdminCategoriesSkeleton, AdminSectionSkeleton } from "../shared/skeleton";
import type { AdminCategoryNode, CategoryManualProduct } from "../shared/live-data-context";
import { AdminCategoryEditorPanel } from "./admin-category-editor-panel";

type Props = {
  loadingCategoriesTree: boolean;
  loadingCategoryCounts: boolean;
  onStartCategoryCreate: (parentId: number | null) => void;
  renderTreeElement: ReactNode;
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
  onRemoveKeyword: (keyword: string, scope: "local" | "title") => Promise<void>;
  onAddKeyword: (scope: "local" | "title") => Promise<void>;
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

export function AdminCategoriesTab({
  loadingCategoriesTree,
  loadingCategoryCounts,
  onStartCategoryCreate,
  renderTreeElement,
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
}: Props) {
  return (
    <div className="card">
      <h2>Категории</h2>
      {loadingCategoriesTree ? (
        <AdminCategoriesSkeleton />
      ) : (
        <>
          {loadingCategoryCounts ? <AdminSectionSkeleton rows={2} /> : null}
          <div className="categories-layout">
            <div>
              <div className="actions actions--category-tree">
                <button type="button" className="tree-plus" onClick={() => onStartCategoryCreate(null)}>
                  <IconPlus className="icon-svg icon-svg--sm" /> root
                </button>
              </div>
              <div className="cat-tree-wrap">{renderTreeElement}</div>
            </div>

            <div className="card category-editor-panel">
              <AdminCategoryEditorPanel
                createFormOpen={createFormOpen}
                newCategoryParentId={newCategoryParentId}
                newCategoryParentName={newCategoryParentName}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                newCategoryKeywords={newCategoryKeywords}
                setNewCategoryKeywords={setNewCategoryKeywords}
                onCreateCategory={onCreateCategory}
                setCreateFormOpen={setCreateFormOpen}
                selectedCategory={selectedCategory}
                renameCategoryName={renameCategoryName}
                setRenameCategoryName={setRenameCategoryName}
                onToggleCategoryEnabled={onToggleCategoryEnabled}
                onToggleCategoryFavorite={onToggleCategoryFavorite}
                onDeleteCategory={onDeleteCategory}
                keywordInput={keywordInput}
                setKeywordInput={setKeywordInput}
                titleKeywordInput={titleKeywordInput}
                setTitleKeywordInput={setTitleKeywordInput}
                onRemoveKeyword={onRemoveKeyword}
                onAddKeyword={onAddKeyword}
                selectedCategoryIsLeaf={selectedCategoryIsLeaf}
                manualSearchInput={manualSearchInput}
                setManualSearchInput={setManualSearchInput}
                manualSearchLoading={manualSearchLoading}
                manualSearchResults={manualSearchResults}
                onAddManualProduct={onAddManualProduct}
                manualAssignedLoading={manualAssignedLoading}
                manualAssignedProducts={manualAssignedProducts}
                onRemoveManualProduct={onRemoveManualProduct}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
