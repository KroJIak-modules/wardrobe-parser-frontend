import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { SiteCatalogTopKey } from "../../features/catalog/site-catalog-contracts";
import { resolveOptimisticCatalogHeader } from "../../features/catalog/site-catalog-optimistic-header";
import { SiteCatalogMobileView } from "../../features/catalog/site-catalog-mobile-view";
import { clearSiteCatalogReturnSnapshot, readSiteCatalogReturnSnapshot } from "../../features/catalog/site-catalog-return";
import { readCatalogListParam } from "../../features/catalog/site-catalog-query";
import { SiteCatalogExperienceView } from "../../features/catalog/site-catalog-sections";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteNavigation } from "../../runtime/use-site-navigation";
import { useSiteCatalog } from "../../runtime/use-site-catalog";
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
  const { menuItems, dropdownMenus, payload: navigation } = useSiteNavigation();
  const catalogReturnSnapshot = useMemo(() => {
    const snapshot = readSiteCatalogReturnSnapshot();
    if (
      !snapshot ||
      snapshot.pathname !== location.pathname ||
      snapshot.search !== location.search ||
      snapshot.locationKey !== location.key
    ) {
      return null;
    }

    return snapshot;
  }, [location.key, location.pathname, location.search]);
  const { header, filterGroups, products, currentPage: normalizedPage, totalPages, loading, errorMessage } = useSiteCatalog(
    effectiveSearchParams,
    { forcedTop, restoreFromHistory: catalogReturnSnapshot !== null },
  );
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const catalogReturnSnapshotRef = useRef<ReturnType<typeof readSiteCatalogReturnSnapshot>>(null);
  const optimisticHeader = useMemo(
    () =>
      resolveOptimisticCatalogHeader({
        searchParams: effectiveSearchParams,
        forcedTop,
        navigation,
        filterGroups,
        fallbackHeader: header,
      }),
    [effectiveSearchParams, filterGroups, forcedTop, header, navigation],
  );

  useLayoutEffect(() => {
    catalogReturnSnapshotRef.current = catalogReturnSnapshot;

    if (!catalogReturnSnapshot) {
      window.scrollTo(0, 0);
    }
  }, [catalogReturnSnapshot]);

  useLayoutEffect(() => {
    const snapshot = catalogReturnSnapshotRef.current;
    if (!snapshot || loading || errorMessage) {
      return;
    }

    // The product grid must replace its fixed-height skeletons before restoring
    // a deep position, otherwise the browser clamps scrollY to the skeleton height.
    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        if (catalogReturnSnapshotRef.current !== snapshot) {
          return;
        }

        window.scrollTo({ top: snapshot.scrollY, left: 0, behavior: "auto" });
        clearSiteCatalogReturnSnapshot();
        catalogReturnSnapshotRef.current = null;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [errorMessage, loading, products.length]);

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
    document.title = `Anton Shell — ${optimisticHeader.title}`;
  }, [optimisticHeader.title]);

  return (
    <main className="site-catalog-page">
      {isMobileLayout ? (
        <SiteCatalogMobileView
          navigation={navigation}
          title={optimisticHeader.title}
          titleSource={optimisticHeader.source}
          description={optimisticHeader.description}
          filterGroups={filterGroups}
          searchParams={effectiveSearchParams}
          onSearchParamsChange={persistSearchParams}
          products={products}
          currentPage={normalizedPage}
          totalPages={totalPages}
          loading={loading}
          errorMessage={errorMessage}
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
            menuItems={menuItems}
            dropdownMenus={dropdownMenus}
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
            title={optimisticHeader.title}
            description={optimisticHeader.description}
            descriptionSource={optimisticHeader.source}
            filterGroups={filterGroups}
            searchParams={effectiveSearchParams}
            onSearchParamsChange={persistSearchParams}
            products={products}
            currentPage={normalizedPage}
            totalPages={totalPages}
            loading={loading}
            errorMessage={errorMessage}
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
