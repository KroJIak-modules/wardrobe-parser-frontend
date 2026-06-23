import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import { getSiteHeaderDropdownMenu, type SiteHeaderDropdownMenu, type SiteHeaderMenuEntry } from "./site-header-data";
import "./site-header.css";

type SiteHeaderProps = {
  theme: "light" | "dark";
  menuItems: SiteNavItem[];
  actionItems: SiteNavItem[];
  mode?: "fixed" | "preview";
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

type IndicatorState = {
  left: number;
  width: number;
  opacity: number;
};

const EMPTY_INDICATOR: IndicatorState = { left: 0, width: 0, opacity: 0 };
const MENU_INDICATOR_SIDE_PADDING = 10;
const ACTION_INDICATOR_SIDE_PADDING = 7;

function SearchIcon() {
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

function normalizeSearchSubmitValue(value: string) {
  return value.trim();
}

function getMenuEntryClassName(entry: SiteHeaderMenuEntry) {
  return entry.presentation === "heading"
    ? "site-header__menu-link site-header__menu-link--heading"
    : "site-header__menu-link";
}

function SiteHeaderDropdownContent({
  menu,
  onNavigate,
}: {
  menu: SiteHeaderDropdownMenu;
  onNavigate: (to: string) => void;
}) {
  return (
    <div className={`site-header__menu-dropdown site-header__menu-dropdown--${menu.kind}`} aria-hidden={false}>
      {menu.columns.map((column, index) => (
        <section
          key={column.id}
          className={[
            "site-header__menu-column",
            index === 0 ? "site-header__menu-column--left" : "site-header__menu-column--right",
            column.align === "center" ? "site-header__menu-column--center" : "site-header__menu-column--start",
          ].join(" ")}
        >
          {column.title ? (
            column.title.to ? (
              <button
                type="button"
                className="site-header__menu-column-title site-header__menu-column-title--link"
                onClick={() => onNavigate(column.title?.to ?? "/catalog")}
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
                <button key={entry.id} type="button" className={getMenuEntryClassName(entry)} onClick={() => onNavigate(entry.to ?? "/catalog")}>
                  {entry.label}
                </button>
              ) : (
                <p key={entry.id} className={getMenuEntryClassName(entry)}>
                  {entry.label}
                </p>
              )
            )}
          </div>
        </section>
      ))}

      {menu.footerLink ? (
        <button type="button" className="site-header__menu-footer-link" onClick={() => onNavigate(menu.footerLink.to)}>
          {menu.footerLink.label}
        </button>
      ) : null}
    </div>
  );
}

export function SiteHeader({
  theme,
  menuItems,
  actionItems,
  mode = "fixed",
  searchValue = "",
  onSearchValueChange,
  onSearchSubmit,
}: SiteHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRowRef = useRef<HTMLDivElement | null>(null);
  const actionsRowRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const actionItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSearchHoverFrameRef = useRef<number | null>(null);
  const [hoveredMenuIndex, setHoveredMenuIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(searchValue.trim() !== "");
  const [hoveredActionIndex, setHoveredActionIndex] = useState<number | null>(null);
  const [menuIndicator, setMenuIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);
  const [actionIndicator, setActionIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);
  const expandedWidth = isSearchExpanded ? 370 : 180;
  const activeDropdownMenu = openMenuIndex === null ? null : getSiteHeaderDropdownMenu(menuItems[openMenuIndex]?.label ?? "");

  const syncIndicator = useCallback(
    (
      itemRefs: Array<HTMLButtonElement | null>,
      labelRefs: Array<HTMLSpanElement | null>,
      container: HTMLElement | null,
      index: number | null,
      sidePadding: number,
      setter: (value: IndicatorState) => void
    ) => {
      if (index === null || !container) {
        setter(EMPTY_INDICATOR);
        return;
      }

      const target = itemRefs[index];
      if (!target) {
        setter(EMPTY_INDICATOR);
        return;
      }

      const label = labelRefs[index];
      const labelWidth = label?.offsetWidth ?? target.offsetWidth;
      const labelLeft = label?.offsetLeft ?? 0;
      const desiredWidth = Math.ceil(labelWidth + sidePadding * 2);
      const centeredLeft = target.offsetLeft + labelLeft + labelWidth / 2 - desiredWidth / 2;
      setter({
        left: centeredLeft,
        width: desiredWidth,
        opacity: 1,
      });
    },
    []
  );

  const syncActionIndicator = useCallback(
    (index: number | null) => {
      syncIndicator(
        actionItemRefs.current,
        actionLabelRefs.current,
        actionsRowRef.current,
        index,
        ACTION_INDICATOR_SIDE_PADDING,
        setActionIndicator
      );
    },
    [syncIndicator]
  );

  useLayoutEffect(() => {
    syncIndicator(
      menuItemRefs.current,
      menuLabelRefs.current,
      menuRowRef.current,
      hoveredMenuIndex,
      MENU_INDICATOR_SIDE_PADDING,
      setMenuIndicator
    );
  }, [hoveredMenuIndex, syncIndicator]);

  useLayoutEffect(() => {
    syncActionIndicator(hoveredActionIndex);
  }, [hoveredActionIndex, isSearchExpanded, syncActionIndicator]);

  useEffect(() => {
    const handleResize = () => {
      syncIndicator(
        menuItemRefs.current,
        menuLabelRefs.current,
        menuRowRef.current,
        hoveredMenuIndex,
        MENU_INDICATOR_SIDE_PADDING,
        setMenuIndicator
      );

      syncActionIndicator(hoveredActionIndex);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredActionIndex, hoveredMenuIndex, syncActionIndicator, syncIndicator]);

  useEffect(() => {
    if (searchValue.trim() !== "") {
      setIsSearchExpanded(true);
    }
  }, [searchValue]);

  const isSearchInteractive = typeof onSearchValueChange === "function" || typeof onSearchSubmit === "function";

  const handleSearchSubmit = useCallback(() => {
    const normalizedValue = normalizeSearchSubmitValue(searchValue);
    if (normalizedValue === "") {
      return;
    }

    onSearchSubmit?.(normalizedValue);
  }, [onSearchSubmit, searchValue]);

  const collapseSearchIfEmpty = useCallback(() => {
    if (document.activeElement === searchInputRef.current || searchValue.trim() !== "") {
      return;
    }

    setIsSearchExpanded(false);
  }, [searchValue]);

  const expandSearch = useCallback(() => {
    setIsSearchExpanded(true);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const activateSearchHover = useCallback(() => {
    if (pendingSearchHoverFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingSearchHoverFrameRef.current);
      pendingSearchHoverFrameRef.current = null;
    }

    if (isSearchExpanded) {
      setHoveredActionIndex(0);
      return;
    }

    setHoveredActionIndex(null);
    setIsSearchExpanded(true);
    pendingSearchHoverFrameRef.current = window.requestAnimationFrame(() => {
      setHoveredActionIndex(0);
      pendingSearchHoverFrameRef.current = null;
    });
  }, [isSearchExpanded]);

  useEffect(() => {
    return () => {
      if (pendingSearchHoverFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingSearchHoverFrameRef.current);
      }
    };
  }, []);

  const handleLogoActivate = useCallback(() => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate("/?view=storefront");
  }, [location.pathname, navigate]);

  const logoNode = (
    <button
      type="button"
      className="site-header__logo-shell"
      aria-label="Anton Shell"
      onClick={handleLogoActivate}
    >
      <img
        aria-hidden="true"
        className="site-header__logo-image"
        src="/logo_anton_shell.svg"
        alt=""
        loading="eager"
        decoding="sync"
      />
    </button>
  );

  const navigateFromDropdown = useCallback(
    (to: string) => {
      setHoveredMenuIndex(null);
      setOpenMenuIndex(null);

      if (to === "/designers" && location.pathname === "/catalog" && location.search !== "") {
        navigate({
          pathname: "/designers",
          search: location.search,
        });
        return;
      }

      navigate(to);
    },
    [location.pathname, location.search, navigate]
  );

  return (
    <>
      {mode === "fixed" ? logoNode : null}
      <header className={`site-header site-header--${theme} site-header--${mode}`}>
        {mode === "preview" ? logoNode : null}
        <div
          className={`site-header__menu${openMenuIndex !== null ? " site-header__menu--open" : ""}`}
          onMouseLeave={() => {
            setHoveredMenuIndex(null);
            setOpenMenuIndex(null);
          }}
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
                onMouseEnter={() => {
                  const nextMenu = getSiteHeaderDropdownMenu(item.label);
                  setHoveredMenuIndex(index);
                  setOpenMenuIndex(nextMenu ? index : null);
                }}
                onFocus={() => {
                  const nextMenu = getSiteHeaderDropdownMenu(item.label);
                  setHoveredMenuIndex(index);
                  setOpenMenuIndex(nextMenu ? index : null);
                }}
              onClick={() => {
                  setHoveredMenuIndex(index);
                  const nextMenu = getSiteHeaderDropdownMenu(item.label);
                  setOpenMenuIndex(nextMenu ? index : null);
                  if (!nextMenu && item.to) {
                    navigate(item.to);
                  }
                }}
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
          {activeDropdownMenu ? <SiteHeaderDropdownContent menu={activeDropdownMenu} onNavigate={navigateFromDropdown} /> : null}
        </div>

        <div
          className={`site-header__actions${isSearchExpanded ? " site-header__actions--expanded" : ""}`}
          style={{ width: `${expandedWidth}px` }}
          onMouseLeave={() => {
            setHoveredActionIndex(null);
            collapseSearchIfEmpty();
          }}
        >
          <div className="site-header__actions-surface" />
          <div className="site-header__search-field" aria-hidden={!isSearchExpanded}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                onSearchValueChange?.(nextValue);
              }}
              onBlur={() => {
                setHoveredActionIndex(null);
                collapseSearchIfEmpty();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              className="site-header__search-input"
              placeholder="Поиск"
              aria-label="Поиск"
            />
          </div>
          <button
            type="button"
            className="site-header__search-icon-button"
            aria-label="Запустить поиск"
            onClick={() => {
              if (!isSearchExpanded) {
                expandSearch();
                return;
              }

              handleSearchSubmit();
            }}
          >
            <SearchIcon />
          </button>
          <div ref={actionsRowRef} className="site-header__actions-row">
            <span
              className="site-header__actions-indicator"
              aria-hidden="true"
              style={{
                width: `${actionIndicator.width}px`,
                opacity: actionIndicator.opacity,
                transform: `translateX(${actionIndicator.left}px)`,
              }}
            />
            {actionItems.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                ref={(node) => {
                  actionItemRefs.current[index] = node;
                }}
                type="button"
                className="site-header__action-item"
                onMouseEnter={() => {
                  if (index === 0) {
                    activateSearchHover();
                    return;
                  }

                  setHoveredActionIndex(index);
                  collapseSearchIfEmpty();
                }}
                onFocus={() => {
                  if (index === 0) {
                    activateSearchHover();
                    return;
                  }

                  setHoveredActionIndex(index);
                  collapseSearchIfEmpty();
                }}
                onClick={() => {
                  if (index === 0 && isSearchInteractive) {
                    if (!isSearchExpanded) {
                      expandSearch();
                      return;
                    }

                    handleSearchSubmit();
                    return;
                  }

                  if (item.to) {
                    navigate(item.to);
                  }
                }}
                onBlur={() => {
                  setHoveredActionIndex(null);
                }}
              >
                <span
                  ref={(node) => {
                    actionLabelRefs.current[index] = node;
                  }}
                  className="site-header__action-item-label"
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
