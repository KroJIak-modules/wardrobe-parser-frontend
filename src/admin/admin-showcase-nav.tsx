import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LatexBrand } from "../shared/latex-brand";
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
        const label =
          sectionKey === "designers" ? (
            <LatexBrand value={entry.label} className="showcase-nav__link-label showcase-nav__link-label--latex" />
          ) : (
            <span className="showcase-nav__link-label">{entry.label}</span>
          );

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
  currentSearchParams,
  onNavigate,
}: {
  section: ShowcaseNavigationSection;
  currentSearchParams: URLSearchParams;
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
    <div className="showcase-nav__overlay">
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
                to={buildRouteTargetHrefWithCarry(section.menu.footerLink.target, currentSearchParams, ["designer"])}
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
  const location = useLocation();
  // Top tabs from shell immediately; menus from shared navigation cache/API.
  const { sections } = useAdminShowcaseNavigation();
  const [activeSectionKey, setActiveSectionKey] = useState<ShowcaseTopSectionKey | null>(null);
  const currentSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeSectionKey) ?? null,
    [activeSectionKey, sections],
  );

  return (
    <section className="showcase-nav" aria-label="Разделы витрины" onMouseLeave={() => setActiveSectionKey(null)}>
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
                onMouseEnter={() => setActiveSectionKey(section.key)}
                onFocus={() => setActiveSectionKey(section.key)}
                onClick={() => {
                  if (section.target) {
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
          <ShowcaseNavMenu
            section={activeSection}
            currentSearchParams={currentSearchParams}
            onNavigate={() => setActiveSectionKey(null)}
          />
        ) : null}
      </div>
    </section>
  );
}
