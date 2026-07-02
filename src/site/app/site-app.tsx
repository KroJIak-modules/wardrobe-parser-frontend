import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteAboutPage } from "../pages/about/site-about-page";
import { SiteCatalogPage } from "../pages/catalog/site-catalog-page";
import { SiteCartPage } from "../pages/cart/site-cart-page";
import { SiteDesignersPage } from "../pages/designers/site-designers-page";
import { SiteHomePage } from "../pages/home/site-home-page";
import { SiteLogoTestPage } from "../pages/logo-test/site-logo-test-page";
import { SitePasswordPage } from "../pages/password/site-password-page";
import { SiteProductPage } from "../pages/product/site-product-page";
import { SiteQuestionsPage } from "../pages/questions/site-questions-page";
import { useSiteAccess } from "../runtime/use-site-access";

function buildPasswordHref(location: ReturnType<typeof useLocation>) {
  const next = `${location.pathname}${location.search}${location.hash}`;
  return `/password?next=${encodeURIComponent(next)}`;
}

function SiteRoutes() {
  return (
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
  );
}

function SiteAccessGate() {
  const location = useLocation();
  const access = useSiteAccess();
  const isPasswordRoute = location.pathname === "/password";

  if (access.loading) {
    return <main className="site-password" aria-label="Проверка доступа" />;
  }

  if (!access.status) {
    return (
      <main className="site-password site-password--state">
        <p>{access.error || "Не удалось проверить доступ"}</p>
      </main>
    );
  }

  if (access.status?.enabled && !access.status.unlocked) {
    if (!isPasswordRoute) {
      return <Navigate to={buildPasswordHref(location)} replace />;
    }
    return <SitePasswordPage status={access.status} onUnlock={access.unlock} />;
  }

  if (isPasswordRoute) {
    const params = new URLSearchParams(location.search);
    return <Navigate to={params.get("next") || "/?view=storefront"} replace />;
  }

  return <SiteRoutes />;
}

export function SiteApp() {
  return (
    <BrowserRouter>
      <SiteAccessGate />
    </BrowserRouter>
  );
}
