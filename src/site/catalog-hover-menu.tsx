import { useMemo, useState } from "react";
import type { CategoryView } from "../shared/live-data-context";
import { CatalogPanelSkeleton, CatalogRootsSkeleton } from "../shared/skeleton";
import { ALL_PRODUCTS_ROOT_SLUG } from "./catalog-helpers";

type CatalogHoverMenuProps = {
  roots: CategoryView[];
  rootsLoading: boolean;
  selectedRootSlug: string;
  selectedCategorySlug: string;
  categoryCounts: Map<string, number>;
  panelCategories: CategoryView[];
  panelLoading: boolean;
  onRootHover: (rootSlug: string) => void;
  onSelect: (slug: string, rootSlug: string) => void;
};

function formatCount(count: number): string {
  return Number.isFinite(count) ? String(count) : "0";
}

function CategoryEntry({
  category,
  rootSlug,
  selectedCategorySlug,
  categoryCounts,
  onSelect,
}: {
  category: CategoryView;
  rootSlug: string;
  selectedCategorySlug: string;
  categoryCounts: Map<string, number>;
  onSelect: (slug: string, rootSlug: string) => void;
}) {
  const children = category.children || [];
  const isSelected = selectedCategorySlug === category.slug;
  return (
    <div className="catalog-hover-group">
      <button
        type="button"
        className={isSelected ? "catalog-hover-title catalog-hover-title--active" : "catalog-hover-title"}
        onClick={() => onSelect(category.slug, rootSlug)}
      >
        {category.name}
        <span className="catalog-hover-count">({formatCount(categoryCounts.get(category.slug) || 0)})</span>
      </button>

      {children.length > 0 ? (
        <div className="catalog-hover-links">
          {children.map((child) => {
            const isChildSelected = selectedCategorySlug === child.slug;
            return (
              <button
                key={child.slug}
                type="button"
                className={isChildSelected ? "catalog-hover-link catalog-hover-link--active" : "catalog-hover-link"}
                onClick={() => onSelect(child.slug, rootSlug)}
              >
                {child.name}
                <span className="catalog-hover-count">({formatCount(categoryCounts.get(child.slug) || 0)})</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CatalogHoverMenu({
  roots,
  rootsLoading,
  selectedRootSlug,
  selectedCategorySlug,
  categoryCounts,
  panelCategories,
  panelLoading,
  onRootHover,
  onSelect,
}: CatalogHoverMenuProps) {
  const [hoveredRootSlug, setHoveredRootSlug] = useState<string>(selectedRootSlug);

  const openedRootSlug = hoveredRootSlug || selectedRootSlug;
  const openedRoot = useMemo(() => roots.find((root) => root.slug === openedRootSlug) || roots[0], [roots, openedRootSlug]);

  if (rootsLoading) {
    return <CatalogRootsSkeleton />;
  }

  if (!openedRoot) {
    return null;
  }

  const shouldShowOverlay = openedRoot.slug !== ALL_PRODUCTS_ROOT_SLUG;

  return (
    <section className="catalog-hover" onMouseLeave={() => setHoveredRootSlug(selectedRootSlug)}>
      <div className="catalog-hover-roots" role="tablist" aria-label="Каталоги">
        {roots.map((root) => {
          const active = openedRoot.slug === root.slug;
          return (
            <button
              key={root.slug}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? "catalog-hover-root catalog-hover-root--active" : "catalog-hover-root"}
              onMouseEnter={() => {
                setHoveredRootSlug(root.slug);
                onRootHover(root.slug);
              }}
              onFocus={() => {
                setHoveredRootSlug(root.slug);
                onRootHover(root.slug);
              }}
              onClick={() => onSelect(root.slug, root.slug)}
            >
              {root.name}
            </button>
          );
        })}
      </div>

      {shouldShowOverlay ? (
        panelLoading ? (
          <CatalogPanelSkeleton />
        ) : (
          <div className="catalog-hover-overlay">
            <div className="catalog-hover-panel">
              <div className="catalog-hover-grid">
                {panelCategories.map((category) => (
                  <CategoryEntry
                    key={category.slug}
                    category={category}
                    rootSlug={openedRoot.slug}
                    selectedCategorySlug={selectedCategorySlug}
                    categoryCounts={categoryCounts}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}
