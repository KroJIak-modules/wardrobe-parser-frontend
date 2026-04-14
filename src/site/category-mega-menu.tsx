import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { CategoryView } from "../shared/live-data-context";
import { findRootForCategory, sortStorefrontRoots } from "./category-logic";

type CategoryMegaMenuProps = {
  categories: CategoryView[];
  activeCategorySlug?: string | null;
};

function splitIntoColumns(items: CategoryView[]): [CategoryView[], CategoryView[]] {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

export function CategoryMegaMenu({ categories, activeCategorySlug }: CategoryMegaMenuProps) {
  const roots = useMemo(() => sortStorefrontRoots(categories), [categories]);
  const activeRoot = useMemo(
    () => findRootForCategory(roots, activeCategorySlug),
    [roots, activeCategorySlug]
  );

  if (roots.length === 0) {
    return null;
  }

  const openedRoot = activeRoot || roots[0];
  const isDesigners = Boolean(openedRoot?.is_designers_root);
  const designers = isDesigners
    ? [...openedRoot.children].sort((left, right) => left.name.localeCompare(right.name, "ru"))
    : [];
  const [designersLeft, designersRight] = splitIntoColumns(designers);

  return (
    <section className="catalog-menu">
      <div className="catalog-tabs" role="tablist" aria-label="Категории витрины">
        {roots.map((root) => {
          const isActiveRoot = activeRoot?.slug === root.slug;
          return (
            <Link
              key={root.slug}
              to={`/category/${root.slug}`}
              role="tab"
              aria-selected={isActiveRoot}
              className={isActiveRoot ? "catalog-tab catalog-tab--active" : "catalog-tab"}
            >
              <span>{root.name}</span>
            </Link>
          );
        })}
      </div>

      {openedRoot ? (
        <div className="catalog-mega">
          {isDesigners ? (
            <div className="catalog-mega-designers">
              {[designersLeft, designersRight].map((column, index) => (
                <div key={index} className="catalog-mega-designers-column">
                  {column.map((designer) => (
                    <Link key={designer.slug} to={`/category/${designer.slug}`} className="catalog-mega-link">
                      {designer.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="catalog-mega-grid">
              {(openedRoot.children.length > 0 ? openedRoot.children : [openedRoot]).map((group) => (
                <section key={group.slug} className="catalog-mega-group">
                  {group.slug === openedRoot.slug ? null : (
                    <Link to={`/category/${group.slug}`} className="catalog-mega-title">
                      {group.name}
                    </Link>
                  )}
                  <div className="catalog-mega-links">
                    {(group.children.length > 0 ? group.children : [group]).map((child) => (
                      <Link key={child.slug} to={`/category/${child.slug}`} className="catalog-mega-link">
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
