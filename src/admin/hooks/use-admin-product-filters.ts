import { useState } from "react";

export function useAdminProductFilters() {
  const [productSearch, setProductSearch] = useState<string>("");
  const [productSourceFilter, setProductSourceFilter] = useState<string>("");
  const [productVendorFilter, setProductVendorFilter] = useState<string>("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("");

  return {
    productSearch,
    setProductSearch,
    productSourceFilter,
    setProductSourceFilter,
    productVendorFilter,
    setProductVendorFilter,
    productTypeFilter,
    setProductTypeFilter,
    productStatusFilter,
    setProductStatusFilter,
  };
}
