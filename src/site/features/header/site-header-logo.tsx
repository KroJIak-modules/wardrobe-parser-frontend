import { SITE_LOGO_URL } from "../../app/site-public-asset";

export function SiteHeaderLogo({
  onActivate,
}: {
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className="site-header__logo-shell"
      aria-label="Anton Shell"
      onClick={onActivate}
    >
      <img
        aria-hidden="true"
        className="site-header__logo-image"
        src={SITE_LOGO_URL}
        alt=""
        loading="eager"
        decoding="sync"
      />
    </button>
  );
}

export function SiteHeaderCartIcon({ className }: { className?: string }) {
  return <img aria-hidden="true" className={className} src="/site-mock/header/actions-cart.svg" alt="" />;
}

export function SiteHeaderSearchIcon({ className }: { className?: string } = {}) {
  return <img aria-hidden="true" className={className ? `site-header__search-icon ${className}` : "site-header__search-icon"} src="/site-mock/header/actions-search.svg" alt="" />;
}
