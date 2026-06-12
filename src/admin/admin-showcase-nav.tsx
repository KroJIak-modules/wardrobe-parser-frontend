import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LatexBrand } from "../shared/latex-brand";
import type { ShowcaseNavigationSection, ShowcaseTopSectionKey } from "./showcase-contracts";
import { fetchShowcaseNavigation, readShowcaseNavigationSeed } from "./showcase-mock-api";
import { buildRouteTargetHref, buildRouteTargetHrefWithCarry } from "./showcase-url-state";
import "./admin-showcase-nav.css";

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
                <ul className="showcase-nav__block-list">
                  {block.items.map((item) => (
                    <li key={item.id}>
                    <Link
                      className={
                        item.presentation === "heading"
                          ? "showcase-nav__link showcase-nav__link--heading"
                          : "showcase-nav__link"
                        }
                      to={buildRouteTargetHref(item.target)}
                      onClick={onNavigate}
                    >
                      {section.key === "designers" ? (
                        <LatexBrand value={item.label} className="showcase-nav__link-label showcase-nav__link-label--latex" />
                      ) : (
                        <span className="showcase-nav__link-label">{item.label}</span>
                      )}
                    </Link>
                  </li>
                ))}
                </ul>
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
  const [sections, setSections] = useState<readonly ShowcaseNavigationSection[]>(() => readShowcaseNavigationSeed().sections);
  const [activeSectionKey, setActiveSectionKey] = useState<ShowcaseTopSectionKey | null>(null);
  const currentSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetchShowcaseNavigation();
      if (!cancelled) {
        setSections(response.sections);
      }
    })();
    return () => {
      cancelled = true;
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
                  if (section.key === "sale" && section.target) {
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
