import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { SiteDesignersDirectory } from "../../features/designers/site-designers";
import {
  buildBrowseDesignerCatalogSearchParams,
  resolveSiteDesignersEntryMode,
} from "../../features/designers/site-designers-navigation";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { patchCatalogSearchParams } from "../../features/catalog/site-catalog-query";
import { siteDesignersAlphabet, siteDesignersDirectoryEntries } from "../../runtime/site-designers-mock";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import "./site-designers-page.css";

export function SiteDesignersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const [searchValue, setSearchValue] = useState(urlQuery);
  const persistedSearchParams = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const entryMode = useMemo(
    () => resolveSiteDesignersEntryMode(location.state, persistedSearchParams),
    [location.state, persistedSearchParams],
  );

  useEffect(() => {
    document.title = "Anton Shell — Дизайнеры";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setSearchValue(urlQuery);
  }, [urlQuery]);

  const navigateToCatalog = useCallback(
    (nextParams: URLSearchParams) => {
      const search = nextParams.toString();
      navigate({
        pathname: "/catalog",
        search: search === "" ? "" : `?${search}`,
      });
    },
    [navigate],
  );

  return (
    <main className="site-designers-page">
      <SiteHeader
        theme="light"
        menuItems={siteMenuItems}
        actionItems={actionItems}
        searchValue={searchValue}
        allowEmptySearchSubmit
        onSearchValueChange={setSearchValue}
        onSearchSubmit={(value) => {
          navigateToCatalog(
            patchCatalogSearchParams(persistedSearchParams, {
              q: value,
              page: null,
            }),
          );
        }}
      />

      <SiteDesignersDirectory
        alphabet={siteDesignersAlphabet}
        entries={siteDesignersDirectoryEntries}
        mode={entryMode}
        searchParams={persistedSearchParams}
        onApply={navigateToCatalog}
        onBrowseSelect={(designerId) => {
          navigateToCatalog(buildBrowseDesignerCatalogSearchParams(designerId));
        }}
      />

      <SiteFooterSection />
    </main>
  );
}
