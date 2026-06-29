import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PRODUCTS_QUERY_KEYS, readProductsQuery, withProductsQueryParam } from "../products-query";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value";

export function useAdminProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = readProductsQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState<string>(state.search);
  const debouncedSearchDraft = useDebouncedValue(searchDraft, 220);

  useEffect(() => {
    setSearchDraft(state.search);
  }, [state.search]);

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((previous) => withProductsQueryParam(previous, key, value), { replace: true });
  }, [setSearchParams]);

  const setProductSearch = useCallback((value: string) => {
    setSearchDraft(value);
  }, []);

  useEffect(() => {
    if (debouncedSearchDraft === state.search) {
      return;
    }
    setSearchParams(
      (previous) => withProductsQueryParam(previous, PRODUCTS_QUERY_KEYS.search, debouncedSearchDraft),
      { replace: true }
    );
  }, [debouncedSearchDraft, setSearchParams, state.search]);

  const setProductSourceFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.sourceId, value);
  }, [setParam]);

  const setProductSourceModeFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.sourceMode, value);
  }, [setParam]);

  const setProductDesignerFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.designer, value);
  }, [setParam]);

  const setProductSectionFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.filterSlug, value);
  }, [setParam]);

  const setProductCatalogFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.customCatalogSlug, value);
  }, [setParam]);

  const setProductGenderFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.gender, value);
  }, [setParam]);

  const setProductVisibilityFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.visibilityStatus, value);
  }, [setParam]);

  const setProductAvailabilityModeFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.availabilityMode, value);
  }, [setParam]);

  const setProductOrderabilityFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.orderabilityStatus, value);
  }, [setParam]);

  return {
    productSearch: searchDraft,
    setProductSearch,
    productSourceFilter: state.sourceId,
    setProductSourceFilter,
    productSourceModeFilter: state.sourceMode,
    setProductSourceModeFilter,
    productDesignerFilter: state.designer,
    setProductDesignerFilter,
    productSectionFilter: state.filterSlug,
    setProductSectionFilter,
    productCatalogFilter: state.customCatalogSlug,
    setProductCatalogFilter,
    productGenderFilter: state.gender,
    setProductGenderFilter,
    productVisibilityFilter: state.visibilityStatus,
    setProductVisibilityFilter,
    productAvailabilityModeFilter: state.availabilityMode,
    setProductAvailabilityModeFilter,
    productOrderabilityFilter: state.orderabilityStatus,
    setProductOrderabilityFilter,
  };
}
