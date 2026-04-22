import type { Dispatch, RefObject, SetStateAction } from "react";
import { AdminProductsSkeleton } from "../shared/skeleton";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "./admin-types";
import { AdminProductsFilters } from "./admin-products-filters";
import { AdminProductsTable } from "./admin-products-table";

type StatusBadge = {
  cls: string;
  label: string;
};

type SourceLabel = {
  name: string;
};

type Props = {
  tableLoading: boolean;
  tableProducts: AdminProductsTableItem[];
  tableTotal: number;
  tableOverallTotal: number;
  productSearch: string;
  setProductSearch: Dispatch<SetStateAction<string>>;
  productSourceFilter: string;
  setProductSourceFilter: Dispatch<SetStateAction<string>>;
  productVendorFilter: string;
  setProductVendorFilter: Dispatch<SetStateAction<string>>;
  productTypeFilter: string;
  setProductTypeFilter: Dispatch<SetStateAction<string>>;
  productStatusFilter: string;
  setProductStatusFilter: Dispatch<SetStateAction<string>>;
  sourceSelectOptions: Array<{ key: string; source_id: number | null; name: string }>;
  productVendors: AdminFilterFacetOption[];
  productTypes: AdminFilterFacetOption[];
  sourceById: Map<number, SourceLabel>;
  statusBadge: (status: string) => StatusBadge;
  tableLoadingMore: boolean;
  productsSentinelRef: RefObject<HTMLDivElement | null>;
};

export function AdminProductsTab({
  tableLoading,
  tableProducts,
  tableTotal,
  tableOverallTotal,
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
  sourceSelectOptions,
  productVendors,
  productTypes,
  sourceById,
  statusBadge,
  tableLoadingMore,
  productsSentinelRef,
}: Props) {
  return (
    <div className="card">
      {tableLoading && tableProducts.length === 0 ? (
        <AdminProductsSkeleton />
      ) : (
        <>
          <h2>{tableLoading && tableProducts.length === 0 ? "Все товары" : `Все товары (${tableTotal}/${tableOverallTotal})`}</h2>

          <div className="products-layout">
            <AdminProductsFilters
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              productSourceFilter={productSourceFilter}
              setProductSourceFilter={setProductSourceFilter}
              productVendorFilter={productVendorFilter}
              setProductVendorFilter={setProductVendorFilter}
              productTypeFilter={productTypeFilter}
              setProductTypeFilter={setProductTypeFilter}
              productStatusFilter={productStatusFilter}
              setProductStatusFilter={setProductStatusFilter}
              sourceSelectOptions={sourceSelectOptions}
              productVendors={productVendors}
              productTypes={productTypes}
            />
            <AdminProductsTable
              tableLoading={tableLoading}
              tableProducts={tableProducts}
              sourceById={sourceById}
              statusBadge={statusBadge}
              tableLoadingMore={tableLoadingMore}
              productsSentinelRef={productsSentinelRef}
            />
          </div>
        </>
      )}
    </div>
  );
}
