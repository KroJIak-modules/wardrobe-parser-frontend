import type { CategoryView, ServiceProduct } from "../shared/live-data-context";
import { toSlug } from "../shared/utils";

const ROOT_ORDER = ["Новинки", "Дизайнеры", "Мужское", "Женское", "Скидки"];
const ROOT_ORDER_INDEX = new Map(ROOT_ORDER.map((name, index) => [name, index]));

export function sortStorefrontRoots(categories: CategoryView[]): CategoryView[] {
  return [...categories].sort((left, right) => {
    const leftIndex = ROOT_ORDER_INDEX.get(left.name);
    const rightIndex = ROOT_ORDER_INDEX.get(right.name);
    if (leftIndex !== undefined || rightIndex !== undefined) {
      return (leftIndex ?? Number.MAX_SAFE_INTEGER) - (rightIndex ?? Number.MAX_SAFE_INTEGER);
    }
    return left.name.localeCompare(right.name, "ru");
  });
}

export function flattenCategories(nodes: CategoryView[]): CategoryView[] {
  const result: CategoryView[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenCategories(node.children));
  }
  return result;
}

export function findCategoryBySlug(nodes: CategoryView[], slug: string | undefined): CategoryView | undefined {
  if (!slug) {
    return undefined;
  }
  const target = slug.trim();
  if (!target) {
    return undefined;
  }
  return flattenCategories(nodes).find((node) => node.slug === target);
}

export function findRootForCategory(nodes: CategoryView[], categorySlug: string | null | undefined): CategoryView | undefined {
  if (!categorySlug) {
    return sortStorefrontRoots(nodes)[0];
  }

  const target = categorySlug.trim();
  if (!target) {
    return sortStorefrontRoots(nodes)[0];
  }

  const walk = (node: CategoryView): boolean => {
    if (node.slug === target) {
      return true;
    }
    return node.children.some((child) => walk(child));
  };

  const roots = sortStorefrontRoots(nodes);
  const matchedRoot = roots.find((node) => walk(node));
  return matchedRoot || roots[0];
}

function normalizeKey(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ru");
}

function collectDescendantSlugs(node: CategoryView, target: Set<string>): void {
  target.add(node.slug);
  for (const child of node.children) {
    collectDescendantSlugs(child, target);
  }
}

function resolveProductCategorySlugs(product: ServiceProduct): string[] {
  const multi = (product.internal_category_slugs || [])
    .map((slug) => (slug || "").trim())
    .filter((slug) => slug.length > 0);
  if (multi.length > 0) {
    return multi;
  }
  const single = (product.internal_category_slug || "").trim();
  if (single) {
    return [single];
  }
  return [toSlug(product.product_type || "Прочее")];
}

export function filterProductsForCategory(products: ServiceProduct[], category: CategoryView | undefined): ServiceProduct[] {
  if (!category) {
    return [];
  }

  const available = products.filter((product) => product.status === "available");
  if (category.is_designers_root) {
    return available.filter((product) => normalizeKey(product.vendor) !== "");
  }

  if (category.is_in_designers_branch) {
    const expectedVendor = normalizeKey(category.name);
    if (!expectedVendor) {
      return [];
    }
    return available.filter((product) => normalizeKey(product.vendor) === expectedVendor);
  }

  const selectedSlugs = new Set<string>();
  collectDescendantSlugs(category, selectedSlugs);
  return available.filter((product) =>
    resolveProductCategorySlugs(product).some((slug) => selectedSlugs.has(slug))
  );
}
