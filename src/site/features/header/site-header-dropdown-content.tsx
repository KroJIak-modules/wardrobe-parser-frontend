import type { SiteDesignersLocationState } from "../designers/site-designers-navigation";
import type { SiteHeaderDropdownMenu, SiteHeaderMenuEntry } from "./site-header-data";

function getMenuEntryClassName(entry: SiteHeaderMenuEntry) {
  return entry.presentation === "heading"
    ? "site-header__menu-link site-header__menu-link--heading"
    : "site-header__menu-link";
}

export function SiteHeaderDropdownContent({
  menu,
  active,
  onNavigate,
}: {
  menu: SiteHeaderDropdownMenu;
  active: boolean;
  onNavigate: (to: string, navigationState?: SiteDesignersLocationState) => void;
}) {
  return (
    <div
      className={`site-header__menu-dropdown site-header__menu-dropdown--${menu.kind}${active ? " site-header__menu-dropdown--active" : ""}`}
      aria-hidden={!active}
    >
      <div
        className={`site-header__menu-dropdown-content${menu.footerLink ? " site-header__menu-dropdown-content--with-footer" : ""}`}
      >
        <div className="site-header__menu-columns">
          {menu.columns.map((column) => (
            <section
              key={column.id}
              className={[
                "site-header__menu-column",
                column.align === "center" ? "site-header__menu-column--center" : "site-header__menu-column--start",
              ].join(" ")}
            >
              {column.title ? (
                column.title.to ? (
                  <button
                    type="button"
                    className="site-header__menu-column-title site-header__menu-column-title--link"
                    onClick={() => onNavigate(column.title?.to ?? "/catalog", column.title?.navigationState)}
                  >
                    {column.title.label}
                  </button>
                ) : (
                  <p className="site-header__menu-column-title">{column.title.label}</p>
                )
              ) : null}

              <div className="site-header__menu-column-items">
                {column.entries.map((entry) =>
                  entry.to ? (
                    <button
                      key={entry.id}
                      type="button"
                      className={getMenuEntryClassName(entry)}
                      onClick={() => onNavigate(entry.to ?? "/catalog", entry.navigationState)}
                    >
                      {entry.label}
                    </button>
                  ) : (
                    <p key={entry.id} className={getMenuEntryClassName(entry)}>
                      {entry.label}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {menu.footerLink ? (
        <button
          type="button"
          className="site-header__menu-footer-link"
          onClick={() => onNavigate(menu.footerLink.to, menu.footerLink.navigationState)}
        >
          {menu.footerLink.label}
        </button>
      ) : null}
    </div>
  );
}
