import type { SiteCatalogHeaderSource } from "./site-catalog-contracts";
import { useSiteCatalogExpandableDescription } from "./use-site-catalog-expandable-description";

export function SiteCatalogHeaderDescription({
  description,
  source,
}: {
  description: string;
  source: SiteCatalogHeaderSource;
}) {
  const shouldUseExpandableLayout = source === "designer" || source === "custom_catalog";
  const { collapsedDescription, isExpanded, isExpandable, textRef, expand } = useSiteCatalogExpandableDescription({
    description,
    isEnabled: shouldUseExpandableLayout,
    resetKey: source,
  });

  return (
    <div
      className={
        isExpanded
          ? "site-catalog-shell__description-block site-catalog-shell__description-block--expanded"
          : "site-catalog-shell__description-block"
      }
    >
      <p
        ref={textRef}
        className={
          shouldUseExpandableLayout && !isExpanded
            ? "site-catalog-shell__description site-catalog-shell__description--collapsed"
            : "site-catalog-shell__description"
        }
      >
        {shouldUseExpandableLayout && isExpandable && !isExpanded ? (
          <>
            <span>{collapsedDescription}</span>
            <button type="button" className="site-catalog-shell__read-more-inline" onClick={expand}>
              ...Читать дальше
            </button>
          </>
        ) : (
          description
        )}
      </p>
    </div>
  );
}
