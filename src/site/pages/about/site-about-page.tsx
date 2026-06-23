import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { SiteAboutView } from "../../features/about/site-about";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteAbout } from "../../runtime/use-site-about";
import "./site-about-page.css";

export function SiteAboutPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { title, photoSlides, textPanels } = useSiteAbout();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    document.title = "Anton Shell — Обо мне";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-about-page">
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

      <SiteAboutView title={title} photoSlides={photoSlides} textPanels={textPanels} />

      <div className="site-about-page__footer">
        <SiteFooterSection />
      </div>
    </main>
  );
}
