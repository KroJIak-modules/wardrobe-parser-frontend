import { Link, NavLink, Outlet } from "react-router-dom";

export function SiteLayout() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Wardrobe
        </Link>
        <nav className="menu">
          <NavLink to="/" className="menu-link">
            Products
          </NavLink>
          <NavLink to="/admin" className="menu-link">
            Admin
          </NavLink>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
