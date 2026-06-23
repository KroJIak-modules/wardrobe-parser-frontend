import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { siteMenuItems } from "../../app/site-static-content";
import { SiteHeader } from "../../features/header/site-header";
import { SiteQuestionsView } from "../../features/questions/site-questions";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteQuestions } from "../../runtime/use-site-questions";
import "./site-questions-page.css";

export function SiteQuestionsPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { questions, initialOpenIds, isEmpty } = useSiteQuestions();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    document.title = "Anton Shell — Вопросы";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-questions-page">
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

      <SiteQuestionsView questions={questions} initialOpenIds={initialOpenIds} isEmpty={isEmpty} />

      <SiteFooterSection />
    </main>
  );
}
