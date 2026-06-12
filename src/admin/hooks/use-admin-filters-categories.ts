import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { fetchAdminFiltersCategoriesMock } from "../admin-filters-categories-mock-api";
import type {
  AdminCategoryTreeNode,
  AdminFilterTreeNode,
  AdminFiltersCategoriesPayload,
  AdminRuleManualProduct,
  AdminRuleTreeNode,
} from "../admin-filters-categories-types";

type RuleKeywordScope = "local_category_keywords" | "title_keywords";

type TreeSectionState<T extends AdminRuleTreeNode> = {
  nodes: T[];
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  selectedNode: T | null;
  createOpen: boolean;
  createParentId: number | null;
  createLabel: string;
  setCreateLabel: (value: string) => void;
  openCreate: (parentId: number | null) => void;
  closeCreate: () => void;
  createNode: () => void;
  deleteSelectedNode: () => void;
  updateLabel: (value: string) => void;
  updateSlug: (value: string) => void;
  updateEnabled: (value: boolean) => void;
  updateSelectionMode?: (value: AdminFilterTreeNode["selection_mode"]) => void;
  updatePlacement?: (value: AdminFilterTreeNode["placement"]) => void;
  updateVisibility?: (value: AdminCategoryTreeNode["visibility"]) => void;
  updateRoutePath?: (value: string) => void;
  addKeyword: (scope: RuleKeywordScope, raw: string) => void;
  removeKeyword: (scope: RuleKeywordScope, value: string) => void;
  manualSearchInput: string;
  setManualSearchInput: (value: string) => void;
  manualSearchLoading: boolean;
  manualSearchResults: AdminRuleManualProduct[];
  addManualProduct: (productId: number) => void;
  removeManualProduct: (productId: number) => void;
};

function flattenNodes<T extends AdminRuleTreeNode>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children as T[])]);
}

function countNodes<T extends AdminRuleTreeNode>(nodes: T[]): number {
  return flattenNodes(nodes).length;
}

function findNodeById<T extends AdminRuleTreeNode>(nodes: T[], id: number | null): T | null {
  if (id === null) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findNodeById(node.children as T[], id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function updateNodeById<T extends AdminRuleTreeNode>(nodes: T[], id: number, updater: (node: T) => T): T[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: updateNodeById(node.children as T[], id, updater),
    } as T;
  });
}

function removeNodeById<T extends AdminRuleTreeNode>(nodes: T[], id: number): T[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeNodeById(node.children as T[], id),
    })) as T[];
}

function appendNode<T extends AdminRuleTreeNode>(nodes: T[], parentId: number | null, nextNode: T): T[] {
  if (parentId === null) {
    return [...nodes, nextNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children as T[]), nextNode],
      } as T;
    }
    return {
      ...node,
      children: appendNode(node.children as T[], parentId, nextNode),
    } as T;
  });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function ensureUniqueSlug<T extends AdminRuleTreeNode>(nodes: T[], candidate: string, selectedId?: number | null): string {
  const used = new Set(
    flattenNodes(nodes)
      .filter((node) => node.id !== selectedId)
      .map((node) => node.slug)
  );
  if (!used.has(candidate)) {
    return candidate;
  }
  let index = 2;
  while (used.has(`${candidate}-${index}`)) {
    index += 1;
  }
  return `${candidate}-${index}`;
}

function touchNode<T extends AdminRuleTreeNode>(node: T): T {
  return {
    ...node,
    audit: {
      ...node.audit,
      updated_at: new Date().toISOString(),
      updated_by: "admin.mock@antonshell.local",
    },
  };
}

function buildInitialFilterNode(input: {
  id: number;
  label: string;
  slug: string;
  parentId: number | null;
  parentNode: AdminFilterTreeNode | null;
}): AdminFilterTreeNode {
  return {
    id: input.id,
    entity: "filter",
    label: input.label,
    slug: input.slug,
    parent_id: input.parentId,
    is_enabled: true,
    product_count: 0,
    placement: input.parentNode?.placement || "catalog_toolbar",
    selection_mode: input.parentNode?.selection_mode || "multiple",
    rules: {
      local_category_keywords: [],
      title_keywords: [],
      manual_products: [],
    },
    sample_hits: [],
    audit: {
      updated_at: new Date().toISOString(),
      updated_by: "admin.mock@antonshell.local",
      source_note: "Создано в моковой конфигурации админ-панели.",
    },
    children: [],
  };
}

function buildInitialCategoryNode(input: {
  id: number;
  label: string;
  slug: string;
  parentId: number | null;
  parentNode: AdminCategoryTreeNode | null;
}): AdminCategoryTreeNode {
  const routePath = input.parentNode ? `${input.parentNode.route_path}/${input.slug}` : `/catalog/${input.slug}`;
  return {
    id: input.id,
    entity: "category",
    label: input.label,
    slug: input.slug,
    parent_id: input.parentId,
    is_enabled: true,
    product_count: 0,
    visibility: input.parentNode?.visibility || "public",
    route_path: routePath,
    rules: {
      local_category_keywords: [],
      title_keywords: [],
      manual_products: [],
    },
    sample_hits: [],
    audit: {
      updated_at: new Date().toISOString(),
      updated_by: "admin.mock@antonshell.local",
      source_note: "Создано в моковой конфигурации админ-панели.",
    },
    children: [],
  };
}

function useRuleTreeSection<T extends AdminRuleTreeNode>(params: {
  nodes: T[];
  setNodes: Dispatch<SetStateAction<T[]>>;
  productLibrary: AdminRuleManualProduct[];
  createNodeFactory: (input: { id: number; label: string; slug: string; parentId: number | null; parentNode: T | null }) => T;
  nextId: () => number;
}) {
  const { nodes, setNodes, productLibrary, createNodeFactory, nextId } = params;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createTarget, setCreateTarget] = useState<{ parentId: number | null } | null>(null);
  const [createLabel, setCreateLabel] = useState<string>("");
  const [manualSearchInput, setManualSearchInput] = useState<string>("");
  const [manualSearchLoading, setManualSearchLoading] = useState<boolean>(false);
  const [manualSearchResults, setManualSearchResults] = useState<AdminRuleManualProduct[]>([]);
  const deferredManualSearchInput = useDeferredValue(manualSearchInput);

  const selectedNode = useMemo(() => findNodeById(nodes, selectedId), [nodes, selectedId]);

  useEffect(() => {
    if (nodes.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId === null || !findNodeById(nodes, selectedId)) {
      setSelectedId(nodes[0].id);
    }
  }, [nodes, selectedId]);

  useEffect(() => {
    setManualSearchInput("");
    setManualSearchResults([]);
    setManualSearchLoading(false);
  }, [selectedId]);

  useEffect(() => {
    const query = deferredManualSearchInput.trim().toLowerCase();
    if (!selectedNode || query.length === 0) {
      setManualSearchLoading(false);
      setManualSearchResults([]);
      return;
    }
    const assignedIds = new Set(selectedNode.rules.manual_products.map((item) => item.product_id));
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
          item.price_label,
          item.inventory_hint,
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
  }, [deferredManualSearchInput, productLibrary, selectedNode]);

  const updateSelectedNode = useCallback(
    (updater: (node: T) => T) => {
      if (selectedId === null) {
        return;
      }
      setNodes((prev) => updateNodeById(prev, selectedId, (node) => touchNode(updater(node))));
    },
    [selectedId, setNodes]
  );

  const openCreate = useCallback((parentId: number | null) => {
    setCreateTarget({ parentId });
    setCreateLabel("");
  }, []);

  const closeCreate = useCallback(() => {
    setCreateTarget(null);
    setCreateLabel("");
  }, []);

  const createNode = useCallback(() => {
    const normalizedLabel = createLabel.trim();
    if (!normalizedLabel || !createTarget) {
      return;
    }
    const generatedId = nextId();
    const parentNode = findNodeById(nodes, createTarget.parentId);
    const rawSlug = slugify(normalizedLabel) || `node-${generatedId}`;
    const nextSlug = ensureUniqueSlug(nodes, rawSlug);
    const nextNode = createNodeFactory({
      id: generatedId,
      label: normalizedLabel,
      slug: nextSlug,
      parentId: createTarget.parentId,
      parentNode,
    });
    setNodes((prev) => appendNode(prev, createTarget.parentId, nextNode));
    setSelectedId(nextNode.id);
    closeCreate();
  }, [closeCreate, createLabel, createNodeFactory, createTarget, nextId, nodes, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedId === null) {
      return;
    }
    setNodes((prev) => removeNodeById(prev, selectedId));
  }, [selectedId, setNodes]);

  const updateLabel = useCallback(
    (value: string) => {
      updateSelectedNode((node) => ({ ...node, label: value.trimStart() }));
    },
    [updateSelectedNode]
  );

  const updateSlug = useCallback(
    (value: string) => {
      if (selectedId === null) {
        return;
      }
      const normalized = slugify(value);
      if (!normalized) {
        return;
      }
      const uniqueSlug = ensureUniqueSlug(nodes, normalized, selectedId);
      updateSelectedNode((node) => {
        if (node.entity === "category") {
          return {
            ...node,
            slug: uniqueSlug,
            route_path: node.parent_id === null ? `/catalog/${uniqueSlug}` : node.route_path.replace(/[^/]+$/, uniqueSlug),
          } as T;
        }
        return {
          ...node,
          slug: uniqueSlug,
        } as T;
      });
    },
    [nodes, selectedId, updateSelectedNode]
  );

  const updateEnabled = useCallback(
    (value: boolean) => {
      updateSelectedNode((node) => ({ ...node, is_enabled: value }));
    },
    [updateSelectedNode]
  );

  const addKeyword = useCallback(
    (scope: RuleKeywordScope, raw: string) => {
      const keyword = raw.trim().toLowerCase();
      if (!keyword) {
        return;
      }
      updateSelectedNode((node) => {
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
      });
    },
    [updateSelectedNode]
  );

  const removeKeyword = useCallback(
    (scope: RuleKeywordScope, value: string) => {
      updateSelectedNode((node) => ({
        ...node,
        rules: {
          ...node.rules,
          [scope]: node.rules[scope].filter((item) => item !== value),
        },
      }));
    },
    [updateSelectedNode]
  );

  const addManualProduct = useCallback(
    (productId: number) => {
      const product = productLibrary.find((item) => item.product_id === productId);
      if (!product) {
        return;
      }
      updateSelectedNode((node) => {
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
      });
    },
    [productLibrary, updateSelectedNode]
  );

  const removeManualProduct = useCallback(
    (productId: number) => {
      updateSelectedNode((node) => ({
        ...node,
        rules: {
          ...node.rules,
          manual_products: node.rules.manual_products.filter((item) => item.product_id !== productId),
        },
      }));
    },
    [updateSelectedNode]
  );

  return {
    nodes,
    selectedId,
    setSelectedId,
    selectedNode,
    createOpen: Boolean(createTarget),
    createParentId: createTarget?.parentId ?? null,
    createLabel,
    setCreateLabel,
    openCreate,
    closeCreate,
    createNode,
    deleteSelectedNode,
    updateLabel,
    updateSlug,
    updateEnabled,
    addKeyword,
    removeKeyword,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    addManualProduct,
    removeManualProduct,
  };
}

export function useAdminFiltersCategories() {
  const [loading, setLoading] = useState<boolean>(true);
  const [payloadMeta, setPayloadMeta] = useState<Pick<AdminFiltersCategoriesPayload, "endpoint" | "filters_endpoint" | "categories_endpoint" | "fetched_at"> | null>(null);
  const [filters, setFilters] = useState<AdminFilterTreeNode[]>([]);
  const [categories, setCategories] = useState<AdminCategoryTreeNode[]>([]);
  const [productLibrary, setProductLibrary] = useState<AdminRuleManualProduct[]>([]);
  const nextGeneratedIdRef = useRef<number>(1000);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const payload = await fetchAdminFiltersCategoriesMock();
      if (!active) {
        return;
      }
      setPayloadMeta({
        endpoint: payload.endpoint,
        filters_endpoint: payload.filters_endpoint,
        categories_endpoint: payload.categories_endpoint,
        fetched_at: payload.fetched_at,
      });
      setFilters(payload.filters);
      setCategories(payload.categories);
      setProductLibrary(payload.product_library);
      const knownIds = [
        ...payload.product_library.map((item) => item.product_id),
        ...flattenNodes(payload.filters).map((item) => item.id),
        ...flattenNodes(payload.categories).map((item) => item.id),
      ];
      nextGeneratedIdRef.current = Math.max(...knownIds) + 1;
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const allocateId = useCallback(() => {
    const current = nextGeneratedIdRef.current;
    nextGeneratedIdRef.current += 1;
    return current;
  }, []);

  const filtersSection = useRuleTreeSection({
    nodes: filters,
    setNodes: setFilters,
    productLibrary,
    createNodeFactory: ({ id, label, slug, parentId, parentNode }) =>
      buildInitialFilterNode({ id, label, slug, parentId, parentNode: parentNode as AdminFilterTreeNode | null }),
    nextId: allocateId,
  });

  const categoriesSection = useRuleTreeSection({
    nodes: categories,
    setNodes: setCategories,
    productLibrary,
    createNodeFactory: ({ id, label, slug, parentId, parentNode }) =>
      buildInitialCategoryNode({ id, label, slug, parentId, parentNode: parentNode as AdminCategoryTreeNode | null }),
    nextId: allocateId,
  });

  const updateSelectedFilterField = useCallback(
    (patch: Partial<Pick<AdminFilterTreeNode, "placement" | "selection_mode">>) => {
      if (!filtersSection.selectedNode) {
        return;
      }
      setFilters((prev) =>
        updateNodeById(prev, filtersSection.selectedNode!.id, (node) =>
          touchNode({
            ...node,
            ...patch,
          })
        )
      );
    },
    [filtersSection.selectedNode]
  );

  const updateSelectedCategoryField = useCallback(
    (patch: Partial<Pick<AdminCategoryTreeNode, "visibility" | "route_path">>) => {
      if (!categoriesSection.selectedNode) {
        return;
      }
      setCategories((prev) =>
        updateNodeById(prev, categoriesSection.selectedNode!.id, (node) =>
          touchNode({
            ...node,
            ...patch,
          })
        )
      );
    },
    [categoriesSection.selectedNode]
  );

  const stats = useMemo(() => {
    const flattenedFilters = flattenNodes(filters);
    const flattenedCategories = flattenNodes(categories);
    return {
      filters_count: flattenedFilters.length,
      multifilters_count: flattenedFilters.filter((node) => node.children.length > 0).length,
      categories_count: flattenedCategories.length,
      manual_bindings_count:
        flattenedFilters.reduce((sum, node) => sum + node.rules.manual_products.length, 0) +
        flattenedCategories.reduce((sum, node) => sum + node.rules.manual_products.length, 0),
      catalog_keywords_count:
        flattenedFilters.reduce((sum, node) => sum + node.rules.local_category_keywords.length + node.rules.title_keywords.length, 0) +
        flattenedCategories.reduce((sum, node) => sum + node.rules.local_category_keywords.length + node.rules.title_keywords.length, 0),
    };
  }, [categories, filters]);

  return {
    loading,
    payloadMeta,
    productLibraryCount: productLibrary.length,
    stats,
    filtersSection: {
      ...filtersSection,
      nodeCount: countNodes(filters),
      updateSelectionMode: (value: AdminFilterTreeNode["selection_mode"]) => updateSelectedFilterField({ selection_mode: value }),
      updatePlacement: (value: AdminFilterTreeNode["placement"]) => updateSelectedFilterField({ placement: value }),
    } satisfies TreeSectionState<AdminFilterTreeNode> & { nodeCount: number },
    categoriesSection: {
      ...categoriesSection,
      nodeCount: countNodes(categories),
      updateVisibility: (value: AdminCategoryTreeNode["visibility"]) => updateSelectedCategoryField({ visibility: value }),
      updateRoutePath: (value: string) => updateSelectedCategoryField({ route_path: value.trim() || "/catalog" }),
    } satisfies TreeSectionState<AdminCategoryTreeNode> & { nodeCount: number },
  };
}
