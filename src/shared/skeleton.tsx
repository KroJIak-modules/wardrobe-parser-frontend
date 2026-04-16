import type { ReactNode } from "react";

export function SkeletonBlock({ className = "", children }: { className?: string; children?: ReactNode }) {
  const cls = className.trim() ? `skeleton ${className}` : "skeleton";
  return <div className={cls} aria-hidden="true">{children}</div>;
}

export function CatalogCardSkeleton() {
  return (
    <article className="card catalog-card">
      <SkeletonBlock className="catalog-skeleton-thumb" />
      <div className="catalog-skeleton-meta">
        <SkeletonBlock className="catalog-skeleton-chip" />
        <SkeletonBlock className="catalog-skeleton-line catalog-skeleton-line--short" />
      </div>
      <SkeletonBlock className="catalog-skeleton-line" />
      <SkeletonBlock className="catalog-skeleton-line catalog-skeleton-line--short" />
      <SkeletonBlock className="catalog-skeleton-price" />
      <div className="catalog-skeleton-actions">
        <SkeletonBlock className="catalog-skeleton-icon" />
        <SkeletonBlock className="catalog-skeleton-icon" />
        <SkeletonBlock className="catalog-skeleton-icon" />
      </div>
    </article>
  );
}

export function CatalogCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="product-grid catalog-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <CatalogCardSkeleton key={`catalog-skeleton-${idx}`} />
      ))}
    </div>
  );
}

export function CatalogRootsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="catalog-hover-roots">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonBlock key={`root-skeleton-${idx}`} className="catalog-hover-root-skeleton" />
      ))}
    </div>
  );
}

export function CatalogPanelSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="catalog-hover-overlay">
      <div className="catalog-hover-panel">
        <div className="catalog-hover-grid">
          {Array.from({ length: columns }).map((_, idx) => (
            <div key={`panel-skeleton-${idx}`} className="catalog-hover-group">
              <SkeletonBlock className="catalog-skeleton-line" />
              <div className="catalog-hover-links">
                <SkeletonBlock className="catalog-skeleton-line" />
                <SkeletonBlock className="catalog-skeleton-line" />
                <SkeletonBlock className="catalog-skeleton-line catalog-skeleton-line--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="admin-skeleton-stack" aria-hidden="true">
      <div className="admin-skeleton-heading">
        <SkeletonBlock className="admin-skeleton-heading-title" />
        <SkeletonBlock className="admin-skeleton-heading-meta" />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={`admin-skeleton-${idx}`} className="admin-skeleton-row-wrap">
          <SkeletonBlock className="admin-skeleton-row admin-skeleton-row--main" />
          <SkeletonBlock className="admin-skeleton-row admin-skeleton-row--side" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  const columns = Math.max(1, cols);
  return (
    <div className="admin-skeleton-table" aria-hidden="true">
      <div className="admin-skeleton-table-head" style={{ gridTemplateColumns: `72px repeat(${Math.max(1, columns - 1)}, minmax(90px, 1fr))` }}>
        <SkeletonBlock className="admin-skeleton-table-head-cell admin-skeleton-table-head-cell--thumb" />
        {Array.from({ length: Math.max(0, columns - 1) }).map((_, idx) => (
          <SkeletonBlock key={`admin-table-head-cell-${idx}`} className="admin-skeleton-table-head-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ridx) => (
        <div key={`admin-table-row-${ridx}`} className="admin-skeleton-table-row" style={{ gridTemplateColumns: `72px repeat(${Math.max(1, columns - 1)}, minmax(90px, 1fr))` }}>
          <SkeletonBlock className="admin-skeleton-table-thumb" />
          {Array.from({ length: Math.max(0, columns - 1) }).map((_, cidx) => (
            <SkeletonBlock
              key={`admin-table-cell-${ridx}-${cidx}`}
              className={`admin-skeleton-table-cell ${cidx === 0 ? "admin-skeleton-table-cell--title" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminProductsSkeleton() {
  return (
    <div className="admin-products-skeleton" aria-hidden="true">
      <div className="admin-products-skeleton-head">
        <SkeletonBlock className="admin-products-skeleton-title" />
        <SkeletonBlock className="admin-products-skeleton-subtitle" />
      </div>
      <div className="products-layout">
        <aside className="products-filters card">
          <SkeletonBlock className="admin-products-skeleton-filter-title" />
          <SkeletonBlock className="admin-products-skeleton-input" />
          <SkeletonBlock className="admin-products-skeleton-input" />
          <SkeletonBlock className="admin-products-skeleton-input" />
          <SkeletonBlock className="admin-products-skeleton-input" />
          <SkeletonBlock className="admin-products-skeleton-button" />
        </aside>
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <AdminTableSkeleton rows={8} cols={8} />
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <article className="section product-view" aria-hidden="true">
      <div className="product-view-back">
        <SkeletonBlock className="product-skeleton-back" />
      </div>

      <div className="product-view-grid">
        <section className="card product-gallery-card">
          <SkeletonBlock className="product-skeleton-image" />
          <div className="slider-thumbs">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonBlock key={`product-skeleton-thumb-${idx}`} className="product-skeleton-thumb" />
            ))}
          </div>
        </section>

        <section className="card product-main-card">
          <div className="product-main-head">
            <SkeletonBlock className="product-skeleton-title" />
            <SkeletonBlock className="product-skeleton-status" />
          </div>
          <SkeletonBlock className="product-skeleton-price" />

          <div className="product-main-meta">
            {Array.from({ length: 5 }).map((_, idx) => (
              <SkeletonBlock key={`product-skeleton-meta-${idx}`} className="product-skeleton-meta-line" />
            ))}
          </div>

          <div className="variants-section">
            <SkeletonBlock className="product-skeleton-variants-title" />
            <div className="variants-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonBlock key={`product-skeleton-variant-${idx}`} className="product-skeleton-variant" />
              ))}
            </div>
          </div>

          <div className="product-main-actions">
            <SkeletonBlock className="product-skeleton-action" />
          </div>
        </section>
      </div>
    </article>
  );
}
