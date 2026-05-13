import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { PRODUCTS_QUERY_KEYS, readProductsQuery, withProductsQueryParam } from "../products-query";

export function useAdminProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = readProductsQuery(searchParams);

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((previous) => withProductsQueryParam(previous, key, value), { replace: true });
  }, [setSearchParams]);

  const setProductSearch = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.search, value);
  }, [setParam]);

  const setProductSourceFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.sourceId, value);
  }, [setParam]);

  const setProductVendorFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.vendor, value);
  }, [setParam]);

  const setProductTypeFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.productType, value);
  }, [setParam]);

  const setProductStatusFilter = useCallback((value: string) => {
    setParam(PRODUCTS_QUERY_KEYS.status, value);
  }, [setParam]);

  return {
    productSearch: state.search,
    setProductSearch,
    productSourceFilter: state.sourceId,
    setProductSourceFilter,
    productVendorFilter: state.vendor,
    setProductVendorFilter,
    productTypeFilter: state.productType,
    setProductTypeFilter,
    productStatusFilter: state.status,
    setProductStatusFilter,
  };
}
