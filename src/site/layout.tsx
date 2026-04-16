import { Link, Outlet, useLocation } from "react-router-dom";

export function SiteLayout() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isAdminOriginProduct = location.pathname.startsWith("/product/") && searchParams.get("from") === "admin";
  const ctaTo = isAdminOriginProduct ? "/" : "/control";
  const ctaLabel = isAdminOriginProduct ? "Каталог товаров" : "Панель управления";

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Anton Shell">
            <img src="/logo_anton_shell.svg" alt="Anton Shell" className="brand-logo" />
          </Link>
          <Link to={ctaTo} className="topbar-cta">
            {ctaLabel}
          </Link>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
