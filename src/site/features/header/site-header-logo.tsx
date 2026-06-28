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

export function SiteHeaderSearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="site-header__search-icon"
      viewBox="0 0 23 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.4149 13.6406C15.2802 12.5931 15.8267 11.2495 15.8267 9.76931C15.8267 6.44455 13.1168 3.73465 9.79208 3.73465C6.46733 3.73465 3.75743 6.44455 3.75743 9.76931C3.75743 13.0941 6.46733 15.804 9.79208 15.804C11.2495 15.804 12.6158 15.2802 13.6634 14.3921L18.3545 19.0832C18.4683 19.197 18.605 19.2426 18.7416 19.2426C18.8782 19.2426 19.0149 19.197 19.1287 19.0832C19.3337 18.8782 19.3337 18.5139 19.1287 18.3089L14.4149 13.6406ZM9.76931 14.7109C7.03663 14.7109 4.82772 12.502 4.82772 9.76931C4.82772 7.03663 7.03663 4.82772 9.76931 4.82772C12.502 4.82772 14.7109 7.03663 14.7109 9.76931C14.7109 12.502 12.502 14.7109 9.76931 14.7109Z"
        fill="rgba(0, 0, 0, 0.6)"
      />
    </svg>
  );
}
