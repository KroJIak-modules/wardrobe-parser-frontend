import { useEffect } from "react";
import { SiteHeader } from "../../features/header/site-header";
import { SiteFooterSection, SiteProductsSection } from "../../features/storefront/site-storefront-sections";
import { siteActionItems, siteMenuItems, siteProducts } from "../../mock/site-mock-data";
import "./site-catalog-page.css";

export function SiteCatalogPage() {
  useEffect(() => {
    document.title = "Anton Shell — Каталог";
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-catalog-page">
      <SiteHeader theme="light" menuItems={siteMenuItems} actionItems={siteActionItems} />
      <section className="site-catalog-page__hero">
        <p className="site-catalog-page__eyebrow">Public Storefront</p>
        <h1 className="site-catalog-page__title">Каталог</h1>
        <p className="site-catalog-page__description">
          Пока здесь mock-данные из Figma. Позже этот слой можно спокойно подменить реальным API без
          переписывания вьюхи.
        </p>
      </section>
      <SiteProductsSection title="Все товары" products={siteProducts} />
      <SiteFooterSection />
    </main>
  );
}
