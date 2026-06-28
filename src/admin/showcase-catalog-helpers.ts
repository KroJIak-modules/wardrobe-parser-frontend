import type { CategoryView, ServiceProduct } from "../shared/live-data-context";
import { getProductPriceSummary } from "../shared/product-pricing";
import {
  buildVisibleProductWriteState,
  getProductStateClass,
  getProductStateKey,
  getProductStateLabel,
  type ProductStateKey,
} from "../shared/product-state";

export type CatalogSort = "updated_desc" | "updated_asc" | "title_asc" | "price_asc" | "price_desc";

export type CatalogFilters = {
  query: string;
  status: "all" | ProductStateKey;
  sourceId: "all" | number;
  sort: CatalogSort;
};

export type CategoryOption = {
  slug: string;
  label: string;
};

export const ALL_PRODUCTS_ROOT_SLUG = "all-products";

const ROOT_ORDER = ["Все товары", "Новинки", "Дизайнеры", "Мужское", "Женское", "Скидки"];
const ROOT_ORDER_INDEX = new Map(ROOT_ORDER.map((name, index) => [name, index]));

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  query: "",
  status: "all",
  sourceId: "all",
  sort: "updated_desc",
};

type SourceLike = {
  source_id: number | null;
  name: string;
};

type CategoryEntry = {
  node: CategoryView;
  depth: number;
};

function normalizeText(value: string | null | undefined): string {
  return (value || "")
    .trim()
    .toLocaleLowerCase("ru")
    .replace(/\s+/g, " ");
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function flattenCategories(nodes: CategoryView[], depth = 0): CategoryEntry[] {
  const result: CategoryEntry[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    result.push(...flattenCategories(node.children || [], depth + 1));
  }
  return result;
}

function collectDescendantSlugs(node: CategoryView, target: Set<string>): void {
  target.add(node.slug);
  for (const child of node.children || []) {
    collectDescendantSlugs(child, target);
  }
}

function buildCategorySlugIndex(categories: CategoryView[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const { node } of flattenCategories(categories)) {
    const bucket = new Set<string>();
    collectDescendantSlugs(node, bucket);
    index.set(node.slug, bucket);
  }
  return index;
}

function resolveProductCategorySlugs(product: ServiceProduct): string[] {
  const many = (product.internal_category_slugs || []).map((slug) => slug.trim()).filter(Boolean);
  if (many.length > 0) {
    return many;
  }
  const single = (product.internal_category_slug || "").trim();
  if (single) {
    return [single];
  }
  return [];
}

function isDescendantOfRoot(root: CategoryView, slug: string): boolean {
  if (root.slug === slug) {
    return true;
  }
  for (const child of root.children || []) {
    if (isDescendantOfRoot(child, slug)) {
      return true;
    }
  }
  return false;
}

export function normalizeProductStatus(
  value:
    | Pick<ServiceProduct, "visibility_status" | "availability_mode" | "orderability_status" | "lifecycle_status">
    | string
    | null
    | undefined,
): ProductStateKey {
  return getProductStateKey(value);
}

export function deriveStatusAfterUnhide(
  variants: unknown,
  input?: Pick<ServiceProduct, "visibility_status" | "availability_mode" | "orderability_status" | "lifecycle_status"> | null,
) {
  return buildVisibleProductWriteState(input ?? null, variants);
}

export function withSyntheticAllRoot(categories: CategoryView[]): CategoryView[] {
  const enabledRoots = categories.filter((category) => category.is_enabled);
  const hasAll = enabledRoots.some((category) => category.slug === ALL_PRODUCTS_ROOT_SLUG);
  if (hasAll) {
    return enabledRoots;
  }
  const synthetic: CategoryView = {
    id: -1,
    slug: ALL_PRODUCTS_ROOT_SLUG,
    name: "Все товары",
    parent_id: null,
    count: enabledRoots.reduce((sum, item) => sum + Number(item.count || 0), 0),
    is_enabled: true,
    is_system: true,
    is_designers_root: false,
    is_in_designers_branch: false,
    is_fallback: false,
    is_favorite: false,
    children: enabledRoots,
  };
  return [synthetic, ...enabledRoots];
}

export function sortCatalogRoots(categories: CategoryView[]): CategoryView[] {
  return [...categories].sort((left, right) => {
    const leftIndex = ROOT_ORDER_INDEX.get(left.name);
    const rightIndex = ROOT_ORDER_INDEX.get(right.name);
    if (leftIndex !== undefined || rightIndex !== undefined) {
      return (leftIndex ?? Number.MAX_SAFE_INTEGER) - (rightIndex ?? Number.MAX_SAFE_INTEGER);
    }
    return left.name.localeCompare(right.name, "ru");
  });
}

export function buildCategoryOptions(categories: CategoryView[]): CategoryOption[] {
  return flattenCategories(categories)
    .filter(({ node }) => node.is_enabled)
    .map(({ node, depth }) => ({
      slug: node.slug,
      label: `${"\u00A0\u00A0".repeat(Math.max(0, depth))}${node.name}`,
    }));
}

export function getSourceNameById(sources: SourceLike[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const source of sources) {
    if (source.source_id === null) {
      continue;
    }
    map.set(source.source_id, source.name);
  }
  return map;
}

export function getStatusLabel(status: string | null | undefined): string {
  return getProductStateLabel(status);
}

export function getStatusClass(status: string | null | undefined): string {
  return getProductStateClass(status);
}

function applySearchAndFilters(
  products: ServiceProduct[],
  sources: SourceLike[],
  filters: CatalogFilters
): ServiceProduct[] {
  const query = normalizeText(filters.query);
  const sourceNameById = getSourceNameById(sources);

  return products.filter((product) => {
    const status = normalizeProductStatus(product);

    if (filters.status !== "all" && status !== filters.status) {
      return false;
    }

    if (filters.sourceId !== "all" && product.source_id !== filters.sourceId) {
      return false;
    }

    if (!query) {
      return true;
    }

    const sourceName = sourceNameById.get(product.source_id) || "";
    const haystack = normalizeText([
      product.title,
      product.display_designer_name || product.designer_name || product.source_designer_name,
      product.handle,
      product.source_category_name,
      product.url,
      sourceName,
      status,
    ].join(" "));
    return haystack.includes(query);
  });
}

function applySort(products: ServiceProduct[], sort: CatalogSort): ServiceProduct[] {
  const sorted = [...products];
  sorted.sort((left, right) => {
    const leftPrice = getProductPriceSummary(left)?.final_display_price ?? Number.POSITIVE_INFINITY;
    const rightPrice = getProductPriceSummary(right)?.final_display_price ?? Number.POSITIVE_INFINITY;
    if (sort === "title_asc") {
      return (left.title || "").localeCompare(right.title || "", "ru");
    }

    if (sort === "price_asc") {
      return leftPrice - rightPrice;
    }

    if (sort === "price_desc") {
      return (
        (getProductPriceSummary(right)?.final_display_price ?? Number.NEGATIVE_INFINITY)
        - (getProductPriceSummary(left)?.final_display_price ?? Number.NEGATIVE_INFINITY)
      );
    }

    if (sort === "updated_asc") {
      return toTimestamp(left.updated_at) - toTimestamp(right.updated_at);
    }

    return toTimestamp(right.updated_at) - toTimestamp(left.updated_at);
  });
  return sorted;
}

export function filterBySelectedCatalog(
  products: ServiceProduct[],
  categories: CategoryView[],
  selectedCatalogSlug: string
): ServiceProduct[] {
  if (selectedCatalogSlug === ALL_PRODUCTS_ROOT_SLUG) {
    return products;
  }

  const categoryIndex = buildCategorySlugIndex(categories);
  const allowedSlugs = categoryIndex.get(selectedCatalogSlug);

  if (!allowedSlugs || allowedSlugs.size === 0) {
    return [];
  }

  return products.filter((product) => resolveProductCategorySlugs(product).some((slug) => allowedSlugs.has(slug)));
}

export function filterAndSortProducts(
  products: ServiceProduct[],
  categories: CategoryView[],
  sources: SourceLike[],
  selectedCatalogSlug: string,
  filters: CatalogFilters
): ServiceProduct[] {
  const inCatalog = filterBySelectedCatalog(products, categories, selectedCatalogSlug);
  const filtered = applySearchAndFilters(inCatalog, sources, filters);
  return applySort(filtered, filters.sort);
}

export function computeCatalogCounts(products: ServiceProduct[], categories: CategoryView[]): Map<string, number> {
  const index = buildCategorySlugIndex(categories);
  const result = new Map<string, number>();

  for (const [slug, allowedSlugs] of index.entries()) {
    const count = products.filter((product) => resolveProductCategorySlugs(product).some((item) => allowedSlugs.has(item))).length;
    result.set(slug, count);
  }

  result.set(ALL_PRODUCTS_ROOT_SLUG, products.length);
  return result;
}

export function findSelectedRootSlug(roots: CategoryView[], selectedCategorySlug: string): string {
  if (selectedCategorySlug === ALL_PRODUCTS_ROOT_SLUG) {
    return ALL_PRODUCTS_ROOT_SLUG;
  }
  const matched = roots.find((root) => isDescendantOfRoot(root, selectedCategorySlug));
  return matched?.slug || ALL_PRODUCTS_ROOT_SLUG;
}

export function resolveBuyoutPrice(product: ServiceProduct): number | null {
  if (typeof product.buyout_price_rub === "number" && Number.isFinite(product.buyout_price_rub)) {
    return product.buyout_price_rub;
  }
  const components = product.pricing_components || {};
  const keys = ["buyout_rub", "buyout_price_rub", "buyout"]; 
  for (const key of keys) {
    const raw = (components as Record<string, unknown>)[key];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }
    if (typeof raw === "string") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}
