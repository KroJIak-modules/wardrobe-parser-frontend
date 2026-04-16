import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiveDataProvider } from "./shared/live-data-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";

function RouteTitleSync() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      document.title = "Админ панель | Anton Shell";
      return;
    }
    document.title = "Anton Shell";
  }, [location.pathname]);

  return null;
}

export function App() {
  return (
    <LiveDataProvider>
      <BrowserRouter>
        <RouteTitleSync />
        <Routes>
          <Route path="/" element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="product/:id" element={<ProductPage />} />
          </Route>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LiveDataProvider>
  );
}
