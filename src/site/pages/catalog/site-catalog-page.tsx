import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { SiteCatalogTopKey } from "../../features/catalog/site-catalog-contracts";
import { siteMenuItems } from "../../app/site-static-content";
import { resolveCatalogExperience } from "../../features/catalog/site-catalog-logic";
import { SiteCatalogMobileView } from "../../features/catalog/site-catalog-mobile-view";
import { clearSiteCatalogReturnSnapshot, readSiteCatalogReturnSnapshot } from "../../features/catalog/site-catalog-return";
import { readCatalogListParam } from "../../features/catalog/site-catalog-query";
import { SiteCatalogExperienceView } from "../../features/catalog/site-catalog-sections";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import "./site-catalog-page.css";

export function SiteCatalogPage({ forcedTop }: { forcedTop?: SiteCatalogTopKey }) {
  const actionItems = useSiteActionItems();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const persistSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      const normalized = new URLSearchParams(nextParams);
      normalized.delete("top");

      setSearchParams(normalized);
    },
    [setSearchParams]
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
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 48;
  const totalPages = Math.max(1, Math.ceil(experience.products.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);
  const pagedProducts = experience.products.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize);

  useLayoutEffect(() => {
    const snapshot = readSiteCatalogReturnSnapshot();
    const shouldRestore = snapshot && snapshot.pathname === location.pathname && snapshot.search === location.search;

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo(0, shouldRestore ? snapshot.scrollY : 0);
      if (shouldRestore) {
        clearSiteCatalogReturnSnapshot();
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const rawTop = String(searchParams.get("top") || "").trim();
    if (rawTop === "") {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("top");

    if ((rawTop === "men" || rawTop === "women") && readCatalogListParam(nextParams, "gender").length === 0) {
      nextParams.set("gender", rawTop);
    }

    const nextSearch = nextParams.toString();
    const nextLocation = nextSearch === "" ? "" : `?${nextSearch}`;

    if (!forcedTop && rawTop === "sale") {
      navigate({ pathname: "/sale", search: nextLocation }, { replace: true });
      return;
    }

    if (!forcedTop && rawTop === "designers" && readCatalogListParam(nextParams, "designer").length === 0) {
      navigate({ pathname: "/designers", search: nextLocation }, { replace: true });
      return;
    }

    setSearchParams(nextParams, { replace: true });
  }, [forcedTop, navigate, searchParams, setSearchParams]);

  useEffect(() => {
    setSearchValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    document.title = `Anton Shell — ${experience.header.title}`;
  }, [experience.header.title]);

  return (
    <main className="site-catalog-page">
      {isMobileLayout ? (
        <SiteCatalogMobileView
          title={experience.header.title}
          titleSource={experience.header.source}
          description={experience.header.description}
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
      ) : (
        <>
          <SiteHeader
            theme="light"
            menuItems={siteMenuItems}
            actionItems={actionItems}
            searchValue={searchValue}
            allowEmptySearchSubmit
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
        </>
      )}
    </main>
  );
}
