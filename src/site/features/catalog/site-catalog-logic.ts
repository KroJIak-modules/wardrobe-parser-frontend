import type {
  SiteCatalogDesigner,
  SiteCatalogExperience,
  SiteCatalogFilterGroup,
  SiteCatalogFilterOption,
  SiteCatalogHeader,
  SiteCatalogProduct,
  SiteCatalogSection,
  SiteCatalogState,
  SiteCatalogTopKey,
} from "./site-catalog-contracts";
import { patchCatalogSearchParams, readCatalogListParam } from "./site-catalog-query";
import {
  siteCatalogCustomCatalogs,
  siteCatalogDesigners,
  siteCatalogFilterGroups,
  siteCatalogMultiFilters,
  siteCatalogProducts,
  siteCatalogSections,
} from "../../runtime/site-catalog-mock";

const SEARCH_HEADER_MAX_TITLE_LENGTH = "Поиск: павпавпавппвпавпвапва".length;

function buildSearchHeaderTitle(query: string) {
  const baseTitle = `Поиск: ${query}`;
  if (baseTitle.length <= SEARCH_HEADER_MAX_TITLE_LENGTH) {
    return baseTitle;
  }

  return `${baseTitle.slice(0, SEARCH_HEADER_MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function findDesigner(designerId: string): SiteCatalogDesigner | null {
  return siteCatalogDesigners.find((designer) => designer.id === designerId) ?? null;
}

function findSection(sectionId: string): SiteCatalogSection | null {
  return siteCatalogSections.find((section) => section.id === sectionId) ?? null;
}

function hasRestrictiveFilters(state: SiteCatalogState) {
  return (
    state.query !== "" ||
    state.availability !== null ||
    state.sectionIds.length > 0 ||
    state.designerIds.length > 0 ||
    state.genderIds.length > 0
  );
}

function resolveHeader(state: SiteCatalogState): SiteCatalogHeader {
  if (state.query !== "") {
    return { title: buildSearchHeaderTitle(state.query), description: null, source: "search" };
  }

  if (state.top === "sale") {
    return { title: "Скидки", description: null, source: "sale" };
  }

  const customCatalog = state.collection
    ? siteCatalogCustomCatalogs.find((catalog) => catalog.id === state.collection)
    : null;
  if (customCatalog) {
    return { title: customCatalog.label, description: customCatalog.description, source: "custom_catalog" };
  }

  if (state.designerIds.length === 1) {
    const designer = findDesigner(state.designerIds[0]);
    if (designer) {
      return { title: designer.label, description: designer.description, source: "designer" };
    }
  }

  if (state.top === "designers" && state.designerIds.length === 0) {
    return { title: "Дизайнеры", description: null, source: "multiple_designers" };
  }

  if (state.multi) {
    const multi = siteCatalogMultiFilters.find((item) => item.id === state.multi);
    if (multi) {
      return { title: multi.label, description: null, source: "menu_filter" };
    }
  }

  const fromAllProducts = state.collection === "all-products" || (state.top === "new" && state.collection === null);
  if (fromAllProducts && !hasRestrictiveFilters(state)) {
    return { title: "Все товары", description: null, source: "all_products" };
  }

  if (state.designerIds.length > 1) {
    return { title: "Дизайнеры", description: null, source: "multiple_designers" };
  }

  return { title: "Каталог", description: null, source: "catalog" };
}

function matchesQuery(product: SiteCatalogProduct, query: string) {
  if (query === "") {
    return true;
  }

  const normalized = query.toLowerCase();
  return [product.brand, product.name, product.availability].join(" ").toLowerCase().includes(normalized);
}

function matchesSections(product: SiteCatalogProduct, sectionIds: readonly string[]) {
  if (sectionIds.length === 0) {
    return true;
  }

  return sectionIds.some((sectionId) => product.sectionIds.includes(sectionId));
}

function matchesDesigners(product: SiteCatalogProduct, designerIds: readonly string[]) {
  if (designerIds.length === 0) {
    return true;
  }

  return designerIds.includes(product.designerId);
}

function matchesGenders(product: SiteCatalogProduct, genderIds: readonly string[]) {
  if (genderIds.length === 0) {
    return true;
  }

  return genderIds.some((genderId) => product.genders.includes(genderId as "men" | "women"));
}

function applyBaseContext(products: readonly SiteCatalogProduct[], state: SiteCatalogState) {
  let scoped = [...products];

  if (state.top === "sale") {
    scoped = scoped.filter((product) => product.isSale);
  }

  if (state.collection === "my-choice") {
    scoped = scoped.filter((product) => product.customCatalogIds.includes("my-choice"));
  }

  if (state.multi) {
    scoped = scoped.filter((product) =>
      product.sectionIds.some((sectionId) => findSection(sectionId)?.multiFilterIds.includes(state.multi as string))
    );
  }

  return scoped;
}

function applyFilters(products: readonly SiteCatalogProduct[], state: SiteCatalogState) {
  return products
    .filter((product) => matchesQuery(product, state.query))
    .filter((product) => (state.availability ? product.availabilityCode === state.availability : true))
    .filter((product) => matchesSections(product, state.sectionIds))
    .filter((product) => matchesDesigners(product, state.designerIds))
    .filter((product) => matchesGenders(product, state.genderIds));
}

function applySort(products: readonly SiteCatalogProduct[], sort: SiteCatalogState["sort"]) {
  const next = [...products];

  if (sort === "price-asc") {
    return next.sort((left, right) => left.priceRub - right.priceRub);
  }

  if (sort === "price-desc") {
    return next.sort((left, right) => right.priceRub - left.priceRub);
  }

  return next;
}

export function parseCatalogState(searchParams: URLSearchParams): SiteCatalogState {
  const topParam = String(searchParams.get("top") || "new").trim();
  const top: SiteCatalogTopKey = ["new", "designers", "men", "women", "sale"].includes(topParam) ? (topParam as SiteCatalogTopKey) : "new";
  const collection = String(searchParams.get("collection") || "").trim() || null;
  const multi = String(searchParams.get("multi") || "").trim() || null;
  const query = String(searchParams.get("q") || "").trim();
  const availabilityRaw = String(searchParams.get("availability") || "").trim();
  const availability = availabilityRaw === "in-stock" || availabilityRaw === "preorder" ? availabilityRaw : null;
  const sortRaw = String(searchParams.get("sort") || "").trim();
  const sort: SiteCatalogState["sort"] =
    sortRaw === "price-asc" || sortRaw === "price-desc" || sortRaw === "featured" ? sortRaw : "featured";
  const genderIds = readCatalogListParam(searchParams, "gender");
  const normalizedGenderIds =
    genderIds.length === 0 && (top === "men" || top === "women") ? [top] : genderIds;

  return {
    top,
    collection,
    multi,
    sort,
    query,
    availability,
    sectionIds: readCatalogListParam(searchParams, "section"),
    designerIds: readCatalogListParam(searchParams, "designer"),
    genderIds: normalizedGenderIds,
  };
}

export function resolveCatalogExperience(searchParams: URLSearchParams): SiteCatalogExperience {
  const state = parseCatalogState(searchParams);
  const products = applySort(applyFilters(applyBaseContext(siteCatalogProducts, state), state), state.sort);

  return {
    header: resolveHeader(state),
    filterGroups: siteCatalogFilterGroups,
    products,
  };
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
  group: Pick<SiteCatalogFilterGroup, "key" | "queryParam" | "selectionMode">
) {
  if (group.selectionMode === "single") {
    const value = String(searchParams.get(group.queryParam) || "").trim();
    if (value !== "") {
      return [value];
    }

    return group.key === "sort" ? ["featured"] : [];
  }

  return readCatalogListParam(searchParams, group.queryParam);
}

export function clearCatalogGroupSelection(
  searchParams: URLSearchParams,
  group: Pick<SiteCatalogFilterGroup, "queryParam">
) {
  return patchCatalogSearchParams(searchParams, { [group.queryParam]: null });
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
    multi: group.key === "section" ? null : undefined,
  });
}

export function getCatalogProductCountText(products: readonly SiteCatalogProduct[]) {
  return `${products.length} ${products.length === 1 ? "товар" : products.length < 5 ? "товара" : "товаров"}`;
}

export function getCatalogDesignerMap() {
  return new Map(siteCatalogDesigners.map((designer) => [designer.id, designer]));
}

export function getCatalogSectionMap() {
  return new Map(siteCatalogSections.map((section) => [section.id, section]));
}

export function normalizeCatalogProductsForGrid(products: readonly SiteCatalogProduct[]) {
  return products.map((product) => ({
    id: product.id,
    brand: product.brand,
    designerId: product.designerId,
    name: product.name,
    priceRub: product.priceRub,
    availability: product.availability,
    imageSrc: product.imageSrc,
    imageAlt: product.imageAlt,
  }));
}
