import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SiteCatalogPage } from "../pages/catalog/site-catalog-page";
import { SiteHomePage } from "../pages/home/site-home-page";

export function SiteApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteHomePage />} />
        <Route path="/catalog" element={<SiteCatalogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
