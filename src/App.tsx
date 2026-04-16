import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiveDataProvider } from "./shared/live-data-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";

const MANAGEMENT_PATH = "/control";

function RouteTitleSync() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith(MANAGEMENT_PATH)) {
      document.title = "Панель управления | Anton Shell";
      return;
    }
    document.title = "Anton Shell";
  }, [location.pathname]);

  return null;
}

function RouteTransitionIndicator() {
  const location = useLocation();
  const mountedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return <div className={visible ? "route-progress route-progress--visible" : "route-progress"} aria-hidden="true" />;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <LiveDataProvider routePath={location.pathname}>
      <RouteTitleSync />
      <RouteTransitionIndicator />
      <Routes>
        <Route path="/" element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="product/:id" element={<ProductPage />} />
        </Route>
        <Route path={MANAGEMENT_PATH} element={<Navigate to={`${MANAGEMENT_PATH}/products`} replace />} />
        <Route path={`${MANAGEMENT_PATH}/:tab`} element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LiveDataProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
