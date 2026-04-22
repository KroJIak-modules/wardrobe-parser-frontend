import { useEffect, useMemo, useState } from "react";
import type { CategoryManualProduct } from "../../shared/live-data-context";
import { findCategoryById, flattenCategoryOptions, parseCategoryKeywords } from "./admin-categories-helpers";

type CategoryNode = {
  id: number;
  name: string;
  children: CategoryNode[];
  has_children: boolean;
  keywords_editable: boolean;
  keywords_locked_reason: string | null;
};

type KeywordScope = "local" | "title" | "status";

type UseAdminCategoriesParams = {
  adminCategories: CategoryNode[];
  createCategory: (name: string, parentId: number | null) => Promise<{ ok: boolean; message: string; categoryId?: number }>;
  updateCategory: (categoryId: number, patch: { name?: string; is_enabled?: boolean; is_favorite?: boolean }) => Promise<{ ok: boolean; message: string }>;
  deleteCategory: (categoryId: number) => Promise<{ ok: boolean; message: string }>;
  addCategoryKeyword: (categoryId: number, keyword: string, scope?: KeywordScope) => Promise<{ ok: boolean; message: string }>;
  removeCategoryKeyword: (categoryId: number, keyword: string, scope?: KeywordScope) => Promise<{ ok: boolean; message: string }>;
  getCategoryManualProducts: (categoryId: number) => Promise<{ ok: boolean; message: string; items: CategoryManualProduct[] }>;
  searchCategoryManualProducts: (categoryId: number, query: string, limit?: number) => Promise<{ ok: boolean; message: string; items: CategoryManualProduct[] }>;
  addCategoryManualProduct: (categoryId: number, productId: number) => Promise<{ ok: boolean; message: string }>;
  removeCategoryManualProduct: (categoryId: number, productId: number) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminCategories(params: UseAdminCategoriesParams) {
  const {
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    pushToast,
  } = params;

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState<string>("");
  const [lastSavedCategoryName, setLastSavedCategoryName] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [titleKeywordInput, setTitleKeywordInput] = useState<string>("");
  const [manualSearchInput, setManualSearchInput] = useState<string>("");
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const [manualSearchResults, setManualSearchResults] = useState<CategoryManualProduct[]>([]);
  const [manualAssignedProducts, setManualAssignedProducts] = useState<CategoryManualProduct[]>([]);
  const [manualAssignedLoading, setManualAssignedLoading] = useState<boolean>(false);
  const [createFormOpen, setCreateFormOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryKeywords, setNewCategoryKeywords] = useState<string>("");

  const categoryOptions = useMemo(() => flattenCategoryOptions(adminCategories), [adminCategories]);

  const selectedCategory = useMemo(() => findCategoryById(adminCategories, selectedCategoryId), [adminCategories, selectedCategoryId]);

  const selectedCategoryIsLeaf = useMemo(() => {
    if (!selectedCategory) {
      return false;
    }
    return !selectedCategory.has_children && selectedCategory.children.length === 0;
  }, [selectedCategory]);

  const newCategoryParentName = useMemo(() => {
    if (newCategoryParentId === null) {
      return "root";
    }
    return categoryOptions.find((item) => item.id === newCategoryParentId)?.name || "unknown";
  }, [categoryOptions, newCategoryParentId]);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    setRenameCategoryName(selectedCategory.name);
    setLastSavedCategoryName(selectedCategory.name);
  }, [selectedCategory?.id, selectedCategory?.name]);

  useEffect(() => {
    if (!selectedCategoryId || !selectedCategory || !selectedCategory.keywords_editable || !selectedCategoryIsLeaf) {
      setManualAssignedProducts([]);
      setManualAssignedLoading(false);
      setManualSearchInput("");
      setManualSearchResults([]);
      return;
    }
    void (async () => {
      setManualAssignedLoading(true);
      const result = await getCategoryManualProducts(selectedCategoryId);
      if (result.ok) {
        setManualAssignedProducts(result.items);
      } else {
        pushToast(result.message);
      }
      setManualAssignedLoading(false);
    })();
  }, [selectedCategoryId, selectedCategory?.id, selectedCategory?.keywords_editable, selectedCategoryIsLeaf, getCategoryManualProducts, pushToast]);

  useEffect(() => {
    const rawQuery = manualSearchInput.trim();
    if (!selectedCategoryId || !selectedCategory?.keywords_editable || !selectedCategoryIsLeaf || rawQuery.length === 0) {
      setManualSearchResults([]);
      setManualSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setManualSearchLoading(true);
      const result = await searchCategoryManualProducts(selectedCategoryId, rawQuery, 3);
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setManualSearchResults(result.items);
      } else {
        setManualSearchResults([]);
        pushToast(result.message);
      }
      setManualSearchLoading(false);
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [manualSearchInput, selectedCategoryId, selectedCategory?.keywords_editable, selectedCategoryIsLeaf, searchCategoryManualProducts, pushToast]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    const normalized = renameCategoryName.trim();
    if (!normalized || normalized === lastSavedCategoryName) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await updateCategory(selectedCategoryId, { name: normalized });
      pushToast(result.message);
      if (result.ok) {
        setLastSavedCategoryName(normalized);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [renameCategoryName, lastSavedCategoryName, selectedCategoryId, updateCategory, pushToast]);

  const onStartCategoryCreate = (parentId: number | null) => {
    setSelectedCategoryId(null);
    setCreateFormOpen(true);
    setNewCategoryParentId(parentId);
    setNewCategoryName("");
    setNewCategoryKeywords("");
  };

  const onCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      pushToast("Введите название категории");
      return;
    }

    const result = await createCategory(newCategoryName.trim(), newCategoryParentId);
    pushToast(result.message);

    if (result.ok && result.categoryId) {
      const keywords = parseCategoryKeywords(newCategoryKeywords);

      for (const keyword of keywords) {
        const addResult = await addCategoryKeyword(result.categoryId, keyword);
        if (!addResult.ok) {
          pushToast(addResult.message);
          break;
        }
      }

      setCreateFormOpen(false);
      setNewCategoryParentId(null);
      setNewCategoryName("");
      setNewCategoryKeywords("");
    }
  };

  const onDeleteCategory = async () => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await deleteCategory(selectedCategoryId);
    pushToast(result.message);
    if (result.ok) {
      setSelectedCategoryId(null);
      setRenameCategoryName("");
      setKeywordInput("");
      setTitleKeywordInput("");
    }
  };

  const onAddKeyword = async (scope: KeywordScope, forcedKeyword?: string) => {
    if (!selectedCategoryId) {
      return;
    }
    const baseValue = typeof forcedKeyword === "string"
      ? forcedKeyword
      : (scope === "local" ? keywordInput : titleKeywordInput);
    const raw = baseValue.trim().toLowerCase();
    if (!raw) {
      return;
    }
    if (!selectedCategory?.keywords_editable) {
      pushToast(selectedCategory?.keywords_locked_reason || "Для этой категории ключевые слова недоступны");
      return;
    }
    const result = await addCategoryKeyword(selectedCategoryId, raw, scope);
    pushToast(result.message);
    if (result.ok) {
      if (scope === "local") {
        setKeywordInput("");
      } else {
        setTitleKeywordInput("");
      }
    }
  };

  const onRemoveKeyword = async (keyword: string, scope: KeywordScope) => {
    if (!selectedCategoryId) {
      return;
    }
    if (!selectedCategory?.keywords_editable) {
      pushToast(selectedCategory?.keywords_locked_reason || "Для этой категории ключевые слова недоступны");
      return;
    }
    const result = await removeCategoryKeyword(selectedCategoryId, keyword, scope);
    pushToast(result.message);
  };

  const onToggleCategoryEnabled = async (enabled: boolean) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await updateCategory(selectedCategoryId, { is_enabled: enabled });
    pushToast(result.message);
  };

  const onToggleCategoryFavorite = async (isFavorite: boolean) => {
    if (!selectedCategoryId) {
      return;
    }
    const result = await updateCategory(selectedCategoryId, { is_favorite: isFavorite });
    pushToast(result.message);
  };

  const onAddManualProduct = async (productId: number) => {
    if (!selectedCategoryId || !selectedCategoryIsLeaf) {
      return;
    }
    const result = await addCategoryManualProduct(selectedCategoryId, productId);
    pushToast(result.message);
    if (!result.ok) {
      return;
    }
    const [assigned, found] = await Promise.all([
      getCategoryManualProducts(selectedCategoryId),
      manualSearchInput.trim() ? searchCategoryManualProducts(selectedCategoryId, manualSearchInput.trim(), 3) : Promise.resolve({ ok: true, message: "OK", items: [] }),
    ]);
    if (assigned.ok) {
      setManualAssignedProducts(assigned.items);
    }
    if (found.ok) {
      setManualSearchResults(found.items);
    }
  };

  const onRemoveManualProduct = async (productId: number) => {
    if (!selectedCategoryId || !selectedCategoryIsLeaf) {
      return;
    }
    const result = await removeCategoryManualProduct(selectedCategoryId, productId);
    pushToast(result.message);
    if (!result.ok) {
      return;
    }
    const assigned = await getCategoryManualProducts(selectedCategoryId);
    if (assigned.ok) {
      setManualAssignedProducts(assigned.items);
    }
  };

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedCategoryIsLeaf,
    categoryOptions,
    createFormOpen,
    setCreateFormOpen,
    newCategoryName,
    setNewCategoryName,
    newCategoryParentId,
    setNewCategoryParentId,
    newCategoryParentName,
    newCategoryKeywords,
    setNewCategoryKeywords,
    renameCategoryName,
    setRenameCategoryName,
    keywordInput,
    setKeywordInput,
    titleKeywordInput,
    setTitleKeywordInput,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    manualAssignedLoading,
    manualAssignedProducts,
    onStartCategoryCreate,
    onCreateCategory,
    onDeleteCategory,
    onAddKeyword,
    onRemoveKeyword,
    onToggleCategoryEnabled,
    onToggleCategoryFavorite,
    onAddManualProduct,
    onRemoveManualProduct,
  };
}
