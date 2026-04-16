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
          </div>
          <SkeletonBlock className="product-skeleton-status" />

          <div className="product-main-meta">
            <div className="product-meta-chips">
              <SkeletonBlock className="product-skeleton-chip" />
            </div>
            <div className="product-meta-categories">
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
            </div>
          </div>

          <div className="variants-section">
            <SkeletonBlock className="product-skeleton-variants-title" />
            <div className="variants-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonBlock key={`product-skeleton-variant-${idx}`} className="product-skeleton-variant" />
              ))}
            </div>
          </div>

          <div className="product-pricing-card">
            <div className="product-pricing-item">
              <SkeletonBlock className="product-skeleton-meta-line product-skeleton-meta-line--label" />
              <SkeletonBlock className="product-skeleton-price-value" />
            </div>
            <div className="product-pricing-item">
              <SkeletonBlock className="product-skeleton-meta-line product-skeleton-meta-line--label" />
              <SkeletonBlock className="product-skeleton-price-value" />
            </div>
          </div>

          <div className="product-main-actions">
            <SkeletonBlock className="product-skeleton-action" />
            <SkeletonBlock className="product-skeleton-action" />
          </div>
        </section>
      </div>
    </article>
  );
}

export function AdminDedupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="dedup-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={`dedup-skeleton-${idx}`} className="dedup-item admin-dedup-skeleton-item">
          <div className="dedup-head">
            <SkeletonBlock className="admin-dedup-skeleton-score" />
            <SkeletonBlock className="admin-dedup-skeleton-reasons" />
          </div>
          <div className="dedup-grid">
            {Array.from({ length: 2 }).map((__, cidx) => (
              <div key={`dedup-skeleton-col-${idx}-${cidx}`} className="dedup-col admin-dedup-skeleton-col">
                <SkeletonBlock className="admin-dedup-skeleton-title" />
                <SkeletonBlock className="admin-dedup-skeleton-line admin-dedup-skeleton-line--short" />
                <SkeletonBlock className="admin-dedup-skeleton-line" />
                <SkeletonBlock className="admin-dedup-skeleton-btn" />
              </div>
            ))}
          </div>
          <div className="actions">
            <SkeletonBlock className="admin-dedup-skeleton-btn admin-dedup-skeleton-btn--wide" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCategoriesSkeleton() {
  return (
    <div className="categories-layout" aria-hidden="true">
      <div>
        <div className="actions" style={{ marginBottom: "0.5rem" }}>
          <SkeletonBlock className="admin-categories-skeleton-root-btn" />
        </div>
        <div className="cat-tree-wrap admin-categories-skeleton-tree">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`admin-cat-tree-skeleton-${idx}`} className="admin-categories-skeleton-tree-row" style={{ marginLeft: `${(idx % 3) * 12}px` }}>
              <SkeletonBlock className="admin-categories-skeleton-tree-node" />
              <SkeletonBlock className="admin-categories-skeleton-tree-meta" />
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <SkeletonBlock className="admin-categories-skeleton-panel-title" />
        <div className="form">
          <SkeletonBlock className="admin-categories-skeleton-input" />
          <SkeletonBlock className="admin-categories-skeleton-switch" />
          <SkeletonBlock className="admin-categories-skeleton-switch" />
          <SkeletonBlock className="admin-categories-skeleton-btn" />
        </div>
        <SkeletonBlock className="admin-categories-skeleton-hint" />
      </div>
    </div>
  );
}

export function AdminSourcesSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={`source-skeleton-${idx}`} className="list-row admin-sources-skeleton-row">
          <div className="admin-sources-skeleton-main">
            <SkeletonBlock className="admin-sources-skeleton-title" />
            <SkeletonBlock className="admin-sources-skeleton-line" />
            <SkeletonBlock className="admin-sources-skeleton-line admin-sources-skeleton-line--short" />
          </div>
          <SkeletonBlock className="admin-sources-skeleton-switch" />
        </div>
      ))}
    </div>
  );
}

export function AdminPricingSkeleton() {
  return (
    <div className="admin-pricing-skeleton" aria-hidden="true">
      <div className="pricing-worker-box">
        <SkeletonBlock className="admin-pricing-skeleton-section-title" />
        <div className="pricing-worker-grid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`pricing-worker-skeleton-${idx}`} className="pricing-worker-item">
              <SkeletonBlock className="admin-pricing-skeleton-line admin-pricing-skeleton-line--label" />
              <SkeletonBlock className="admin-pricing-skeleton-line" />
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-formula-box">
        <SkeletonBlock className="admin-pricing-skeleton-section-title" />
        <SkeletonBlock className="admin-pricing-skeleton-formula" />
        <div className="pricing-example-summary">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`pricing-example-skeleton-${idx}`} className="pricing-example-metric">
              <SkeletonBlock className="admin-pricing-skeleton-line admin-pricing-skeleton-line--label" />
              <SkeletonBlock className="admin-pricing-skeleton-line" />
            </div>
          ))}
        </div>
      </div>

      <div className="pricing-settings-grid">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`pricing-field-skeleton-${idx}`} className="pricing-settings-field">
            <SkeletonBlock className="admin-pricing-skeleton-line admin-pricing-skeleton-line--label" />
            <SkeletonBlock className="admin-pricing-skeleton-input" />
          </div>
        ))}
      </div>

      <div className="pricing-source-map-list">
        <div className="pricing-source-map-head">
          {Array.from({ length: 7 }).map((_, idx) => (
            <SkeletonBlock key={`pricing-map-head-skeleton-${idx}`} className="admin-pricing-skeleton-line admin-pricing-skeleton-line--label" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, ridx) => (
          <div key={`pricing-map-row-skeleton-${ridx}`} className="pricing-source-map-row">
            {Array.from({ length: 7 }).map((_, cidx) => (
              <SkeletonBlock key={`pricing-map-cell-skeleton-${ridx}-${cidx}`} className="admin-pricing-skeleton-input" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminWeightSkeleton() {
  return (
    <div className="admin-weight-skeleton" aria-hidden="true">
      <SkeletonBlock className="admin-weight-skeleton-hint" />
      <div className="weight-rule-create-row">
        <SkeletonBlock className="admin-weight-skeleton-input" />
        <SkeletonBlock className="admin-weight-skeleton-btn" />
      </div>
      <div className="weight-rules-list">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`weight-rule-skeleton-${idx}`} className="weight-rule-row">
            <div className="weight-rule-left">
              <SkeletonBlock className="admin-weight-skeleton-line admin-weight-skeleton-line--label" />
              <SkeletonBlock className="admin-weight-skeleton-input" />
              <SkeletonBlock className="admin-weight-skeleton-btn" />
            </div>
            <div className="weight-rule-right">
              <div className="chip-list">
                <SkeletonBlock className="admin-weight-skeleton-chip" />
                <SkeletonBlock className="admin-weight-skeleton-chip" />
                <SkeletonBlock className="admin-weight-skeleton-chip" />
              </div>
              <SkeletonBlock className="admin-weight-skeleton-textarea" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="admin-settings-skeleton" aria-hidden="true">
      <div className="pricing-settings-grid" style={{ marginBottom: "1rem" }}>
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={`settings-field-skeleton-${idx}`} className="pricing-settings-field">
            <SkeletonBlock className="admin-settings-skeleton-line admin-settings-skeleton-line--label" />
            <SkeletonBlock className="admin-settings-skeleton-input" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="admin-settings-skeleton-line" />
      <div className="settings-transfer-actions">
        <SkeletonBlock className="admin-settings-skeleton-btn" />
        <SkeletonBlock className="admin-settings-skeleton-btn" />
      </div>
      <SkeletonBlock className="admin-settings-skeleton-line admin-settings-skeleton-line--short" />
    </div>
  );
}
