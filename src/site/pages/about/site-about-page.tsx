import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { SiteAboutView } from "../../features/about/site-about";
import { SiteHeader } from "../../features/header/site-header";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteAbout } from "../../runtime/use-site-about";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import "./site-about-page.css";

const SITE_ABOUT_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

export function SiteAboutPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { title, photoSlides, textPanel } = useSiteAbout();
  const [searchValue, setSearchValue] = useState("");
  const isMobileLayout = useSiteMediaQuery(SITE_ABOUT_MOBILE_MEDIA_QUERY);

  useEffect(() => {
    document.title = "Anton Shell — Обо мне";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-about-page">
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

      <SiteAboutView title={title} photoSlides={photoSlides} textPanel={textPanel} />

      <div className="site-about-page__footer">
        <SiteFooterSection layout={isMobileLayout ? "mobile" : "desktop"} />
      </div>
    </main>
  );
}
