import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { SiteHeader } from "../../features/header/site-header";
import { SiteProductDetailView } from "../../features/product-detail/site-product-detail";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteProductDetail } from "../../runtime/use-site-product-detail";
import "./site-product-page.css";

export function SiteProductPage({ defaultProductId }: { defaultProductId?: string }) {
  const params = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const [searchValue, setSearchValue] = useState("");
  const { product, recommendations } = useSiteProductDetail(params.productId ?? defaultProductId);

  useEffect(() => {
    document.title = product ? `Anton Shell — ${product.brand}` : "Anton Shell — Товар";
    window.scrollTo(0, 0);
  }, [product]);

  return (
    <main className="site-product-page">
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

      <SiteProductDetailView product={product} recommendations={recommendations} />

      <div className="site-product-page__footer">
        <SiteFooterSection />
      </div>
    </main>
  );
}
