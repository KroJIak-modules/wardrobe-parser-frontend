import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { fetchAdminFiltersCategoriesMock, saveAdminFiltersCategoriesMock } from "../admin-filters-categories-mock-api";
import type {
  AdminCategoryAttachment,
  AdminCategoryTreeNode,
  AdminCustomCatalog,
  AdminDesignerDirectoryItem,
  AdminFilterTreeNode,
  AdminFiltersCategoriesPayload,
  AdminRuleManualProduct,
} from "../admin-filters-categories-types";

type RuleKeywordScope = "local_category_keywords" | "title_keywords";

const DEFAULT_FILTER_LABEL = "Новый фильтр";
const DEFAULT_CUSTOM_CATALOG_LABEL = "Новый кастомный каталог";

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
  return nodes.find((node) => node.id === id) ?? null;
}

function findCustomCatalogById(nodes: AdminCustomCatalog[], id: number | null): AdminCustomCatalog | null {
  if (id === null) {
    return null;
  }
  return nodes.find((node) => node.id === id) ?? null;
}

function flattenFilters(nodes: AdminFilterTreeNode[]): AdminFilterTreeNode[] {
  const result: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenFilters(node.children));
  }
  return result;
}

function isMultifilterNode(node: AdminFilterTreeNode): boolean {
  return node.children.length > 0;
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

function updateCategoryById(
  nodes: AdminCategoryTreeNode[],
  id: number,
  updater: (node: AdminCategoryTreeNode) => AdminCategoryTreeNode
): AdminCategoryTreeNode[] {
  return nodes.map((node) => (node.id === id ? updater(node) : node));
}

function updateCustomCatalogById(
  nodes: AdminCustomCatalog[],
  id: number,
  updater: (node: AdminCustomCatalog) => AdminCustomCatalog
): AdminCustomCatalog[] {
  return nodes.map((node) => (node.id === id ? updater(node) : node));
}

function removeFilterById(nodes: AdminFilterTreeNode[], id: number): AdminFilterTreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children.length === 0) {
        return node;
      }
      return {
        ...node,
        children: removeFilterById(node.children, id),
      };
    });
}

function appendFilterNode(
  nodes: AdminFilterTreeNode[],
  parentId: number | null,
  newNode: AdminFilterTreeNode
): AdminFilterTreeNode[] {
  if (parentId === null) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: appendFilterNode(node.children, parentId, newNode),
    };
  });
}

function getMaxFilterId(nodes: AdminFilterTreeNode[]): number {
  return nodes.reduce((maxId, node) => {
    const childMax = getMaxFilterId(node.children);
    return Math.max(maxId, node.id, childMax);
  }, 0);
}

function getMaxCustomCatalogId(nodes: AdminCustomCatalog[]): number {
  return nodes.reduce((maxId, node) => Math.max(maxId, node.id), 0);
}

function hasFilterNode(nodes: AdminFilterTreeNode[], id: number): boolean {
  for (const node of nodes) {
    if (node.id === id) {
      return true;
    }
    if (hasFilterNode(node.children, id)) {
      return true;
    }
  }
  return false;
}

function detachFilterNode(
  nodes: AdminFilterTreeNode[],
  id: number
): { nextNodes: AdminFilterTreeNode[]; detachedNode: AdminFilterTreeNode | null } {
  let detachedNode: AdminFilterTreeNode | null = null;
  const nextNodes = nodes
    .filter((node) => {
      if (node.id === id) {
        detachedNode = node;
        return false;
      }
      return true;
    })
    .map((node) => {
      if (detachedNode) {
        return node;
      }
      const nested = detachFilterNode(node.children, id);
      if (!nested.detachedNode) {
        return node;
      }
      detachedNode = nested.detachedNode;
      return {
        ...node,
        children: nested.nextNodes,
      };
    });
  return { nextNodes, detachedNode };
}

function insertFilterNodeBefore(
  nodes: AdminFilterTreeNode[],
  targetId: number,
  insertedNode: AdminFilterTreeNode
): AdminFilterTreeNode[] {
  const nextNodes: AdminFilterTreeNode[] = [];
  for (const node of nodes) {
    if (node.id === targetId) {
      nextNodes.push(insertedNode, node);
      continue;
    }
    if (hasFilterNode(node.children, targetId)) {
      nextNodes.push({
        ...node,
        children: insertFilterNodeBefore(node.children, targetId, insertedNode),
      });
      continue;
    }
    nextNodes.push(node);
  }
  return nextNodes;
}

function insertFilterNodeAsChild(
  nodes: AdminFilterTreeNode[],
  targetId: number,
  insertedNode: AdminFilterTreeNode
): AdminFilterTreeNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return {
        ...node,
        children: [...node.children, insertedNode],
      };
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: insertFilterNodeAsChild(node.children, targetId, insertedNode),
    };
  });
}

function updateManualProductInFilters(
  nodes: AdminFilterTreeNode[],
  productId: number,
  updater: (item: AdminRuleManualProduct) => AdminRuleManualProduct
): AdminFilterTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    rules: {
      ...node.rules,
      manual_products: node.rules.manual_products.map((item) => (
        item.product_id === productId ? updater(item) : item
      )),
    },
    children: updateManualProductInFilters(node.children, productId, updater),
  }));
}

function moveFlatNodeBefore<T extends { id: number }>(nodes: T[], draggedId: number, targetId: number): T[] {
  if (draggedId === targetId) {
    return nodes;
  }
  const draggedNode = nodes.find((node) => node.id === draggedId);
  if (!draggedNode) {
    return nodes;
  }
  const nextNodes = nodes.filter((node) => node.id !== draggedId);
  const targetIndex = nextNodes.findIndex((node) => node.id === targetId);
  if (targetIndex < 0) {
    return nodes;
  }
  nextNodes.splice(targetIndex, 0, draggedNode);
  return nextNodes;
}

function moveFlatNodeToEnd<T extends { id: number }>(nodes: T[], draggedId: number): T[] {
  const draggedNode = nodes.find((node) => node.id === draggedId);
  if (!draggedNode) {
    return nodes;
  }
  return [...nodes.filter((node) => node.id !== draggedId), draggedNode];
}

function searchManualProducts(
  query: string,
  assignedIds: Set<number>,
  library: AdminRuleManualProduct[]
): AdminRuleManualProduct[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }
  return library.filter((item) => {
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
    return haystack.includes(normalizedQuery);
  });
}

function buildCategoryAttachment(kind: AdminCategoryAttachment["kind"], refId: number, categoryId: number): AdminCategoryAttachment {
  return {
    id: `cat-${categoryId}-${kind}-${refId}`,
    kind,
    ref_id: refId,
    hidden_node_ids: [],
  };
}

export function useAdminFiltersCategories() {
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<AdminFilterTreeNode[]>([]);
  const [categories, setCategories] = useState<AdminCategoryTreeNode[]>([]);
  const [customCatalogs, setCustomCatalogs] = useState<AdminCustomCatalog[]>([]);
  const [designerDirectory, setDesignerDirectory] = useState<AdminDesignerDirectoryItem[]>([]);
  const [productLibrary, setProductLibrary] = useState<AdminRuleManualProduct[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCustomCatalogId, setSelectedCustomCatalogId] = useState<number | null>(null);
  const [manualSearchInput, setManualSearchInput] = useState<string>("");
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const [manualSearchResults, setManualSearchResults] = useState<AdminRuleManualProduct[]>([]);
  const [catalogSearchInput, setCatalogSearchInput] = useState<string>("");
  const [catalogSearchLoading, setCatalogSearchLoading] = useState<boolean>(false);
  const [catalogSearchResults, setCatalogSearchResults] = useState<AdminRuleManualProduct[]>([]);
  const deferredManualSearchInput = useDeferredValue(manualSearchInput);
  const deferredCatalogSearchInput = useDeferredValue(catalogSearchInput);

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
      setCustomCatalogs(payload.custom_catalogs);
      setDesignerDirectory(payload.designer_directory);
      setProductLibrary(payload.product_library);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    void saveAdminFiltersCategoriesMock({
      filters,
      categories,
      custom_catalogs: customCatalogs,
      designer_directory: designerDirectory,
      product_library: productLibrary,
    });
  }, [categories, customCatalogs, designerDirectory, filters, loading, productLibrary]);

  const flatFilters = useMemo(() => flattenFilters(filters), [filters]);
  const selectedFilter = useMemo(() => findFilterById(filters, selectedFilterId), [filters, selectedFilterId]);
  const selectedCategory = useMemo(() => findCategoryById(categories, selectedCategoryId), [categories, selectedCategoryId]);
  const selectedCustomCatalog = useMemo(
    () => findCustomCatalogById(customCatalogs, selectedCustomCatalogId),
    [customCatalogs, selectedCustomCatalogId]
  );

  useEffect(() => {
    setManualSearchInput("");
    setManualSearchResults([]);
    setManualSearchLoading(false);
  }, [selectedFilterId]);

  useEffect(() => {
    setCatalogSearchInput("");
    setCatalogSearchResults([]);
    setCatalogSearchLoading(false);
  }, [selectedCustomCatalogId]);

  useEffect(() => {
    if (!selectedFilter || deferredManualSearchInput.trim().length === 0) {
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
      setManualSearchResults(searchManualProducts(deferredManualSearchInput, assignedIds, productLibrary).slice(0, 6));
      setManualSearchLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredManualSearchInput, productLibrary, selectedFilter]);

  useEffect(() => {
    if (!selectedCustomCatalog || deferredCatalogSearchInput.trim().length === 0) {
      setCatalogSearchLoading(false);
      setCatalogSearchResults([]);
      return;
    }
    const assignedIds = new Set(selectedCustomCatalog.manual_products.map((item) => item.product_id));
    let cancelled = false;
    setCatalogSearchLoading(true);
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setCatalogSearchResults(searchManualProducts(deferredCatalogSearchInput, assignedIds, productLibrary).slice(0, 6));
      setCatalogSearchLoading(false);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredCatalogSearchInput, productLibrary, selectedCustomCatalog]);

  const addKeyword = (scope: RuleKeywordScope, raw: string) => {
    const keyword = raw.trim().toLowerCase();
    if (!selectedFilterId || !keyword) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => {
        if (isMultifilterNode(node) || node.rules[scope].includes(keyword)) {
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
      updateFilterById(prev, selectedFilterId, (node) => {
        if (isMultifilterNode(node)) {
          return node;
        }
        return {
          ...node,
          rules: {
            ...node.rules,
            [scope]: node.rules[scope].filter((item) => item !== keyword),
          },
        };
      })
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
        if (isMultifilterNode(node) || node.rules.manual_products.some((item) => item.product_id === productId)) {
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
      updateFilterById(prev, selectedFilterId, (node) => {
        if (isMultifilterNode(node)) {
          return node;
        }
        return {
          ...node,
          rules: {
            ...node.rules,
            manual_products: node.rules.manual_products.filter((item) => item.product_id !== productId),
          },
        };
      })
    );
  };

  const addCustomCatalogProduct = (productId: number) => {
    if (!selectedCustomCatalogId) {
      return;
    }
    const product = productLibrary.find((item) => item.product_id === productId);
    if (!product) {
      return;
    }
    setCustomCatalogs((prev) =>
      updateCustomCatalogById(prev, selectedCustomCatalogId, (catalog) => {
        if (catalog.manual_products.some((item) => item.product_id === productId)) {
          return catalog;
        }
        return {
          ...catalog,
          manual_products: [...catalog.manual_products, product],
        };
      })
    );
  };

  const removeCustomCatalogProduct = (productId: number) => {
    if (!selectedCustomCatalogId) {
      return;
    }
    setCustomCatalogs((prev) =>
      updateCustomCatalogById(prev, selectedCustomCatalogId, (catalog) => ({
        ...catalog,
        manual_products: catalog.manual_products.filter((item) => item.product_id !== productId),
      }))
    );
  };

  const toggleManualProductHidden = (productId: number) => {
    setProductLibrary((prev) => prev.map((item) => (
      item.product_id === productId ? { ...item, is_hidden: !item.is_hidden } : item
    )));
    setFilters((prev) => updateManualProductInFilters(prev, productId, (item) => ({ ...item, is_hidden: !item.is_hidden })));
    setCustomCatalogs((prev) => prev.map((catalog) => ({
      ...catalog,
      manual_products: catalog.manual_products.map((item) => (
        item.product_id === productId ? { ...item, is_hidden: !item.is_hidden } : item
      )),
    })));
  };

  const updateFilterLabel = (value: string) => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => ({
        ...node,
        label: value,
      }))
    );
  };

  const updateFilterDisplayLabel = (value: string) => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => ({
        ...node,
        display_label: value,
      }))
    );
  };

  const setFilterEnabled = (isEnabled: boolean) => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) =>
      updateFilterById(prev, selectedFilterId, (node) => ({
        ...node,
        is_enabled: isEnabled,
      }))
    );
  };

  const deleteSelectedFilter = () => {
    if (!selectedFilterId) {
      return;
    }
    setFilters((prev) => removeFilterById(prev, selectedFilterId));
    setCategories((prev) => prev.map((category) => ({
      ...category,
      attachments: category.attachments.filter((attachment) => !(attachment.kind === "filter" && attachment.ref_id === selectedFilterId)),
    })));
    setSelectedFilterId(null);
  };

  const createFilterNode = (parentId: number | null) => {
    const nextId = getMaxFilterId(filters) + 1;
    const newNode: AdminFilterTreeNode = {
      id: nextId,
      slug: `filter-${nextId}`,
      label: DEFAULT_FILTER_LABEL,
      display_label: DEFAULT_FILTER_LABEL,
      is_enabled: true,
      rules: {
        local_category_keywords: [],
        title_keywords: [],
        manual_products: [],
      },
      children: [],
    };
    setFilters((prev) => appendFilterNode(prev, parentId, newNode));
    setSelectedFilterId(nextId);
    setSelectedCategoryId(null);
    setSelectedCustomCatalogId(null);
  };

  const createCustomCatalog = () => {
    const nextId = getMaxCustomCatalogId(customCatalogs) + 1;
    const nextCatalog: AdminCustomCatalog = {
      id: nextId,
      slug: `custom-catalog-${nextId}`,
      label: DEFAULT_CUSTOM_CATALOG_LABEL,
      is_hidden: false,
      manual_products: [],
    };
    setCustomCatalogs((prev) => [...prev, nextCatalog]);
    setSelectedCustomCatalogId(nextId);
    setSelectedFilterId(null);
    setSelectedCategoryId(null);
  };

  const updateCustomCatalogLabel = (value: string) => {
    if (!selectedCustomCatalogId) {
      return;
    }
    setCustomCatalogs((prev) =>
      updateCustomCatalogById(prev, selectedCustomCatalogId, (catalog) => ({
        ...catalog,
        label: value,
      }))
    );
  };

  const setCustomCatalogHidden = (isHidden: boolean) => {
    if (!selectedCustomCatalogId) {
      return;
    }
    setCustomCatalogs((prev) =>
      updateCustomCatalogById(prev, selectedCustomCatalogId, (catalog) => ({
        ...catalog,
        is_hidden: isHidden,
      }))
    );
  };

  const deleteSelectedCustomCatalog = () => {
    if (!selectedCustomCatalogId) {
      return;
    }
    setCustomCatalogs((prev) => prev.filter((catalog) => catalog.id !== selectedCustomCatalogId));
    setCategories((prev) => prev.map((category) => ({
      ...category,
      attachments: category.attachments.filter((attachment) => !(attachment.kind === "custom_catalog" && attachment.ref_id === selectedCustomCatalogId)),
    })));
    setSelectedCustomCatalogId(null);
  };

  const attachFilterToCategory = (categoryId: number, filterId: number) => {
    setCategories((prev) =>
      updateCategoryById(prev, categoryId, (category) => {
        if (category.behavior === "new") {
          return category;
        }
        if (category.attachments.some((attachment) => attachment.kind === "filter" && attachment.ref_id === filterId)) {
          return category;
        }
        return {
          ...category,
          attachments: [...category.attachments, buildCategoryAttachment("filter", filterId, categoryId)],
        };
      })
    );
  };

  const attachCustomCatalogToCategory = (categoryId: number, customCatalogId: number) => {
    setCategories((prev) =>
      updateCategoryById(prev, categoryId, (category) => {
        if (category.attachments.some((attachment) => attachment.kind === "custom_catalog" && attachment.ref_id === customCatalogId)) {
          return category;
        }
        return {
          ...category,
          attachments: [...category.attachments, buildCategoryAttachment("custom_catalog", customCatalogId, categoryId)],
        };
      })
    );
  };

  const removeCategoryAttachment = (categoryId: number, attachmentId: string) => {
    setCategories((prev) =>
      updateCategoryById(prev, categoryId, (category) => ({
        ...category,
        attachments: category.attachments.filter((attachment) => attachment.id !== attachmentId),
      }))
    );
  };

  const toggleCategoryAttachmentNodeHidden = (categoryId: number, attachmentId: string, nodeId: number) => {
    setCategories((prev) =>
      updateCategoryById(prev, categoryId, (category) => ({
        ...category,
        attachments: category.attachments.map((attachment) => {
          if (attachment.id !== attachmentId) {
            return attachment;
          }
          const isHidden = attachment.hidden_node_ids.includes(nodeId);
          return {
            ...attachment,
            hidden_node_ids: isHidden
              ? attachment.hidden_node_ids.filter((item) => item !== nodeId)
              : [...attachment.hidden_node_ids, nodeId],
          };
        }),
      }))
    );
  };

  const moveFilterNodeBefore = (draggedId: number, targetId: number) => {
    if (draggedId === targetId) {
      return;
    }
    setFilters((prev) => {
      const detached = detachFilterNode(prev, draggedId);
      if (!detached.detachedNode) {
        return prev;
      }
      if (hasFilterNode(detached.detachedNode.children, targetId)) {
        return prev;
      }
      return insertFilterNodeBefore(detached.nextNodes, targetId, detached.detachedNode);
    });
  };

  const moveFilterNodeInside = (draggedId: number, targetId: number) => {
    if (draggedId === targetId) {
      return;
    }
    setFilters((prev) => {
      const detached = detachFilterNode(prev, draggedId);
      if (!detached.detachedNode) {
        return prev;
      }
      if (hasFilterNode(detached.detachedNode.children, targetId)) {
        return prev;
      }
      return insertFilterNodeAsChild(detached.nextNodes, targetId, detached.detachedNode);
    });
  };

  const moveFilterNodeToRoot = (draggedId: number) => {
    setFilters((prev) => {
      const detached = detachFilterNode(prev, draggedId);
      if (!detached.detachedNode) {
        return prev;
      }
      return [...detached.nextNodes, detached.detachedNode];
    });
  };

  const moveCustomCatalogBefore = (draggedId: number, targetId: number) => {
    setCustomCatalogs((prev) => moveFlatNodeBefore(prev, draggedId, targetId));
  };

  const moveCustomCatalogToEnd = (draggedId: number) => {
    setCustomCatalogs((prev) => moveFlatNodeToEnd(prev, draggedId));
  };

  return {
    loading,
    filters,
    flatFilters,
    categories,
    customCatalogs,
    designerDirectory,
    productLibrary,
    selectedFilterId,
    setSelectedFilterId,
    selectedFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedCustomCatalogId,
    setSelectedCustomCatalogId,
    selectedCustomCatalog,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    catalogSearchInput,
    setCatalogSearchInput,
    catalogSearchLoading,
    catalogSearchResults,
    updateFilterLabel,
    updateFilterDisplayLabel,
    setFilterEnabled,
    deleteSelectedFilter,
    createFilterNode,
    createCustomCatalog,
    moveFilterNodeBefore,
    moveFilterNodeInside,
    moveFilterNodeToRoot,
    moveCustomCatalogBefore,
    moveCustomCatalogToEnd,
    addKeyword,
    removeKeyword,
    addManualProduct,
    removeManualProduct,
    addCustomCatalogProduct,
    removeCustomCatalogProduct,
    toggleManualProductHidden,
    updateCustomCatalogLabel,
    setCustomCatalogHidden,
    deleteSelectedCustomCatalog,
    attachFilterToCategory,
    attachCustomCatalogToCategory,
    removeCategoryAttachment,
    toggleCategoryAttachmentNodeHidden,
  };
}
