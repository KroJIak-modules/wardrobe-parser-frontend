import { Link } from "react-router-dom";

type AdminTopbarProps = {
  onLogout: () => void;
};

export function AdminTopbar({ onLogout }: AdminTopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="Anton Shell">
          <img src="/logo_anton_shell.svg" alt="Anton Shell" className="brand-logo" />
        </Link>
        <div className="topbar-actions">
          <Link to="/" className="topbar-cta">
            Каталог товаров
          </Link>
          <button type="button" className="topbar-cta" onClick={onLogout}>
            Выход
          </button>
        </div>
      </div>
    </header>
  );
}
