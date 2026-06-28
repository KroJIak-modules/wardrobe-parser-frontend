import type { MutableRefObject } from "react";
import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import type { IndicatorState } from "./site-header-contracts";
import { SiteHeaderDropdownContent, getSiteHeaderDropdownMenu } from "./site-header-dropdown-content";

export function SiteHeaderMenu({
  menuItems,
  menuRowRef,
  menuItemRefs,
  menuLabelRefs,
  menuIndicator,
  hoveredMenuIndex,
  openMenuIndex,
  onMenuLeave,
  onMenuHover,
  onMenuActivate,
  onNavigateFromDropdown,
}: {
  menuItems: SiteNavItem[];
  menuRowRef: MutableRefObject<HTMLDivElement | null>;
  menuItemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  menuLabelRefs: MutableRefObject<Array<HTMLSpanElement | null>>;
  menuIndicator: IndicatorState;
  hoveredMenuIndex: number | null;
  openMenuIndex: number | null;
  onMenuLeave: () => void;
  onMenuHover: (index: number, label: string) => void;
  onMenuActivate: (index: number, item: SiteNavItem) => void;
  onNavigateFromDropdown: (to: string, navigationState?: unknown) => void;
}) {
  const activeDropdownMenu = openMenuIndex === null ? null : getSiteHeaderDropdownMenu(menuItems[openMenuIndex]?.label ?? "");

  return (
    <div
      className={`site-header__menu${openMenuIndex !== null ? " site-header__menu--open" : ""}`}
      onMouseLeave={onMenuLeave}
    >
      <div className="site-header__menu-surface" />
      <div ref={menuRowRef} className="site-header__menu-row">
        <span
          className="site-header__menu-indicator"
          aria-hidden="true"
          style={{
            width: `${menuIndicator.width}px`,
            opacity: menuIndicator.opacity,
            transform: `translateX(${menuIndicator.left}px)`,
          }}
        />
        {menuItems.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            ref={(node) => {
              menuItemRefs.current[index] = node;
            }}
            type="button"
            className="site-header__menu-item"
            onMouseEnter={() => onMenuHover(index, item.label)}
            onFocus={() => onMenuHover(index, item.label)}
            onClick={() => onMenuActivate(index, item)}
          >
            <span
              ref={(node) => {
                menuLabelRefs.current[index] = node;
              }}
              className="site-header__menu-item-label"
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {activeDropdownMenu ? <SiteHeaderDropdownContent menu={activeDropdownMenu} onNavigate={onNavigateFromDropdown} /> : null}
    </div>
  );
}
