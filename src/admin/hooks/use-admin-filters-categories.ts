import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { fetchAdminFiltersCategoriesMock } from "../admin-filters-categories-mock-api";
import type {
  AdminCategoryTreeNode,
  AdminFilterTreeNode,
  AdminFiltersCategoriesPayload,
  AdminRuleManualProduct,
} from "../admin-filters-categories-types";

type RuleKeywordScope = "local_category_keywords" | "title_keywords";

function flattenFilterNodes(nodes: AdminFilterTreeNode[]): AdminFilterTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenFilterNodes(node.children)]);
}

function flattenCategoryNodes(nodes: AdminCategoryTreeNode[]): AdminCategoryTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategoryNodes(node.children)]);
}

function findFilterById(nodes: AdminFilterTreeNode[], id: number | null): AdminFilterTreeNode | null {
  if (id === null) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findFilterById(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function findCategoryById(nodes: AdminCategoryTreeNode[], id: number | null): AdminCategoryTreeNode | null {
  if (id === null) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findCategoryById(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function updateFilterById(
  nodes: AdminFilterTreeNode[],
  id: number,
  updater: (node: AdminFilterTreeNode) => AdminFilterTreeNode
): AdminFilterTreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: updateFilterById(node.children, id, updater),
    };
  });
}

export function useAdminFiltersCategories() {
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<AdminFilterTreeNode[]>([]);
  const [categories, setCategories] = useState<AdminCategoryTreeNode[]>([]);
  const [productLibrary, setProductLibrary] = useState<AdminRuleManualProduct[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [manualSearchInput, setManualSearchInput] = useState<string>("");
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const [manualSearchResults, setManualSearchResults] = useState<AdminRuleManualProduct[]>([]);
  const deferredManualSearchInput = useDeferredValue(manualSearchInput);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const payload: AdminFiltersCategoriesPayload = await fetchAdminFiltersCategoriesMock();
      if (!active) {
        return;
      }
      setFilters(payload.filters);
      setCategories(payload.categories);
      setProductLibrary(payload.product_library);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (filters.length > 0 && selectedFilterId === null) {
      setSelectedFilterId(filters[0].id);
    }
  }, [filters, selectedFilterId]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const selectedFilter = useMemo(() => findFilterById(filters, selectedFilterId), [filters, selectedFilterId]);
  const selectedCategory = useMemo(() => findCategoryById(categories, selectedCategoryId), [categories, selectedCategoryId]);

  useEffect(() => {
    setManualSearchInput("");
    setManualSearchResults([]);
    setManualSearchLoading(false);
  }, [selectedFilterId]);

  useEffect(() => {
    const query = deferredManualSearchInput.trim().toLowerCase();
    if (!selectedFilter || query.length === 0) {
      setManualSearchLoading(false);
      setManualSearchResults([]);
      return;
    }
    const assignedIds = new Set(selectedFilter.rules.manual_products.map((item) => item.product_id));
    let cancelled = false;
    setManualSearchLoading(true);
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      const results = productLibrary.filter((item) => {
        if (assignedIds.has(item.product_id)) {
          return false;
        }
        const haystack = [
          item.vendor,
          item.title,
          item.source_name,
          item.matched_local_categories.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
      setManualSearchResults(results.slice(0, 6));
      setManualSearchLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredManualSearchInput, productLibrary, selectedFilter]);

  const addKeyword = (scope: RuleKeywordScope, raw: string) => {
    const keyword = raw.trim().toLowerCase();
    if (!selectedFilterId || !keyword) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => {
        if (node.rules[scope].includes(keyword)) {
          return node;
        }
        return {
          ...node,
          rules: {
            ...node.rules,
            [scope]: [...node.rules[scope], keyword],
          },
        };
      })
    );
  };

  const removeKeyword = (scope: RuleKeywordScope, keyword: string) => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => ({
        ...node,
        rules: {
          ...node.rules,
          [scope]: node.rules[scope].filter((item) => item !== keyword),
        },
      }))
    );
  };

  const addManualProduct = (productId: number) => {
    if (!selectedFilterId) {
      return;
    }
    const product = productLibrary.find((item) => item.product_id === productId);
    if (!product) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => {
        if (node.rules.manual_products.some((item) => item.product_id === productId)) {
          return node;
        }
        return {
          ...node,
          rules: {
            ...node.rules,
            manual_products: [...node.rules.manual_products, product],
          },
        };
      })
    );
  };

  const removeManualProduct = (productId: number) => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => ({
        ...node,
        rules: {
          ...node.rules,
          manual_products: node.rules.manual_products.filter((item) => item.product_id !== productId),
        },
      }))
    );
  };

  return {
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
    filtersCount: flattenFilterNodes(filters).length,
    categoriesCount: flattenCategoryNodes(categories).length,
  };
}
