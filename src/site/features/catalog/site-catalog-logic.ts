import type {
  SiteCatalogFilterGroup,
  SiteCatalogProduct,
} from "./site-catalog-contracts";
import { patchCatalogSearchParams, readCatalogListParam } from "./site-catalog-query";

function resolveImplicitSingleSelection(
  searchParams: URLSearchParams,
  group: Pick<SiteCatalogFilterGroup, "key" | "queryParam" | "selectionMode">,
) {
  if (group.selectionMode !== "single" || group.key !== "gender") {
    return null;
  }

  const topValue = String(searchParams.get("top") || "").trim();
  return topValue === "men" || topValue === "women" ? topValue : null;
}

export function getCatalogTriggerLabel(
  searchParams: URLSearchParams,
  group: SiteCatalogFilterGroup,
  selectedValues: readonly string[],
) {
  if (group.key === "section") {
    return group.label.toUpperCase();
  }

  if (group.key === "designer" && selectedValues.length > 0) {
    return group.label.toUpperCase();
  }

  if (group.key === "sort" && selectedValues[0] === "featured") {
    return group.label.toUpperCase();
  }

  if (selectedValues.length === 1) {
    return (group.options.find((option) => option.value === selectedValues[0])?.label ?? group.label).toUpperCase();
  }

  return group.label.toUpperCase();
}

export function getCatalogSelectedValues(
  searchParams: URLSearchParams,
  group: Pick<SiteCatalogFilterGroup, "key" | "queryParam" | "selectionMode">,
  options?: { mode?: "explicit" | "effective" },
) {
  if (group.selectionMode === "single") {
    const value = String(searchParams.get(group.queryParam) || "").trim();
    if (value !== "") {
      return [value];
    }

    if (options?.mode === "effective") {
      const implicitValue = resolveImplicitSingleSelection(searchParams, group);
      if (implicitValue) {
        return [implicitValue];
      }
    }

    return group.key === "sort" ? ["featured"] : [];
  }

  return readCatalogListParam(searchParams, group.queryParam);
}

export function clearCatalogGroupSelection(
  searchParams: URLSearchParams,
  group: Pick<SiteCatalogFilterGroup, "queryParam" | "key">
) {
  return patchCatalogSearchParams(searchParams, {
    [group.queryParam]: null,
    ...(group.key === "section"
      ? {
          ctx: null,
          ctx_ref: null,
          multi: null,
        }
      : {}),
  });
}

export function toggleCatalogGroupOption(
  searchParams: URLSearchParams,
  group: Pick<SiteCatalogFilterGroup, "queryParam" | "selectionMode" | "key">,
  optionValue: string
) {
  if (group.selectionMode === "single") {
    const currentValue = String(searchParams.get(group.queryParam) || "").trim();
    return patchCatalogSearchParams(searchParams, {
      [group.queryParam]: group.key === "sort" ? optionValue : currentValue === optionValue ? null : optionValue,
    });
  }

  const selected = readCatalogListParam(searchParams, group.queryParam);
  const values = selected.includes(optionValue) ? selected.filter((item) => item !== optionValue) : [...selected, optionValue];

  return patchCatalogSearchParams(searchParams, {
    [group.queryParam]: values,
    ...(group.key === "section"
      ? {
          multi: null,
          ctx: null,
          ctx_ref: null,
        }
      : {
          multi: undefined,
        }),
  });
}

export function getCatalogProductCountText(products: readonly SiteCatalogProduct[]) {
  return `${products.length} ${products.length === 1 ? "товар" : products.length < 5 ? "товара" : "товаров"}`;
}

export function normalizeCatalogProductsForGrid(products: readonly SiteCatalogProduct[]) {
  return products.map((product) => ({
    id: product.id,
    path: product.path,
    brand: product.brand,
    designerId: product.designerId,
    name: product.name,
    priceRub: product.priceRub,
    oldPriceRub: product.oldPriceRub,
    availability: product.availability,
    imageSrc: product.imageSrc,
    imageAlt: product.imageAlt,
  }));
}
