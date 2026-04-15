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
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonBlock key={`admin-skeleton-${idx}`} className="admin-skeleton-row" />
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="admin-skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, ridx) => (
        <div key={`admin-table-row-${ridx}`} className="admin-skeleton-table-row">
          {Array.from({ length: cols }).map((_, cidx) => (
            <SkeletonBlock key={`admin-table-cell-${ridx}-${cidx}`} className="admin-skeleton-table-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
