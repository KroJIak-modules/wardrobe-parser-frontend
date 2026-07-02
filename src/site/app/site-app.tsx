import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SiteAboutPage } from "../pages/about/site-about-page";
import { SiteCatalogPage } from "../pages/catalog/site-catalog-page";
import { SiteCartPage } from "../pages/cart/site-cart-page";
import { SiteDesignersPage } from "../pages/designers/site-designers-page";
import { SiteHomePage } from "../pages/home/site-home-page";
import { SiteLogoTestPage } from "../pages/logo-test/site-logo-test-page";
import { SiteProductPage } from "../pages/product/site-product-page";
import { SiteQuestionsPage } from "../pages/questions/site-questions-page";

export function SiteApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteHomePage />} />
        <Route path="/about" element={<SiteAboutPage />} />
        <Route path="/show" element={<Navigate to="/catalog" replace />} />
        <Route path="/show/:productPath" element={<SiteProductPage />} />
        <Route path="/catalog" element={<SiteCatalogPage />} />
        <Route path="/cart" element={<SiteCartPage />} />
        <Route path="/sale" element={<SiteCatalogPage forcedTop="sale" />} />
        <Route path="/catalog/sale" element={<Navigate to="/sale" replace />} />
        <Route path="/designers" element={<SiteDesignersPage />} />
        <Route path="/questions" element={<SiteQuestionsPage />} />
        <Route path="/logo-test" element={<SiteLogoTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
