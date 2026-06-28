import type { SiteCatalogFilterGroup, SiteCatalogHeaderSource, SiteCatalogProduct } from "./site-catalog-contracts";
import { SiteCatalogFilters } from "./site-catalog-filters";
import { SiteCatalogHeaderDescription } from "./site-catalog-header-description";
import { SiteCatalogPagination } from "./site-catalog-pagination";
import { SiteCatalogProductsGrid } from "./site-catalog-products-grid";
import "./site-catalog.css";

export function SiteCatalogExperienceView({
  title,
  description,
  descriptionSource,
  filterGroups,
  searchParams,
  onSearchParamsChange,
  products,
  currentPage,
  totalPages,
  onPageChange,
}: {
  title: string;
  description: string | null;
  descriptionSource: SiteCatalogHeaderSource;
  filterGroups: readonly SiteCatalogFilterGroup[];
  searchParams: URLSearchParams;
  onSearchParamsChange: (next: URLSearchParams) => void;
  products: readonly SiteCatalogProduct[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="site-catalog-shell" aria-label="Каталог Anton Shell">
      <header className="site-catalog-shell__header">
        <h1 className="site-catalog-shell__title">{title}</h1>
        {description ? <SiteCatalogHeaderDescription description={description} source={descriptionSource} /> : null}
      </header>

      <div className="site-catalog-shell__filters">
        <SiteCatalogFilters
          filterGroups={filterGroups}
          searchParams={searchParams}
          onChange={onSearchParamsChange}
        />
      </div>

      <div className="site-catalog-shell__products">
        <SiteCatalogProductsGrid products={products} />
      </div>

      <SiteCatalogPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  );
}
