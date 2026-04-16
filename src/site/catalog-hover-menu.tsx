import { useMemo } from "react";
import { LatexBrand } from "../shared/latex-brand";
import type { CategoryView } from "../shared/live-data-context";
import { CatalogPanelSkeleton, CatalogRootsSkeleton } from "../shared/skeleton";
import { ALL_PRODUCTS_ROOT_SLUG } from "./catalog-helpers";

type CatalogHoverMenuProps = {
  roots: CategoryView[];
  rootsLoading: boolean;
  openedRootSlug: string;
  selectedRootSlug: string;
  selectedCategorySlug: string;
  categoryCounts: Map<string, number>;
  panelCategories: CategoryView[];
  panelLoading: boolean;
  onRootHover: (rootSlug: string) => void;
  onSelect: (slug: string, rootSlug: string) => void;
  onMenuEnter: () => void;
  onMenuLeave: () => void;
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
  const isDesignerBrand = category.is_in_designers_branch && !category.is_designers_root;
  const titleClassName = isSelected ? "catalog-hover-title catalog-hover-title--active" : "catalog-hover-title";
  return (
    <div className="catalog-hover-group">
      <button
        type="button"
        className={titleClassName}
        onClick={() => onSelect(category.slug, rootSlug)}
      >
        {isDesignerBrand ? <LatexBrand value={category.name} fallback={category.name} /> : category.name}
        <span className="catalog-hover-count">({formatCount(categoryCounts.get(category.slug) || 0)})</span>
      </button>

      {children.length > 0 ? (
        <div className="catalog-hover-links">
          {children.map((child) => {
            const isChildSelected = selectedCategorySlug === child.slug;
            const isDesignerChild = child.is_in_designers_branch && !child.is_designers_root;
            return (
              <button
                key={child.slug}
                type="button"
                className={
                  isChildSelected
                    ? "catalog-hover-link catalog-hover-link--active"
                    : "catalog-hover-link"
                }
                onClick={() => onSelect(child.slug, rootSlug)}
              >
                {isDesignerChild ? <LatexBrand value={child.name} fallback={child.name} /> : child.name}
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
  openedRootSlug,
  selectedRootSlug,
  selectedCategorySlug,
  categoryCounts,
  panelCategories,
  panelLoading,
  onRootHover,
  onSelect,
  onMenuEnter,
  onMenuLeave,
}: CatalogHoverMenuProps) {
  const openedRoot = useMemo(() => roots.find((root) => root.slug === openedRootSlug) || roots[0], [roots, openedRootSlug]);
  const activeRootSlug = useMemo(() => {
    if (openedRootSlug === ALL_PRODUCTS_ROOT_SLUG && selectedRootSlug !== ALL_PRODUCTS_ROOT_SLUG) {
      return selectedRootSlug;
    }
    return openedRootSlug;
  }, [openedRootSlug, selectedRootSlug]);

  if (rootsLoading) {
    return <CatalogRootsSkeleton />;
  }

  if (!openedRoot) {
    return null;
  }

  const shouldShowOverlay = openedRoot.slug !== ALL_PRODUCTS_ROOT_SLUG;

  return (
    <section className="catalog-hover" onMouseEnter={onMenuEnter} onMouseLeave={onMenuLeave}>
      <div className="catalog-hover-roots" role="tablist" aria-label="Каталоги">
        {roots.map((root) => {
          const active = activeRootSlug === root.slug;
          const selected = selectedRootSlug === root.slug;
          return (
            <button
              key={root.slug}
              type="button"
              role="tab"
              aria-selected={selected}
              className={active ? "catalog-hover-root catalog-hover-root--active" : "catalog-hover-root"}
              onMouseEnter={() => {
                onRootHover(root.slug);
              }}
              onFocus={() => {
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
