import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconClose, IconExternalLink, IconEye, IconEyeOff, IconStar } from "../shared/mono-icons";
import { ImageWithFallback } from "../shared/image-with-fallback";
import { LatexBrand } from "../shared/latex-brand";
import { CatalogCardSkeletonGrid } from "../shared/skeleton";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";
import {
  getProductPrimaryImageUrl,
  type CategoryView,
  type ProductStarredCategoryOption,
  type ServiceProduct,
  useLiveData,
} from "../shared/live-data-context";
import { CatalogHoverMenu } from "./catalog-hover-menu";
import {
  ALL_PRODUCTS_ROOT_SLUG,
  DEFAULT_CATALOG_FILTERS,
  getSourceNameById,
  getStatusClass,
  getStatusLabel,
  resolveBuyoutPrice,
  sortCatalogRoots,
  type CatalogFilters,
  type ProductUiStatus,
} from "./catalog-helpers";

type CatalogPageProps = {
  forcedCategorySlug?: string | null;
};

type CatalogProductsResponse = {
  items?: ServiceProduct[];
  next_cursor?: string | null;
  has_more?: boolean;
};

const PAGE_SIZE = 36;
const API_BASE = "/api/v1";

let cachedRoots: CategoryView[] | null = null;
let cachedRootNodes = new Map<string, CategoryView>();
let cachedSlugToRoot = new Map<string, string>();

function formatMoney(value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  const amount = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${amount} ${currency}`;
}

function normalizeUiStatus(status: string): ProductUiStatus {
  if (status === "available") {
    return "available";
  }
  if (status === "out_of_stock") {
    return "out_of_stock";
  }
  return "hidden";
}

function flattenCounts(node: CategoryView, target: Map<string, number>) {
  target.set(node.slug, Number(node.count || 0));
  for (const child of node.children || []) {
    flattenCounts(child, target);
  }
}

function hasSlug(node: CategoryView, slug: string): boolean {
  if (node.slug === slug) {
    return true;
  }
  return (node.children || []).some((child) => hasSlug(child, slug));
}

function fillSlugRootMap(node: CategoryView, rootSlug: string) {
  cachedSlugToRoot.set(node.slug, rootSlug);
  for (const child of node.children || []) {
    fillSlugRootMap(child, rootSlug);
  }
}

export function CatalogPage({ forcedCategorySlug = null }: CatalogPageProps) {
  const { sources, loading, error, getProductStarredCategories, setProductStarredCategories, setProductStatus } = useLiveData();
  const navigate = useNavigate();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);
  const routeSyncRef = useRef(false);
  const closeMenuTimerRef = useRef<number | null>(null);

  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(forcedCategorySlug || ALL_PRODUCTS_ROOT_SLUG);
  const [selectedRootSlug, setSelectedRootSlug] = useState<string>(() => {
    const targetSlug = forcedCategorySlug || ALL_PRODUCTS_ROOT_SLUG;
    return cachedSlugToRoot.get(targetSlug) || ALL_PRODUCTS_ROOT_SLUG;
  });
  const [openedRootSlug, setOpenedRootSlug] = useState<string>(() => {
    const targetSlug = forcedCategorySlug || ALL_PRODUCTS_ROOT_SLUG;
    return cachedSlugToRoot.get(targetSlug) || ALL_PRODUCTS_ROOT_SLUG;
  });
  const { toasts, pushToast, closeToast } = useToasts();

  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreServer, setHasMoreServer] = useState<boolean>(false);
  const [loadingFirstPage, setLoadingFirstPage] = useState<boolean>(false);
  const [loadingNextPage, setLoadingNextPage] = useState<boolean>(false);
  const [pendingStatusIds, setPendingStatusIds] = useState<Set<number>>(new Set());

  const [rootsLoading, setRootsLoading] = useState<boolean>(cachedRoots === null);
  const [roots, setRoots] = useState<CategoryView[]>(cachedRoots || []);
  const [rootNodes, setRootNodes] = useState<Map<string, CategoryView>>(() => new Map(cachedRootNodes));
  const [rootPanelLoading, setRootPanelLoading] = useState<Map<string, boolean>>(new Map());

  const [starPicker, setStarPicker] = useState<{
    productId: number;
    loading: boolean;
    options: ProductStarredCategoryOption[];
    selected: number[];
  } | null>(null);

  const sourceNameById = useMemo(() => getSourceNameById(sources), [sources]);

  const sourceOptions = useMemo(() => {
    return sources
      .filter((source) => source.source_id !== null)
      .map((source) => ({ id: Number(source.source_id), name: source.name, url: source.base_url }))
      .sort((left, right) => left.name.localeCompare(right.name, "ru"));
  }, [sources]);

  const sortedRoots = useMemo(() => {
    const allRoot: CategoryView = {
      id: -1,
      slug: ALL_PRODUCTS_ROOT_SLUG,
      name: "Все товары",
      parent_id: null,
      count: roots.reduce((sum, item) => sum + Number(item.count || 0), 0),
      is_enabled: true,
      is_system: true,
      is_designers_root: false,
      is_in_designers_branch: false,
      is_fallback: false,
      is_favorite: false,
      children: [],
    };
    return sortCatalogRoots([allRoot, ...roots]);
  }, [roots]);

  const countsBySlug = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set(ALL_PRODUCTS_ROOT_SLUG, roots.reduce((sum, item) => sum + Number(item.count || 0), 0));
    for (const root of roots) {
      counts.set(root.slug, Number(root.count || 0));
    }
    for (const rootNode of rootNodes.values()) {
      flattenCounts(rootNode, counts);
    }
    return counts;
  }, [roots, rootNodes]);

  const panelCategories = useMemo(() => {
    if (openedRootSlug === ALL_PRODUCTS_ROOT_SLUG) {
      return [] as CategoryView[];
    }
    const root = rootNodes.get(openedRootSlug);
    if (!root) {
      return [] as CategoryView[];
    }
    const base = root.children && root.children.length > 0 ? [...root.children] : [root];
    if (!root.is_designers_root) {
      return base;
    }
    return base.sort((left, right) => {
      const byCount = Number(right.count || 0) - Number(left.count || 0);
      if (byCount !== 0) {
        return byCount;
      }
      return left.name.localeCompare(right.name, "ru");
    });
  }, [openedRootSlug, rootNodes]);

  const isPanelLoading = useMemo(() => {
    if (openedRootSlug === ALL_PRODUCTS_ROOT_SLUG) {
      return false;
    }
    if (!rootNodes.has(openedRootSlug)) {
      return true;
    }
    return Boolean(rootPanelLoading.get(openedRootSlug));
  }, [rootNodes, rootPanelLoading, openedRootSlug]);

  const cancelMenuClose = useCallback(() => {
    if (closeMenuTimerRef.current !== null) {
      window.clearTimeout(closeMenuTimerRef.current);
      closeMenuTimerRef.current = null;
    }
  }, []);

  const scheduleMenuClose = useCallback(() => {
    cancelMenuClose();
    closeMenuTimerRef.current = window.setTimeout(() => {
      setOpenedRootSlug(ALL_PRODUCTS_ROOT_SLUG);
      closeMenuTimerRef.current = null;
    }, 140);
  }, [cancelMenuClose]);

  const fetchRoots = useCallback(async () => {
    if (cachedRoots !== null) {
      setRoots(cachedRoots);
      setRootsLoading(false);
      return;
    }

    setRootsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/catalog/categories/roots?include_counts=1`);
      if (!res.ok) {
        throw new Error(`Ошибка: ${res.status}`);
      }
      const payload = (await res.json()) as CategoryView[];
      const enabledRoots = (payload || []).filter((item) => item.is_enabled && item.parent_id === null);
      cachedRoots = enabledRoots;
      for (const root of enabledRoots) {
        cachedSlugToRoot.set(root.slug, root.slug);
      }
      setRoots(enabledRoots);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      pushToast(`Ошибка каталога: ${message}`);
      setRoots([]);
    } finally {
      setRootsLoading(false);
    }
  }, [pushToast]);

  const fetchRootPanel = useCallback(async (rootSlug: string) => {
    if (!rootSlug || rootSlug === ALL_PRODUCTS_ROOT_SLUG) {
      return null;
    }
    if (cachedRootNodes.has(rootSlug)) {
      return cachedRootNodes.get(rootSlug) || null;
    }
    setRootPanelLoading((prev) => new Map(prev).set(rootSlug, true));
    try {
      const res = await fetch(`${API_BASE}/catalog/categories/root/${encodeURIComponent(rootSlug)}?include_counts=1`);
      if (!res.ok) {
        throw new Error(`Ошибка: ${res.status}`);
      }
      const payload = (await res.json()) as CategoryView;
      cachedRootNodes.set(rootSlug, payload);
      fillSlugRootMap(payload, rootSlug);
      setRootNodes((prev) => {
        const next = new Map(prev);
        next.set(rootSlug, payload);
        return next;
      });
      return payload;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      pushToast(`Ошибка каталога: ${message}`);
      return null;
    } finally {
      setRootPanelLoading((prev) => {
        const next = new Map(prev);
        next.set(rootSlug, false);
        return next;
      });
    }
  }, [pushToast]);

  const resolveRootSlugForCategory = useCallback(async (slug: string): Promise<string> => {
    if (slug === ALL_PRODUCTS_ROOT_SLUG) {
      return ALL_PRODUCTS_ROOT_SLUG;
    }
    const cached = cachedSlugToRoot.get(slug);
    if (cached) {
      return cached;
    }
    const directRoot = roots.find((root) => root.slug === slug);
    if (directRoot) {
      cachedSlugToRoot.set(slug, directRoot.slug);
      return directRoot.slug;
    }
    for (const [rootSlug, rootNode] of rootNodes.entries()) {
      if (hasSlug(rootNode, slug)) {
        cachedSlugToRoot.set(slug, rootSlug);
        return rootSlug;
      }
    }
    for (const root of roots) {
      const rootNode = (await fetchRootPanel(root.slug)) || null;
      if (rootNode && hasSlug(rootNode, slug)) {
        cachedSlugToRoot.set(slug, root.slug);
        return root.slug;
      }
    }
    return ALL_PRODUCTS_ROOT_SLUG;
  }, [fetchRootPanel, rootNodes, roots]);

  const fetchPage = useCallback(async (cursor: string | null, append: boolean) => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    if (selectedCategorySlug !== ALL_PRODUCTS_ROOT_SLUG) {
      params.set("category_slug", selectedCategorySlug);
    }
    if (filters.query.trim()) {
      params.set("search", filters.query.trim());
    }
    if (filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters.sourceId !== "all") {
      params.set("source_id", String(filters.sourceId));
    }
    if (cursor) {
      params.set("cursor", cursor);
    }

    const myRequestId = ++requestIdRef.current;
    if (append) {
      setLoadingNextPage(true);
    } else {
      setLoadingFirstPage(true);
    }

    try {
      const res = await fetch(`${API_BASE}/catalog/products?${params.toString()}`);
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail || `Ошибка: ${res.status}`);
      }
      const payload = (await res.json()) as CatalogProductsResponse;
      if (myRequestId !== requestIdRef.current) {
        return;
      }
      const items = payload.items || [];
      setProducts((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(payload.next_cursor || null);
      setHasMoreServer(Boolean(payload.has_more && payload.next_cursor));
    } catch (e) {
      if (myRequestId !== requestIdRef.current) {
        return;
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      pushToast(`Ошибка каталога: ${message}`);
      if (!append) {
        setProducts([]);
      }
      setNextCursor(null);
      setHasMoreServer(false);
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoadingFirstPage(false);
        setLoadingNextPage(false);
      }
    }
  }, [filters.query, filters.sourceId, filters.status, pushToast, selectedCategorySlug]);

  useEffect(() => {
    if (!error) {
      return;
    }
    pushToast(`Ошибка: ${error}`);
  }, [error, pushToast]);

  useEffect(() => {
    void fetchRoots();
  }, [fetchRoots]);

  useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current !== null) {
        window.clearTimeout(closeMenuTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (roots.length === 0) {
      return;
    }
    const targetSlug = forcedCategorySlug || ALL_PRODUCTS_ROOT_SLUG;
    const cachedRootSlug = cachedSlugToRoot.get(targetSlug);
    if (cachedRootSlug) {
      setSelectedRootSlug(cachedRootSlug);
      setOpenedRootSlug(cachedRootSlug);
    }
    if (
      routeSyncRef.current
      && targetSlug === selectedCategorySlug
      && (targetSlug === ALL_PRODUCTS_ROOT_SLUG || selectedRootSlug !== ALL_PRODUCTS_ROOT_SLUG)
    ) {
      return;
    }
    setSelectedCategorySlug(targetSlug);
    void (async () => {
      const rootSlug = await resolveRootSlugForCategory(targetSlug);
      setSelectedRootSlug(rootSlug);
      setOpenedRootSlug(rootSlug);
      if (rootSlug !== ALL_PRODUCTS_ROOT_SLUG) {
        await fetchRootPanel(rootSlug);
      }
      routeSyncRef.current = true;
    })();
  }, [forcedCategorySlug, roots, resolveRootSlugForCategory, fetchRootPanel, selectedCategorySlug, selectedRootSlug]);

  useEffect(() => {
    setStarPicker(null);
    // Reset pagination before fetching a new category/filter slice.
    setHasMoreServer(false);
    setNextCursor(null);
    void fetchPage(null, false);
  }, [selectedCategorySlug, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        if (!hasMoreServer || loadingNextPage || loadingFirstPage || !nextCursor) {
          return;
        }
        void fetchPage(nextCursor, true);
      },
      { rootMargin: "220px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, hasMoreServer, loadingNextPage, loadingFirstPage, nextCursor]);

  const handleRootHover = (rootSlug: string) => {
    cancelMenuClose();
    setOpenedRootSlug(rootSlug);
    if (rootSlug !== ALL_PRODUCTS_ROOT_SLUG) {
      if (!cachedRootNodes.has(rootSlug)) {
        setRootPanelLoading((prev) => new Map(prev).set(rootSlug, true));
      }
      void fetchRootPanel(rootSlug);
    }
  };

  const handleCategorySelect = (slug: string, rootSlug: string) => {
    cancelMenuClose();
    setSelectedCategorySlug(slug);
    setSelectedRootSlug(rootSlug);
    setOpenedRootSlug(rootSlug);
    if (slug === ALL_PRODUCTS_ROOT_SLUG) {
      navigate("/");
      return;
    }
    navigate(`/category/${slug}`);
  };

  const onQueryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, query: value }));
  };

  const onStatusChange = (value: CatalogFilters["status"]) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const onSourceChange = (value: string) => {
    const parsed = Number(value);
    setFilters((prev) => ({ ...prev, sourceId: value === "all" || !Number.isFinite(parsed) ? "all" : parsed }));
  };

  const onToggleHidden = async (productId: number, currentStatus: ProductUiStatus) => {
    if (pendingStatusIds.has(productId)) {
      return;
    }

    const nextStatus = currentStatus === "hidden" ? "available" : "hidden";
    setPendingStatusIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });

    const result = await setProductStatus(productId, nextStatus);
    if (result.ok) {
      setProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, status: nextStatus } : item)));
    }
    pushToast(result.message);
    setPendingStatusIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const onOpenStarPicker = async (productId: number) => {
    setStarPicker({ productId, loading: true, options: [], selected: [] });
    const result = await getProductStarredCategories(productId);
    if (!result.ok) {
      pushToast(result.message);
      setStarPicker(null);
      return;
    }
    if (result.availableCategories.length === 0) {
      setStarPicker({ productId, loading: false, options: [], selected: [] });
      return;
    }
    setStarPicker({
      productId,
      loading: false,
      options: [...result.availableCategories].sort((left, right) => left.name.localeCompare(right.name, "ru")),
      selected: result.assignedCategoryIds,
    });
  };

  const onToggleStarCategory = async (productId: number, categoryId: number) => {
    if (!starPicker || starPicker.productId !== productId || starPicker.loading) {
      return;
    }
    const previousSelected = starPicker.selected;
    const isSelected = previousSelected.includes(categoryId);
    const nextSelected = isSelected ? previousSelected.filter((id) => id !== categoryId) : [...previousSelected, categoryId];
    setStarPicker((prev) => (prev && prev.productId === productId ? { ...prev, loading: true, selected: nextSelected } : prev));
    const result = await setProductStarredCategories(productId, nextSelected);
    pushToast(result.message);
    if (result.ok) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId
            ? {
                ...item,
                is_favorite: result.assignedCategoryIds.length > 0,
                starred_category_ids: result.assignedCategoryIds,
              }
            : item
        )
      );
    }
    setStarPicker((prev) => {
      if (!prev || prev.productId !== productId) {
        return prev;
      }
      return { ...prev, loading: false, selected: result.ok ? result.assignedCategoryIds : previousSelected };
    });
  };

  const showGridSkeleton = loadingFirstPage || (loading && products.length === 0);

  return (
    <section className="section catalog">
      <div className="catalog-head">
        <div>
          <h1>Каталог товаров</h1>
        </div>
      </div>

      <CatalogHoverMenu
        roots={sortedRoots}
        rootsLoading={rootsLoading}
        openedRootSlug={openedRootSlug}
        selectedRootSlug={selectedRootSlug}
        selectedCategorySlug={selectedCategorySlug}
        categoryCounts={countsBySlug}
        panelCategories={panelCategories}
        panelLoading={isPanelLoading}
        onRootHover={handleRootHover}
        onSelect={handleCategorySelect}
        onMenuEnter={cancelMenuClose}
        onMenuLeave={scheduleMenuClose}
      />

      <div className="catalog-filters card">
        <div className="catalog-filters-grid">
          <label className="catalog-filter-field">
            <span className="muted">Поиск</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Название, бренд, handle, URL"
            />
          </label>

          <label className="catalog-filter-field">
            <span className="muted">Статус</span>
            <select value={filters.status} onChange={(event) => onStatusChange(event.target.value as CatalogFilters["status"])}>
              <option value="all">Все статусы</option>
              <option value="available">В наличии</option>
              <option value="out_of_stock">Нет в наличии</option>
              <option value="hidden">Скрыт</option>
            </select>
          </label>

          <label className="catalog-filter-field">
            <span className="muted">Источник</span>
            <select value={filters.sourceId === "all" ? "all" : String(filters.sourceId)} onChange={(event) => onSourceChange(event.target.value)}>
              <option value="all">Все источники</option>
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {showGridSkeleton ? <CatalogCardSkeletonGrid count={12} /> : null}

      {!showGridSkeleton ? (
        <>
          <div className="product-grid catalog-grid">
            {products.map((product) => {
              const sourceName = sourceNameById.get(product.source_id) || `Источник #${product.source_id}`;
              const sourceUrl = sourceOptions.find((item) => item.id === product.source_id)?.url || null;
              const status = getStatusLabel(product.status);
              const statusClass = getStatusClass(product.status);
              const buyoutRub = resolveBuyoutPrice(product);
              const priceTitle = `Оригинальная цена: ${formatMoney(product.source_price ?? product.price, product.source_currency || product.currency)}\nЗакупка (без маржи): ${buyoutRub === null ? "-" : formatMoney(buyoutRub, "RUB")}`;
              const normalizedStatus = normalizeUiStatus(product.status || "hidden");

              return (
                <article
                  key={product.id}
                  className="card catalog-card catalog-card--clickable"
                  onClick={() => navigate(`/product/${product.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/product/${product.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <ImageWithFallback
                    src={getProductPrimaryImageUrl(product)}
                    alt={product.title}
                    className="thumb catalog-thumb"
                    placeholderClassName="thumb thumb--placeholder catalog-thumb"
                    placeholderText={product.image_count > 0 ? "Image" : "No image"}
                    fallbackText="No image"
                  />

                  <div className="catalog-card-meta">
                    <span className={statusClass}>{status}</span>
                    {sourceUrl ? (
                      <a
                        className="catalog-source-link"
                        href={sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        title={`Открыть ${sourceName}`}
                      >
                        {sourceName}
                      </a>
                    ) : (
                      <span className="catalog-source-link">{sourceName}</span>
                    )}
                  </div>

                  <h3 className="catalog-card-title" title={product.title}>{product.title}</h3>

                  <p className="muted catalog-card-subtitle">
                    <LatexBrand value={product.vendor} />
                  </p>

                  <p className="catalog-card-price" title={priceTitle}>
                    {formatMoney(product.price, product.currency)}
                  </p>

                  <div className="catalog-card-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Открыть источник"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (product.url) {
                          window.open(product.url, "_blank", "noreferrer");
                        }
                      }}
                    >
                      <IconExternalLink className="icon-svg" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title={normalizedStatus === "hidden" ? "Показать товар" : "Скрыть товар"}
                      disabled={pendingStatusIds.has(product.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onToggleHidden(product.id, normalizedStatus);
                      }}
                    >
                      {normalizedStatus === "hidden" ? <IconEyeOff className="icon-svg" /> : <IconEye className="icon-svg" />}
                    </button>
                    <button
                      type="button"
                      className={product.is_favorite ? "icon-btn icon-btn--active" : "icon-btn"}
                      title="Выбрать избранные категории"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (starPicker && starPicker.productId === product.id) {
                          setStarPicker(null);
                        } else {
                          void onOpenStarPicker(product.id);
                        }
                      }}
                    >
                      <IconStar className="icon-svg" />
                    </button>
                    {starPicker && starPicker.productId === product.id ? (
                      <div
                        className="star-picker"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-label="Выбор избранных категорий"
                      >
                        <div className="star-picker-head">
                          <strong>Избранные категории</strong>
                          {starPicker.options.length > 0 ? (
                            <button type="button" className="icon-btn" onClick={() => setStarPicker(null)} title="Закрыть">
                              <IconClose className="icon-svg" />
                            </button>
                          ) : null}
                        </div>
                        {starPicker.options.length === 0 ? (
                          <p className="star-picker-empty">Пусто</p>
                        ) : (
                          starPicker.options.map((option) => (
                            <label key={option.id} className="star-picker-option">
                              <input
                                type="checkbox"
                                checked={starPicker.selected.includes(option.id)}
                                onChange={() => void onToggleStarCategory(product.id, option.id)}
                                disabled={starPicker.loading}
                              />
                              <span>{option.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {products.length === 0 ? (
            <div className="catalog-empty card">
              <p>По текущим фильтрам ничего не найдено.</p>
              <p className="muted">Попробуй убрать часть фильтров или изменить строку поиска.</p>
            </div>
          ) : null}

          <div ref={sentinelRef} className="catalog-sentinel" />

          {(loadingNextPage || hasMoreServer) ? (
            loadingNextPage ? (
              <CatalogCardSkeletonGrid count={4} />
            ) : (
              <div className="catalog-loading-more">
                <span className="muted">Прокрути ниже, чтобы загрузить ещё товары</span>
              </div>
            )
          ) : null}
        </>
      ) : null}
      <ToastStack toasts={toasts} onClose={closeToast} />
    </section>
  );
}
