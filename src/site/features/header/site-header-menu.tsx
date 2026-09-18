import { useMemo, type CSSProperties, type MutableRefObject } from "react";
import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import type { IndicatorState } from "./site-header-contracts";
import type { SiteHeaderDropdownMenu, SiteHeaderDropdownMenuKind } from "./site-header-data";
import { SiteHeaderDropdownContent } from "./site-header-dropdown-content";

// The dropdown window is measured from the very top of the menu block and is
// 400px tall in the design. Inside it: the button row with its hover pill
// (pill bottom at 42px), a 32px gap to the first dropdown row and a per-tab
// gap between the last row and the window border. Only those two gaps scale
// proportionally when the window grows (k = height / 400); item gaps and text
// line heights stay fixed, so the window height is derived from the menu data
// alone (no DOM measurements, no resize feedback).
const MENU_SCALE_BASE_PX = 400;
const MENU_PILL_BOTTOM_PX = 42;
const MENU_TOP_GAP_PX = 32;
const MENU_ITEMS_GAP_PX_BY_KIND: Record<SiteHeaderDropdownMenuKind, number> = { new: 13, designers: 14, men: 12, women: 10 };
const MENU_BOTTOM_GAP_PX_BY_KIND: Record<SiteHeaderDropdownMenuKind, number> = { new: 32, designers: 21, men: 31, women: 20 };
const MENU_ITEM_LINE_HEIGHT_PX = 17;
const MENU_HEADING_LINE_HEIGHT_PX = 24;
const MENU_COLUMN_TITLE_LINE_HEIGHT_PX = 24;
// Designers footer button: 21px gap above it + 19px button line height.
const MENU_DESIGNERS_FOOTER_RESERVE_PX = 40;

function computeMenuOpenHeight(dropdownMenus: Record<string, SiteHeaderDropdownMenu>): number {
  let maxHeight = MENU_SCALE_BASE_PX;
  for (const menu of Object.values(dropdownMenus)) {
    const itemsGap = MENU_ITEMS_GAP_PX_BY_KIND[menu.kind];
    const bottomGap = MENU_BOTTOM_GAP_PX_BY_KIND[menu.kind];
    // Columns sit side by side, so the tab content height is the tallest column.
    let tallestColumn = 0;
    for (const column of menu.columns) {
      let columnHeight = 0;
      if (column.title) {
        columnHeight += MENU_COLUMN_TITLE_LINE_HEIGHT_PX + itemsGap;
      }
      column.entries.forEach((entry, index) => {
        const lineHeight = entry.presentation === "heading" ? MENU_HEADING_LINE_HEIGHT_PX : MENU_ITEM_LINE_HEIGHT_PX;
        columnHeight += lineHeight + (index > 0 ? itemsGap : 0);
      });
      tallestColumn = Math.max(tallestColumn, columnHeight);
    }
    const footerReserve = menu.footerLink ? MENU_DESIGNERS_FOOTER_RESERVE_PX : 0;
    const neededHeight = Math.ceil(
      ((MENU_PILL_BOTTOM_PX + tallestColumn + footerReserve) * MENU_SCALE_BASE_PX) /
        (MENU_SCALE_BASE_PX - MENU_TOP_GAP_PX - bottomGap),
    );
    maxHeight = Math.max(maxHeight, neededHeight);
  }
  return maxHeight;
}

export function SiteHeaderMenu({
  menuItems,
  menuRowRef,
  menuItemRefs,
  menuLabelRefs,
  dropdownMenus,
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
  dropdownMenus?: Record<string, SiteHeaderDropdownMenu>;
  menuIndicator: IndicatorState;
  hoveredMenuIndex: number | null;
  openMenuIndex: number | null;
  onMenuLeave: () => void;
  onMenuHover: (index: number, label: string) => void;
  onMenuActivate: (index: number, item: SiteNavItem) => void;
  onNavigateFromDropdown: (to: string, navigationState?: unknown) => void;
}) {
  const menuOpenHeight = useMemo(() => computeMenuOpenHeight(dropdownMenus ?? {}), [dropdownMenus]);
  const menuStyle = {
    "--menu-scale": `${menuOpenHeight / MENU_SCALE_BASE_PX}`,
    "--menu-open-height": `${menuOpenHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={`site-header__menu${openMenuIndex !== null ? " site-header__menu--open" : ""}`}
      style={menuStyle}
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
      {menuItems.map((item, index) => {
        const dropdownMenu = dropdownMenus?.[item.label];
        if (!dropdownMenu) {
          return null;
        }
        return (
          <SiteHeaderDropdownContent
            key={dropdownMenu.kind}
            menu={dropdownMenu}
            active={openMenuIndex === index}
            onNavigate={onNavigateFromDropdown}
          />
        );
      })}
    </div>
  );
}
