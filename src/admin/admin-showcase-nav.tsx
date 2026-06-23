import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LatexBrand } from "../shared/latex-brand";
import type { ShowcaseNavigationMenuItem, ShowcaseNavigationSection, ShowcaseTopSectionKey } from "./showcase-contracts";
import { fetchShowcaseNavigation } from "./showcase-api";
import { buildRouteTargetHref, buildRouteTargetHrefWithCarry } from "./showcase-url-state";
import "./admin-showcase-nav.css";

function ShowcaseNavMenuItems({
  items,
  sectionKey,
  onNavigate,
}: {
  items: readonly ShowcaseNavigationMenuItem[];
  sectionKey: ShowcaseTopSectionKey;
  onNavigate: () => void;
}) {
  return (
    <ul className="showcase-nav__block-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className={
              item.presentation === "heading" ? "showcase-nav__link showcase-nav__link--heading" : "showcase-nav__link"
            }
            to={buildRouteTargetHref(item.target)}
            onClick={onNavigate}
          >
            {sectionKey === "designers" ? (
              <LatexBrand value={item.label} className="showcase-nav__link-label showcase-nav__link-label--latex" />
            ) : (
              <span className="showcase-nav__link-label">{item.label}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
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

  const panelContentClassName = [
    "showcase-nav__panel-content",
    `showcase-nav__panel-content--${section.menu.layout}`,
  ].join(" ");

  return (
    <div className="showcase-nav__overlay">
      <div className="showcase-nav__safe-zone" aria-hidden="true" />
      <div className="showcase-nav__panel">
        <div className="showcase-nav__panel-body">
          <div className={panelContentClassName}>
            {section.menu.blocks.map((block) => (
              <section key={block.id} className="showcase-nav__block" aria-label={block.title || undefined}>
                {block.title ? (
                  block.titleTarget ? (
                    <Link
                      className="showcase-nav__block-title showcase-nav__block-title--link"
                      to={buildRouteTargetHref(block.titleTarget)}
                      onClick={onNavigate}
                    >
                      {block.title}
                    </Link>
                  ) : (
                    <h3 className="showcase-nav__block-title">{block.title}</h3>
                  )
                ) : null}
                {Array.isArray(block.groups) && block.groups.length > 0 ? (
                  <div className="showcase-nav__block-groups">
                    {block.groups.map((group) => (
                      <div key={group.id} className="showcase-nav__group">
                        <h4 className="showcase-nav__group-title">{group.title}</h4>
                        <ShowcaseNavMenuItems items={group.items} sectionKey={section.key} onNavigate={onNavigate} />
                      </div>
                    ))}
                  </div>
                ) : null}
                {block.items.length > 0 ? (
                  <ShowcaseNavMenuItems items={block.items} sectionKey={section.key} onNavigate={onNavigate} />
                ) : null}
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
  const [sections, setSections] = useState<readonly ShowcaseNavigationSection[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<ShowcaseTopSectionKey | null>(null);
  const currentSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    let aborted = false;
    void (async () => {
      const response = await fetchShowcaseNavigation().catch(() => ({ sections: [] }));
      if (!aborted) {
        setSections(response.sections);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeSectionKey) ?? null,
    [activeSectionKey, sections]
  );

  return (
    <section className="showcase-nav" aria-label="Разделы витрины" onMouseLeave={() => setActiveSectionKey(null)}>
      <div className="showcase-nav__dock">
        <div className="showcase-nav__bar" aria-label="Верхняя навигация">
          {sections.map((section) => {
            const isActive = activeSectionKey === section.key;
            return (
              <button
                key={section.key}
                type="button"
                className={isActive ? "showcase-nav__item showcase-nav__item--active" : "showcase-nav__item"}
                aria-expanded={activeSectionKey === section.key && section.menu ? true : undefined}
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

        {activeSection ? (
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
