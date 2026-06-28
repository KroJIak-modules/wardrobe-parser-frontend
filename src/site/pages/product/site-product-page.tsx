import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { readSiteCatalogReturnSnapshot } from "../../features/catalog/site-catalog-return";
import { SiteHeader } from "../../features/header/site-header";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { SiteProductDetailView } from "../../features/product-detail/site-product-detail";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteProductDetail } from "../../runtime/use-site-product-detail";
import "./site-product-page.css";

const SITE_PRODUCT_PAGE_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

export function SiteProductPage({ defaultProductId }: { defaultProductId?: string }) {
  const params = useParams<{ productId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const [searchValue, setSearchValue] = useState("");
  const isMobileLayout = useSiteMediaQuery(SITE_PRODUCT_PAGE_MOBILE_MEDIA_QUERY);
  const { product, recommendations } = useSiteProductDetail(params.productId ?? defaultProductId);
  const returnTarget = useMemo(() => {
    const state = location.state as { fromCatalog?: { pathname: string; search: string } } | null;
    if (state?.fromCatalog) {
      return state.fromCatalog;
    }

    const snapshot = readSiteCatalogReturnSnapshot();
    if (snapshot && snapshot.pathname === "/catalog") {
      return {
        pathname: snapshot.pathname,
        search: snapshot.search,
      };
    }

    return {
      pathname: "/catalog",
      search: "",
    };
  }, [location.state]);

  useEffect(() => {
    document.title = product ? `Anton Shell — ${product.brand}` : "Anton Shell — Товар";
    window.scrollTo(0, 0);
  }, [product]);

  return (
    <main className="site-product-page">
      {isMobileLayout ? (
        <SiteMobileHomeHeader
          onLogoActivate={() => {
            navigate("/?view=storefront");
          }}
        />
      ) : (
        <SiteHeader
          theme="light"
          menuItems={siteMenuItems}
          actionItems={actionItems}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          onSearchSubmit={(value) => {
            const params = new URLSearchParams();
            if (value !== "") {
              params.set("q", value);
            }

            navigate({
              pathname: "/catalog",
              search: params.toString() ? `?${params.toString()}` : "",
            });
          }}
        />
      )}

      <SiteProductDetailView
        product={product}
        recommendations={recommendations}
        returnTarget={returnTarget}
        layout={isMobileLayout ? "mobile" : "desktop"}
      />

      <div className="site-product-page__footer">
        <SiteFooterSection layout={isMobileLayout ? "mobile" : "desktop"} />
      </div>
    </main>
  );
}
