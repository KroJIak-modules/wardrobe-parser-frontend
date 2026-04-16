import { Link, Outlet } from "react-router-dom";

export function SiteLayout() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Anton Shell">
            <img src="/logo_anton_shell.svg" alt="Anton Shell" className="brand-logo" />
          </Link>
          <Link to="/admin" className="topbar-cta">
            Панель управления
          </Link>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
