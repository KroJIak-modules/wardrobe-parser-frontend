import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LiveDataProvider } from "./shared/live-data-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";

export function App() {
  return (
    <LiveDataProvider>
      <BrowserRouter>
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
