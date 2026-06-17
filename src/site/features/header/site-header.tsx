import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SiteNavItem } from "../../mock/site-mock-data";
import { siteHeaderDropdownColumns } from "./site-header-data";
import "./site-header.css";

type SiteHeaderProps = {
  theme: "light" | "dark";
  menuItems: SiteNavItem[];
  actionItems: SiteNavItem[];
};

type IndicatorState = {
  left: number;
  width: number;
  opacity: number;
};

const EMPTY_INDICATOR: IndicatorState = { left: 0, width: 0, opacity: 0 };

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

export function SiteHeader({ theme, menuItems, actionItems }: SiteHeaderProps) {
  const navigate = useNavigate();
  const menuRowRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [hoveredActionIndex, setHoveredActionIndex] = useState<number | null>(null);
  const [menuIndicator, setMenuIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);
  const [actionIndicator, setActionIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);

  const syncIndicator = useCallback(
    (
      itemRefs: Array<HTMLButtonElement | null>,
      container: HTMLElement | null,
      index: number | null,
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

      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setter({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
        opacity: 1,
      });
    },
    []
  );

  useLayoutEffect(() => {
    syncIndicator(menuItemRefs.current, menuRowRef.current, openMenuIndex, setMenuIndicator);
  }, [openMenuIndex, syncIndicator]);

  useLayoutEffect(() => {
    const fallbackIndex = isSearchExpanded ? 0 : hoveredActionIndex;
    syncIndicator(actionItemRefs.current, actionItemRefs.current[0]?.parentElement ?? null, fallbackIndex, setActionIndicator);
  }, [hoveredActionIndex, isSearchExpanded, syncIndicator]);

  useEffect(() => {
    const handleResize = () => {
      syncIndicator(menuItemRefs.current, menuRowRef.current, openMenuIndex, setMenuIndicator);
      const fallbackIndex = isSearchExpanded ? 0 : hoveredActionIndex;
      syncIndicator(actionItemRefs.current, actionItemRefs.current[0]?.parentElement ?? null, fallbackIndex, setActionIndicator);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredActionIndex, isSearchExpanded, openMenuIndex, syncIndicator]);

  const expandedWidth = isSearchExpanded ? 370 : 180;

  return (
    <header className={`site-header site-header--${theme}`}>
      <button
        type="button"
        className="site-header__logo"
        aria-label="Anton Shell"
        onClick={() => navigate("/")}
      >
        <img src="/logo_anton_shell.svg" alt="" className="site-header__logo-image" />
      </button>

      <div
        className={`site-header__menu${openMenuIndex !== null ? " site-header__menu--open" : ""}`}
        onMouseLeave={() => setOpenMenuIndex(null)}
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
              onMouseEnter={() => setOpenMenuIndex(index)}
              onFocus={() => setOpenMenuIndex(index)}
              onClick={() => item.to && navigate(item.to)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="site-header__menu-dropdown" aria-hidden={openMenuIndex === null}>
          {siteHeaderDropdownColumns.map((column) => (
            <div key={column.title} className="site-header__menu-column">
              <p className="site-header__menu-column-title">{column.title}</p>
              <div className="site-header__menu-column-items">
                {column.items.map((item) => (
                  <button key={item} type="button" className="site-header__menu-link" onClick={() => navigate("/catalog")}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`site-header__actions${isSearchExpanded ? " site-header__actions--expanded" : ""}`}
        style={{ width: `${expandedWidth}px` }}
        onMouseLeave={() => {
          setHoveredActionIndex(null);
          setIsSearchExpanded(false);
        }}
      >
        <div className="site-header__actions-surface" />
        <div className="site-header__search-field" aria-hidden={!isSearchExpanded}>
          <span className="site-header__search-placeholder">Поиск</span>
          <SearchIcon />
        </div>
        <div className="site-header__actions-row">
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
                setHoveredActionIndex(index);
                if (index === 0) {
                  setIsSearchExpanded(true);
                }
              }}
              onFocus={() => {
                setHoveredActionIndex(index);
                if (index === 0) {
                  setIsSearchExpanded(true);
                }
              }}
              onClick={() => {
                if (item.to) {
                  navigate(item.to);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
