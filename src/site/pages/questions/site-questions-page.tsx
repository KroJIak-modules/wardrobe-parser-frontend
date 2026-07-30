import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storefrontHomeState } from "../../app/site-home-entry";
import { SiteHeader } from "../../features/header/site-header";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { SiteQuestionsView } from "../../features/questions/site-questions";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteNavigation } from "../../runtime/use-site-navigation";
import { useSiteQuestions } from "../../runtime/use-site-questions";
import "./site-questions-page.css";

const SITE_QUESTIONS_MOBILE_MEDIA_QUERY = "(max-width: 640px)";
const SITE_QUESTIONS_TABLET_HEADER_MEDIA_QUERY = "(max-width: 1100px)";

export function SiteQuestionsPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { questions, initialOpenIds, isEmpty } = useSiteQuestions();
  const { payload: navigation, menuItems, dropdownMenus } = useSiteNavigation();
  const [searchValue, setSearchValue] = useState("");
  const isMobileLayout = useSiteMediaQuery(SITE_QUESTIONS_MOBILE_MEDIA_QUERY);
  const usesTabletHeader = useSiteMediaQuery(SITE_QUESTIONS_TABLET_HEADER_MEDIA_QUERY);

  useEffect(() => {
    document.title = "Anton Shell — Вопросы";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-questions-page">
      {usesTabletHeader ? (
        <SiteMobileHomeHeader
          navigation={navigation}
          layout={isMobileLayout ? "mobile" : "tablet"}
          onLogoActivate={() => {
            navigate("/", { state: storefrontHomeState() });
          }}
        />
      ) : (
        <SiteHeader
          theme="light"
          menuItems={menuItems}
          dropdownMenus={dropdownMenus}
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

      <SiteQuestionsView questions={questions} initialOpenIds={initialOpenIds} isEmpty={isEmpty} />

      <SiteFooterSection layout={isMobileLayout ? "mobile" : "desktop"} />
    </main>
  );
}
