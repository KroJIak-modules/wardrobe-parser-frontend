import type { SiteCatalogHeaderSource } from "./site-catalog-contracts";
import { useSiteCatalogExpandableDescription } from "./use-site-catalog-expandable-description";

export function SiteCatalogMobileDescription({
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
    textClassName: "site-catalog-mobile__description",
    readMoreClassName: "site-catalog-mobile__read-more-inline",
  });

  return (
    <div
      className={
        isExpanded
          ? "site-catalog-mobile__description-block site-catalog-mobile__description-block--expanded"
          : "site-catalog-mobile__description-block"
      }
    >
      <p
        ref={textRef}
        className={
          shouldUseExpandableLayout && !isExpanded
            ? "site-catalog-mobile__description site-catalog-mobile__description--collapsed"
            : "site-catalog-mobile__description"
        }
      >
        {shouldUseExpandableLayout && isExpandable && !isExpanded ? (
          <>
            <span>{collapsedDescription}</span>
            <button type="button" className="site-catalog-mobile__read-more-inline" onClick={expand}>
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
