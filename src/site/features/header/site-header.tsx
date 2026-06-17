import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SiteNavItem } from "../../mock/site-mock-data";
import "./site-header.css";

type SiteHeaderProps = {
  theme: "light" | "dark";
  menuItems: SiteNavItem[];
  actionItems: SiteNavItem[];
};

type GlassRailProps = {
  items: SiteNavItem[];
  compact?: boolean;
};

type RailIndicator = {
  left: number;
  width: number;
  opacity: number;
};

const EMPTY_INDICATOR: RailIndicator = { left: 0, width: 0, opacity: 0 };

function GlassRail({ items, compact = false }: GlassRailProps) {
  const navigate = useNavigate();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicator, setIndicator] = useState<RailIndicator>(EMPTY_INDICATOR);

  const syncIndicator = useCallback((index: number | null) => {
    if (index === null) {
      setIndicator(EMPTY_INDICATOR);
      return;
    }

    const node = itemRefs.current[index];
    const parent = node?.parentElement;
    if (!node || !parent) {
      setIndicator(EMPTY_INDICATOR);
      return;
    }

    const nodeRect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    setIndicator({
      left: nodeRect.left - parentRect.left,
      width: nodeRect.width,
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    syncIndicator(hoveredIndex);
  }, [hoveredIndex, syncIndicator]);

  useEffect(() => {
    const handleResize = () => syncIndicator(hoveredIndex);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredIndex, syncIndicator]);

  return (
    <div
      className={`site-glass-rail${compact ? " site-glass-rail--compact" : ""}`}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <span
        className="site-glass-rail__indicator"
        aria-hidden="true"
        style={{
          width: indicator.width,
          opacity: indicator.opacity,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
      {items.map((item, index) => {
        return (
          <button
            key={`${item.label}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            className="site-glass-rail__item"
            data-active="false"
            onMouseEnter={() => setHoveredIndex(index)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => {
              if (item.to) {
                navigate(item.to);
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function SiteHeader({ theme, menuItems, actionItems }: SiteHeaderProps) {
  const navigate = useNavigate();

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
      <GlassRail items={menuItems} />
      <GlassRail items={actionItems} compact />
    </header>
  );
}
