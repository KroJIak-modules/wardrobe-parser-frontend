import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type {
  ShowcaseNavigationMenu,
  ShowcaseNavigationMenuBlock,
  ShowcaseNavigationSection,
  ShowcaseRouteTarget,
  ShowcaseTopSectionKey,
} from "./showcase-contracts";
import { useAdminShowcaseNavigation } from "./hooks/use-admin-showcase-navigation";
import { buildRouteTargetHref, buildRouteTargetHrefWithCarry } from "./showcase-url-state";
import "./admin-showcase-nav.css";

type ShowcaseNavColumnEntry = {
  id: string;
  label: string;
  presentation: "heading" | "item";
  target: ShowcaseRouteTarget | null;
};

type ShowcaseNavColumn = {
  id: string;
  align: "start" | "center";
  title: { label: string; target: ShowcaseRouteTarget | null } | null;
  entries: readonly ShowcaseNavColumnEntry[];
};

function blockEntries(block: ShowcaseNavigationMenuBlock): ShowcaseNavColumnEntry[] {
  const entries: ShowcaseNavColumnEntry[] = [];

  for (const group of block.groups ?? []) {
    if (group.title) {
      entries.push({
        id: `${block.id}-${group.id}-heading`,
        label: group.title,
        presentation: "heading",
        target: group.titleTarget ?? null,
      });
    }
    for (const item of group.items) {
      entries.push({
        id: item.id,
        label: item.label,
        presentation: item.presentation === "heading" ? "heading" : "item",
        target: item.target,
      });
    }
  }

  for (const item of block.items) {
    entries.push({
      id: item.id,
      label: item.label,
      presentation: item.presentation === "heading" ? "heading" : "item",
      target: item.target,
    });
  }

  return entries;
}

function buildMenuColumns(sectionKey: ShowcaseTopSectionKey, menu: ShowcaseNavigationMenu): ShowcaseNavColumn[] {
  const baseColumns = menu.blocks.map((block) => ({
    id: block.id,
    align: (sectionKey === "designers" ? "center" : "start") as "start" | "center",
    title: block.title
      ? {
          label: block.title,
          target: block.titleTarget ?? null,
        }
      : null,
    entries: blockEntries(block),
  }));

  // Designers: the "Смотреть все" entry always sits at the very bottom of the
  // panel — on mobile the columns stack into one list, so mid-list placement
  // looked broken.
  if (sectionKey === "designers") {
    const viewAllEntries: ShowcaseNavColumnEntry[] = [];
    const columnsWithoutViewAll = baseColumns.map((column) => ({
      ...column,
      entries: column.entries.filter((entry) => {
        if (entry.label.trim().toLowerCase() === "смотреть все") {
          viewAllEntries.push(entry);
          return false;
        }
        return true;
      }),
    }));
    if (viewAllEntries.length > 0 && columnsWithoutViewAll.length > 0) {
      const lastIndex = columnsWithoutViewAll.length - 1;
      columnsWithoutViewAll[lastIndex] = {
        ...columnsWithoutViewAll[lastIndex],
        entries: [...columnsWithoutViewAll[lastIndex].entries, ...viewAllEntries],
      };
      return columnsWithoutViewAll;
    }
  }

  // Public desktop: left column = first block (Одежда), right = remaining blocks
  // flattened with their titles as headings (Обувь, Аксессуары).
  if ((sectionKey === "men" || sectionKey === "women") && baseColumns.length > 1) {
    const [leftColumn, ...rightColumns] = baseColumns;
    if (rightColumns.length === 0) {
      return baseColumns;
    }

    if (rightColumns.length === 1) {
      return [leftColumn, rightColumns[0]];
    }

    const mergedRightEntries = rightColumns.flatMap((column) => {
      const titleEntry: ShowcaseNavColumnEntry | null = column.title
        ? {
            id: `${column.id}-title`,
            label: column.title.label,
            presentation: "heading",
            target: column.title.target,
          }
        : null;
      // Nested group titles stay as headings; block body items stay items.
      return titleEntry ? [titleEntry, ...column.entries] : column.entries;
    });

    return [
      leftColumn,
      {
        id: rightColumns.map((column) => column.id).join("-"),
        align: "start",
        title: null,
        entries: mergedRightEntries,
      },
    ];
  }

  return baseColumns;
}

function ShowcaseNavColumnEntries({
  entries,
  sectionKey,
  onNavigate,
}: {
  entries: readonly ShowcaseNavColumnEntry[];
  sectionKey: ShowcaseTopSectionKey;
  onNavigate: () => void;
}) {
  return (
    <div className="showcase-nav__column-items">
      {entries.map((entry) => {
        const className =
          entry.presentation === "heading"
            ? "showcase-nav__link showcase-nav__link--heading"
            : "showcase-nav__link";
        const label = <span className="showcase-nav__link-label">{entry.label}</span>;

        if (entry.target) {
          return (
            <Link key={entry.id} className={className} to={buildRouteTargetHref(entry.target)} onClick={onNavigate}>
              {label}
            </Link>
          );
        }

        return (
          <p key={entry.id} className={className}>
            {label}
          </p>
        );
      })}
    </div>
  );
}

function ShowcaseNavMenu({
  section,
  onNavigate,
}: {
  section: ShowcaseNavigationSection;
  onNavigate: () => void;
}) {
  if (!section.menu) {
    return null;
  }

  const columns = buildMenuColumns(section.key, section.menu);
  const panelContentClassName = [
    "showcase-nav__panel-content",
    `showcase-nav__panel-content--${section.menu.layout}`,
    section.key === "men" || section.key === "women" ? "showcase-nav__panel-content--gender" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="showcase-nav__overlay"
      onClick={() => {
        openSectionRef.current = { key: null, at: 0 };
        setActiveSectionKey(null);
      }}
    >
      <div className="showcase-nav__safe-zone" aria-hidden="true" />
      <div className="showcase-nav__panel">
        <div className="showcase-nav__panel-body">
          <div className={panelContentClassName}>
            {columns.map((column, index) => (
              <section
                key={column.id}
                className={[
                  "showcase-nav__column",
                  index === 0 ? "showcase-nav__column--left" : "showcase-nav__column--right",
                  column.align === "center" ? "showcase-nav__column--center" : "showcase-nav__column--start",
                ].join(" ")}
                aria-label={column.title?.label || undefined}
              >
                {column.title ? (
                  column.title.target ? (
                    <Link
                      className="showcase-nav__column-title showcase-nav__column-title--link"
                      to={buildRouteTargetHref(column.title.target)}
                      onClick={onNavigate}
                    >
                      {column.title.label}
                    </Link>
                  ) : (
                    <h3 className="showcase-nav__column-title">{column.title.label}</h3>
                  )
                ) : null}
                <ShowcaseNavColumnEntries entries={column.entries} sectionKey={section.key} onNavigate={onNavigate} />
              </section>
            ))}
          </div>
          {section.menu.footerLink ? (
            <div className="showcase-nav__footer">
              <Link
                className="showcase-nav__footer-link"
                to={buildRouteTargetHref(section.menu.footerLink.target)}
                state={{ designersEntryMode: "browse" }}
                onClick={onNavigate}
              >
                {section.menu.footerLink.label}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminShowcaseNav() {
  const navigate = useNavigate();
  // Top tabs from shell immediately; menus from shared navigation cache/API.
  const { sections } = useAdminShowcaseNavigation();
  const [activeSectionKey, setActiveSectionKey] = useState<ShowcaseTopSectionKey | null>(null);
  const openSectionRef = useRef<{ key: ShowcaseTopSectionKey | null; at: number }>({ key: null, at: 0 });

  // Touch manages the menu through pointerup alone; hover/focus opening must
  // not interfere (browsers emit compat mouseenter/focus after every tap).
  const isHoverDevice = () => window.matchMedia("(hover: hover)").matches;

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeSectionKey) ?? null,
    [activeSectionKey, sections],
  );

  // Mobile: the nav row is a horizontal scroll container that would clip the
  // absolutely positioned panel, so the panel becomes fixed. Its top offset
  // tracks the row's current bottom edge.
  const syncPanelTop = () => {
    const row = document.querySelector(".showcase-nav-row");
    if (row) {
      const bottom = Math.round(row.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty("--showcase-panel-top", `${bottom}px`);
    }
  };

  // Touch: scrolling the page while the menu is open closes it; a tap on the
  // dim overlay closes it too (native listener — reliable under emulation).
  // Taps on the dim area are handled by the overlay click; pills manage themselves.
  useEffect(() => {
    if (!activeSectionKey || isHoverDevice()) {
      return undefined;
    }
    const closeMenu = () => {
      openSectionRef.current = { key: null, at: 0 };
      setActiveSectionKey(null);
    };
    const overlay = document.querySelector(".showcase-nav__overlay");
    const onOverlayClick = () => closeMenu();
    const onScroll = () => closeMenu();
    if (overlay) {
      overlay.addEventListener("click", onOverlayClick);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (overlay) {
        overlay.removeEventListener("click", onOverlayClick);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeSectionKey]);

  return (
    <section
      className="showcase-nav"
      aria-label="Разделы витрины"
      onMouseLeave={() => {
        openSectionRef.current = null;
        setActiveSectionKey(null);
      }}
    >
      <div className="showcase-nav__dock">
        <div className="showcase-nav__bar" aria-label="Верхняя навигация">
          {sections.map((section) => {
            const isActive = activeSectionKey === section.key;
            const hasMenu = Boolean(section.menu);
            return (
              <button
                key={section.key}
                type="button"
                className={isActive ? "showcase-nav__item showcase-nav__item--active" : "showcase-nav__item"}
                aria-expanded={isActive && hasMenu ? true : undefined}
                onMouseEnter={() => {
                  if (!isHoverDevice()) {
                    return;
                  }
                  syncPanelTop();
                  setActiveSectionKey(section.key);
                }}
                onFocus={() => {
                  if (!isHoverDevice()) {
                    return;
                  }
                  setActiveSectionKey(section.key);
                }}
                onClick={() => {
                  if (!isHoverDevice() && hasMenu) {
                    // Touch: first tap opens the dropdown (like hover on
                    // desktop), second tap on the already-open section picks it.
                    const recent = openSectionRef.current;
                    if (recent && recent.key === section.key && Date.now() - recent.at < 2500) {
                      openSectionRef.current = { key: null, at: 0 };
                      setActiveSectionKey(null);
                      if (section.key !== "designers" && section.target) {
                        navigate(buildRouteTargetHref(section.target));
                      }
                      return;
                    }
                    openSectionRef.current = { key: section.key, at: Date.now() };
                    syncPanelTop();
                    setActiveSectionKey(section.key);
                    return;
                  }
                  openSectionRef.current = null;
                  if (section.target && section.key !== "designers") {
                    setActiveSectionKey(null);
                    navigate(buildRouteTargetHref(section.target));
                  }
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        {activeSection?.menu ? (
          <ShowcaseNavMenu section={activeSection} onNavigate={() => setActiveSectionKey(null)} />
        ) : null}
      </div>
    </section>
  );
}
