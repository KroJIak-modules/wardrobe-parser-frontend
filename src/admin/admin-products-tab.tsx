import type { RefObject } from "react";
import { AdminProductsSkeleton } from "../shared/skeleton";
import type { AdminFilterFacetOption, AdminProductsTableItem } from "./admin-types";
import { AdminProductsFilters } from "./admin-products-filters";
import { AdminProductsTable } from "./admin-products-table";

type SourceLabel = {
  name: string;
};

type Props = {
  tableLoading: boolean;
  tableProducts: AdminProductsTableItem[];
  tableTotal: number;
  tableOverallTotal: number;
  productSearch: string;
  setProductSearch: (value: string) => void;
  productSourceFilter: string;
  setProductSourceFilter: (value: string) => void;
  productSourceModeFilter: string;
  setProductSourceModeFilter: (value: string) => void;
  productDesignerFilter: string;
  setProductDesignerFilter: (value: string) => void;
  productCatalogFilter: string;
  setProductCatalogFilter: (value: string) => void;
  productSectionFilter: string;
  setProductSectionFilter: (value: string) => void;
  productGenderFilter: string;
  setProductGenderFilter: (value: string) => void;
  productVisibilityFilter: string;
  setProductVisibilityFilter: (value: string) => void;
  productAvailabilityModeFilter: string;
  setProductAvailabilityModeFilter: (value: string) => void;
  productOrderabilityFilter: string;
  setProductOrderabilityFilter: (value: string) => void;
  sourceFacetOptions: AdminFilterFacetOption[];
  productDesigners: AdminFilterFacetOption[];
  productCatalogs: AdminFilterFacetOption[];
  productSections: AdminFilterFacetOption[];
  productGenders: AdminFilterFacetOption[];
  sourceById: Map<number, SourceLabel>;
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
  productSourceModeFilter,
  setProductSourceModeFilter,
  productDesignerFilter,
  setProductDesignerFilter,
  productCatalogFilter,
  setProductCatalogFilter,
  productSectionFilter,
  setProductSectionFilter,
  productGenderFilter,
  setProductGenderFilter,
  productVisibilityFilter,
  setProductVisibilityFilter,
  productAvailabilityModeFilter,
  setProductAvailabilityModeFilter,
  productOrderabilityFilter,
  setProductOrderabilityFilter,
  sourceFacetOptions,
  productDesigners,
  productCatalogs,
  productSections,
  productGenders,
  sourceById,
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
              productSourceModeFilter={productSourceModeFilter}
              setProductSourceModeFilter={setProductSourceModeFilter}
              productDesignerFilter={productDesignerFilter}
              setProductDesignerFilter={setProductDesignerFilter}
              productCatalogFilter={productCatalogFilter}
              setProductCatalogFilter={setProductCatalogFilter}
              productSectionFilter={productSectionFilter}
              setProductSectionFilter={setProductSectionFilter}
              productGenderFilter={productGenderFilter}
              setProductGenderFilter={setProductGenderFilter}
              productVisibilityFilter={productVisibilityFilter}
              setProductVisibilityFilter={setProductVisibilityFilter}
              productAvailabilityModeFilter={productAvailabilityModeFilter}
              setProductAvailabilityModeFilter={setProductAvailabilityModeFilter}
              productOrderabilityFilter={productOrderabilityFilter}
              setProductOrderabilityFilter={setProductOrderabilityFilter}
              sourceFacetOptions={sourceFacetOptions}
              productDesigners={productDesigners}
              productCatalogs={productCatalogs}
              productSections={productSections}
              productGenders={productGenders}
            />
            <AdminProductsTable
              tableLoading={tableLoading}
              tableProducts={tableProducts}
              sourceById={sourceById}
              tableLoadingMore={tableLoadingMore}
              productsSentinelRef={productsSentinelRef}
            />
          </div>
        </>
      )}
    </div>
  );
}
