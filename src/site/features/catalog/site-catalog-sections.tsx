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
  loading = false,
  errorMessage = null,
  onPageChange,
  fallback,
  layout = "desktop",
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
  loading?: boolean;
  errorMessage?: string | null;
  onPageChange: (page: number) => void;
  layout?: "desktop" | "tablet";
  fallback?: {
    products: readonly SiteCatalogProduct[];
    loading: boolean;
    errorMessage: string | null;
    currentPage: number;
    totalPages: number;
    searchParams: URLSearchParams;
    onSearchParamsChange: (next: URLSearchParams) => void;
    onPageChange: (page: number) => void;
  };
}) {
  const activeSearchParams = fallback?.searchParams ?? searchParams;
  const activeSearchParamsChange = fallback?.onSearchParamsChange ?? onSearchParamsChange;

  return (
    <section className={fallback ? "site-catalog-shell site-catalog-shell--search-empty" : "site-catalog-shell"} aria-label="Каталог Anton Shell">
      <header className="site-catalog-shell__header">
        <h1 className="site-catalog-shell__title">{title}</h1>
        {description ? <SiteCatalogHeaderDescription description={description} source={descriptionSource} /> : null}
      </header>

      {fallback ? (
        <>
          <p className="site-catalog-shell__search-empty">Ничего не найдено</p>
          <h2 className="site-catalog-shell__fallback-title">ВСЕ ТОВАРЫ</h2>
        </>
      ) : null}

      <div className="site-catalog-shell__filters">
        <SiteCatalogFilters
          filterGroups={filterGroups}
          searchParams={activeSearchParams}
          onChange={activeSearchParamsChange}
          layout={layout}
        />
      </div>

      <div className="site-catalog-shell__products">
        <SiteCatalogProductsGrid
          products={fallback?.products ?? products}
          loading={fallback?.loading ?? loading}
          errorMessage={fallback?.errorMessage ?? errorMessage}
        />
      </div>

      <SiteCatalogPagination
        currentPage={fallback?.currentPage ?? currentPage}
        totalPages={fallback?.totalPages ?? totalPages}
        onPageChange={fallback?.onPageChange ?? onPageChange}
      />
    </section>
  );
}
