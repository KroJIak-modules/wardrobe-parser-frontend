import type { CSSProperties, ReactNode } from "react";

export function SkeletonBlock({
  className = "",
  children,
  style,
}: {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const cls = className.trim() ? `skeleton ${className}` : "skeleton";
  return <div className={cls} aria-hidden="true" style={style}>{children}</div>;
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

export function AdminTableSkeleton({ rows = 6, cols = 6, portraitThumbs = false }: { rows?: number; cols?: number; portraitThumbs?: boolean }) {
  const columns = Math.max(1, cols);
  const thumbColumnWidth = portraitThumbs ? 80 : 72;
  return (
    <div className={`admin-skeleton-table${portraitThumbs ? " admin-skeleton-table--portrait-thumbs" : ""}`} aria-hidden="true">
      <div className="admin-skeleton-table-head" style={{ gridTemplateColumns: `${thumbColumnWidth}px repeat(${Math.max(1, columns - 1)}, minmax(90px, 1fr))` }}>
        <SkeletonBlock className="admin-skeleton-table-head-cell admin-skeleton-table-head-cell--thumb" />
        {Array.from({ length: Math.max(0, columns - 1) }).map((_, idx) => (
          <SkeletonBlock key={`admin-table-head-cell-${idx}`} className="admin-skeleton-table-head-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ridx) => (
        <div key={`admin-table-row-${ridx}`} className="admin-skeleton-table-row" style={{ gridTemplateColumns: `${thumbColumnWidth}px repeat(${Math.max(1, columns - 1)}, minmax(90px, 1fr))` }}>
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
          <AdminTableSkeleton rows={8} cols={8} portraitThumbs />
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

          <div className="product-main-description">
            <SkeletonBlock className="product-skeleton-heading" />
            <SkeletonBlock className="product-skeleton-description-line" />
            <SkeletonBlock className="product-skeleton-description-line" />
            <SkeletonBlock className="product-skeleton-description-line product-skeleton-description-line--short" />
          </div>

          <div className="product-main-meta">
            <div className="product-meta-line">
              <SkeletonBlock className="product-skeleton-chip" />
            </div>
            <div className="product-meta-line">
              <SkeletonBlock className="product-skeleton-meta-line product-skeleton-meta-line--label-wide" />
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
            </div>
            <div className="product-meta-line">
              <SkeletonBlock className="product-skeleton-meta-line product-skeleton-meta-line--label-wide" />
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
            </div>
            <div className="product-meta-line">
              <SkeletonBlock className="product-skeleton-meta-line product-skeleton-meta-line--label" />
              <div className="product-meta-categories">
                <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
                <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
                <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--short" />
              </div>
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

          <div className="pricing-example-card product-skeleton-pricing-example">
            <SkeletonBlock className="product-skeleton-heading" />
            <div className="pricing-example-metrics">
              <SkeletonBlock className="product-skeleton-pricing-metric" />
              <SkeletonBlock className="product-skeleton-pricing-metric" />
              <SkeletonBlock className="product-skeleton-pricing-metric" />
              <SkeletonBlock className="product-skeleton-pricing-metric" />
            </div>
            <SkeletonBlock className="product-skeleton-formula" />
          </div>

          <div className="product-images-editor">
            <div className="product-images-editor-head">
              <SkeletonBlock className="product-skeleton-variants-title" />
              <SkeletonBlock className="product-skeleton-chip product-skeleton-chip--tiny" />
            </div>
            <div className="product-images-editor-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonBlock key={`product-skeleton-editor-thumb-${idx}`} className="product-skeleton-editor-thumb" />
              ))}
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
          <div className="dedup-grid">
            {Array.from({ length: 2 }).map((__, cidx) => (
              <div key={`dedup-skeleton-col-${idx}-${cidx}`} className="dedup-col admin-dedup-skeleton-col">
                <SkeletonBlock className="dedup-card-media" />
                <SkeletonBlock className="admin-dedup-skeleton-title" />
                <SkeletonBlock className="admin-dedup-skeleton-line admin-dedup-skeleton-line--short" />
                <SkeletonBlock className="admin-dedup-skeleton-line" />
                <SkeletonBlock className="admin-dedup-skeleton-btn" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="admin-dedup-skeleton-reasons" />
          <div className="actions">
            <SkeletonBlock className="admin-dedup-skeleton-btn admin-dedup-skeleton-btn--wide" />
            <SkeletonBlock className="admin-dedup-skeleton-btn" />
            <SkeletonBlock className="admin-dedup-skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminSourcesSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sources-grid" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <article key={`source-skeleton-${idx}`} className="source-card admin-sources-skeleton-row">
          <div className="source-card-head admin-sources-skeleton-main">
            <SkeletonBlock className="admin-sources-skeleton-title" />
            <SkeletonBlock className="admin-sources-skeleton-link" />
          </div>
          <div className="source-card-foot">
            <div className="source-card-meta admin-sources-skeleton-meta">
              <SkeletonBlock className="admin-sources-skeleton-pill" />
              <SkeletonBlock className="admin-sources-skeleton-pill" />
              <SkeletonBlock className="admin-sources-skeleton-pill admin-sources-skeleton-pill--wide" />
            </div>
            <div className="source-card-switches admin-sources-skeleton-switches">
              <SkeletonBlock className="admin-sources-skeleton-switch" />
              <SkeletonBlock className="admin-sources-skeleton-switch" />
              <SkeletonBlock className="admin-sources-skeleton-switch" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminTaxonomySkeleton() {
  return (
    <div className="taxonomy-shell" aria-hidden="true">
      <div className="taxonomy-sidebar">
        {Array.from({ length: 3 }).map((_, blockIndex) => (
          <section key={`taxonomy-skeleton-tree-${blockIndex}`} className="taxonomy-tree-block card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <SkeletonBlock style={{ width: "9rem", height: "1.1rem", borderRadius: "0.65rem" }} />
              <SkeletonBlock style={{ width: "5.5rem", height: "2rem", borderRadius: "999px" }} />
            </div>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              {Array.from({ length: blockIndex === 1 ? 3 : 5 }).map((__, rowIndex) => (
                <div key={`taxonomy-skeleton-tree-row-${blockIndex}-${rowIndex}`} style={{ display: "grid", gap: "0.35rem" }}>
                  <SkeletonBlock
                    style={{
                      width: rowIndex % 3 === 0 ? "88%" : rowIndex % 3 === 1 ? "72%" : "80%",
                      height: "2.1rem",
                      borderRadius: "0.9rem",
                      marginLeft: rowIndex > 1 && blockIndex === 0 ? "1rem" : "0",
                    }}
                  />
                  {blockIndex === 0 && rowIndex === 1 ? (
                    <SkeletonBlock style={{ width: "58%", height: "2rem", borderRadius: "0.9rem", marginLeft: "1rem" }} />
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="card taxonomy-editor-card">
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBlock style={{ width: "10rem", height: "1.3rem", borderRadius: "0.7rem" }} />
            <SkeletonBlock style={{ width: "6rem", height: "2rem", borderRadius: "999px" }} />
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <SkeletonBlock style={{ width: "9rem", height: "0.95rem", borderRadius: "0.5rem" }} />
            <SkeletonBlock style={{ width: "100%", height: "2.75rem", borderRadius: "1rem" }} />
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <SkeletonBlock style={{ width: "12rem", height: "0.95rem", borderRadius: "0.5rem" }} />
            <SkeletonBlock style={{ width: "100%", height: "2.75rem", borderRadius: "1rem" }} />
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <SkeletonBlock style={{ width: "11rem", height: "1rem", borderRadius: "0.5rem" }} />
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`taxonomy-skeleton-chip-row-${idx}`} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <SkeletonBlock style={{ width: idx === 0 ? "7rem" : "9rem", height: "2rem", borderRadius: "999px" }} />
                <SkeletonBlock style={{ width: idx === 1 ? "8rem" : "6rem", height: "2rem", borderRadius: "999px" }} />
                <SkeletonBlock style={{ width: "5rem", height: "2rem", borderRadius: "999px" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <SkeletonBlock style={{ width: "10rem", height: "1rem", borderRadius: "0.5rem" }} />
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={`taxonomy-skeleton-product-${idx}`} style={{ display: "grid", gridTemplateColumns: "4rem 1fr auto", gap: "0.75rem", alignItems: "center" }}>
                <SkeletonBlock style={{ width: "4rem", height: "4rem", borderRadius: "1rem" }} />
                <div style={{ display: "grid", gap: "0.4rem" }}>
                  <SkeletonBlock style={{ width: idx === 0 ? "80%" : "68%", height: "1rem", borderRadius: "0.55rem" }} />
                  <SkeletonBlock style={{ width: "45%", height: "0.85rem", borderRadius: "0.45rem" }} />
                </div>
                <div style={{ display: "grid", gap: "0.45rem" }}>
                  <SkeletonBlock style={{ width: "5rem", height: "2rem", borderRadius: "999px" }} />
                  <SkeletonBlock style={{ width: "5rem", height: "2rem", borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDesignersSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="admin-designers-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <article key={`designers-skeleton-${idx}`} className="designers-item admin-designers-skeleton__card">
          <div className="designers-item__header designers-item__header--between">
            <SkeletonBlock className="admin-designers-skeleton__count" />
            <div className="designers-item__actions">
              <SkeletonBlock className="admin-designers-skeleton__toggle" />
              <SkeletonBlock className="admin-designers-skeleton__delete" />
            </div>
          </div>
          <div className="designers-item__fields">
            <div className="designers-item__field">
              <SkeletonBlock className="admin-designers-skeleton__label" />
              <div className="designers-item__field-body">
                <SkeletonBlock className="admin-designers-skeleton__input" />
                <SkeletonBlock className="admin-designers-skeleton__pill" />
              </div>
            </div>
            <div className="designers-item__field designers-item__field--description">
              <SkeletonBlock className="admin-designers-skeleton__label admin-designers-skeleton__label--wide" />
              <SkeletonBlock className="admin-designers-skeleton__textarea" />
            </div>
            <div className="designers-item__field designers-item__field--related">
              <SkeletonBlock className="admin-designers-skeleton__label admin-designers-skeleton__label--wide" />
              <div className="designers-item__related-list">
                <SkeletonBlock className="admin-designers-skeleton__chip admin-designers-skeleton__chip--wide" />
                <SkeletonBlock className="admin-designers-skeleton__chip" />
                <SkeletonBlock className="admin-designers-skeleton__chip admin-designers-skeleton__chip--short" />
                <SkeletonBlock className="admin-designers-skeleton__chip" />
              </div>
            </div>
          </div>
        </article>
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
    <div className="weight-layout admin-weight-skeleton" aria-hidden="true">
      <section>
        <SkeletonBlock className="admin-weight-skeleton-section-title" />
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
      </section>
      <section>
        <SkeletonBlock className="admin-weight-skeleton-section-title" />
        <SkeletonBlock className="admin-weight-skeleton-hint" />
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="products-table">
            <thead>
              <tr>
                <th><SkeletonBlock className="admin-weight-skeleton-table-head" /></th>
                <th><SkeletonBlock className="admin-weight-skeleton-table-head" /></th>
                <th><SkeletonBlock className="admin-weight-skeleton-table-head" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`weight-missing-skeleton-${idx}`}>
                  <td><SkeletonBlock className="admin-weight-skeleton-table-cell admin-weight-skeleton-table-cell--wide" /></td>
                  <td><SkeletonBlock className="admin-weight-skeleton-table-cell" /></td>
                  <td><SkeletonBlock className="admin-weight-skeleton-table-cell" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
      <div className="admin-settings-split-grid">
        {Array.from({ length: 2 }).map((_, viewportIdx) => (
          <div key={`settings-showcase-viewport-skeleton-${viewportIdx}`} className="pricing-settings-field">
            <SkeletonBlock className="admin-settings-skeleton-line admin-settings-skeleton-line--label" />
            <SkeletonBlock className="admin-settings-skeleton-input" />
            <div className="pricing-settings-grid">
              {Array.from({ length: 3 }).map((__, itemIdx) => (
                <SkeletonBlock key={`settings-showcase-skeleton-${viewportIdx}-${itemIdx}`} className="admin-settings-skeleton-input" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="settings-transfer-actions">
        <SkeletonBlock className="admin-settings-skeleton-btn" />
        <SkeletonBlock className="admin-settings-skeleton-btn" />
      </div>
      <SkeletonBlock className="admin-settings-skeleton-line admin-settings-skeleton-line--short" />
    </div>
  );
}
