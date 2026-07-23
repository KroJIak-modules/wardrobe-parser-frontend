import { useEffect, useMemo, useState } from "react";
import { fetchCatalogExperience, fetchCatalogProducts } from "../showcase-api";
import type {
  CatalogExperienceResponse,
  CatalogFilterGroup,
  CatalogPageHeader,
  CatalogViewKey,
  ShowcaseCatalogProduct,
} from "../showcase-contracts";
import { resolveAdminCatalogHeader } from "../showcase-catalog-header";
import { adaptShowcaseFilterGroups } from "../showcase-catalog-filter-logic";
import { createShowcaseFilterShell } from "../showcase-filter-shell";
import { useAdminShowcaseNavigation } from "./use-admin-showcase-navigation";

const DEFAULT_PAGE_SIZE = 48;

function readPage(searchParams: URLSearchParams): number {
  const raw = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export function useAdminShowcaseCatalog(viewKey: CatalogViewKey, searchParams: URLSearchParams) {
  const page = readPage(searchParams);
  const searchKey = searchParams.toString();
  const { sections: navigationSections } = useAdminShowcaseNavigation();
  const experienceSearchKey = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    return `${viewKey}::${next.toString()}`;
  }, [searchKey, viewKey]);

  const [experience, setExperience] = useState<CatalogExperienceResponse | null>(null);
  const [experienceKey, setExperienceKey] = useState<string>("");
  const [filterGroups, setFilterGroups] = useState<CatalogFilterGroup[]>(() => createShowcaseFilterShell());
  const [products, setProducts] = useState<readonly ShowcaseCatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;

    void (async () => {
      const result = await fetchCatalogExperience({ viewKey, searchParams }).catch(() => null);
      if (aborted) {
        return;
      }
      if (result) {
        setExperience(result);
        setExperienceKey(experienceSearchKey);
        setFilterGroups(adaptShowcaseFilterGroups(result.filterGroups));
      }
      // On failure keep shell / previous groups so the bar never collapses.
    })();

    return () => {
      aborted = true;
    };
  }, [experienceSearchKey, viewKey]);

  useEffect(() => {
    let aborted = false;
    setProductsLoading(true);
    setErrorMessage(null);

    void (async () => {
      const result = await fetchCatalogProducts({
        viewKey,
        searchParams,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      }).catch(() => null);

      if (aborted) {
        return;
      }

      if (result) {
        setProducts(result.items);
        setTotal(result.total);
        setErrorMessage(null);
      } else {
        setProducts([]);
        setTotal(0);
        setErrorMessage("Не удалось загрузить товары витрины");
      }
      setProductsLoading(false);
    })();

    return () => {
      aborted = true;
    };
  }, [page, searchKey, viewKey]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)), [total]);

  // Only trust server header for the current experience key — never show a stale title.
  const matchedServerHeader: CatalogPageHeader | null =
    experienceKey === experienceSearchKey ? experience?.view.header ?? null : null;

  const header = useMemo(
    () =>
      resolveAdminCatalogHeader({
        viewKey,
        searchParams,
        filterGroups,
        navigationSections,
        fallbackHeader: matchedServerHeader,
      }),
    [filterGroups, matchedServerHeader, navigationSections, searchKey, viewKey],
  );

  return {
    experience,
    header,
    filterGroups,
    products,
    currentPage: page,
    totalPages,
    total,
    loading: productsLoading,
    errorMessage,
  };
}
