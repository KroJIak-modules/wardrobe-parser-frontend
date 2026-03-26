import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CatalogProvider } from "./shared/catalog-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";

export function App() {
  return (
    <CatalogProvider>
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
    </CatalogProvider>
  );
}
