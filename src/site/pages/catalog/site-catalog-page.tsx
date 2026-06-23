import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SiteCatalogTopKey } from "../../features/catalog/site-catalog-contracts";
import { siteMenuItems } from "../../app/site-static-content";
import { resolveCatalogExperience } from "../../features/catalog/site-catalog-logic";
import { SiteCatalogExperienceView } from "../../features/catalog/site-catalog-sections";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import "./site-catalog-page.css";

export function SiteCatalogPage({ forcedTop }: { forcedTop?: SiteCatalogTopKey }) {
  const actionItems = useSiteActionItems();
  const [searchParams, setSearchParams] = useSearchParams();
  const persistSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      const normalized = new URLSearchParams(nextParams);

      if (forcedTop) {
        normalized.delete("top");
      }

      setSearchParams(normalized);
    },
    [forcedTop, setSearchParams]
  );
  const effectiveSearchParams = useMemo(() => {
    if (!forcedTop) {
      return searchParams;
    }

    const next = new URLSearchParams(searchParams);
    next.set("top", forcedTop);
    return next;
  }, [forcedTop, searchParams]);
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const [searchValue, setSearchValue] = useState(urlQuery);
  const experience = resolveCatalogExperience(effectiveSearchParams);
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 48;
  const totalPages = Math.max(1, Math.ceil(experience.products.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);
  const pagedProducts = experience.products.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setSearchValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    document.title = `Anton Shell — ${experience.header.title}`;
  }, [experience.header.title]);

  return (
    <main className="site-catalog-page">
      <SiteHeader
        theme="light"
        menuItems={siteMenuItems}
        actionItems={actionItems}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearchSubmit={(value) => {
          const nextParams = new URLSearchParams(searchParams);
          if (value === "") {
            nextParams.delete("q");
          } else {
            nextParams.set("q", value);
          }
          persistSearchParams(nextParams);
        }}
      />
      <SiteCatalogExperienceView
        title={experience.header.title}
        description={experience.header.description}
        descriptionSource={experience.header.source}
        filterGroups={experience.filterGroups}
        searchParams={effectiveSearchParams}
        onSearchParamsChange={persistSearchParams}
        products={pagedProducts}
        currentPage={normalizedPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          const nextParams = new URLSearchParams(searchParams);
          if (page <= 1) {
            nextParams.delete("page");
          } else {
            nextParams.set("page", String(page));
          }
          persistSearchParams(nextParams);
        }}
      />
      <SiteFooterSection />
    </main>
  );
}
