import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ShowcaseNavigationSection, ShowcaseTopSectionKey } from "./showcase-contracts";
import { fetchShowcaseNavigation, readShowcaseNavigationSeed } from "./showcase-mock-api";
import { buildRouteTargetHref } from "./showcase-url-state";
import "./admin-showcase-nav.css";

function resolveCurrentSection(pathname: string, search: string): ShowcaseTopSectionKey | null {
  if (pathname === "/catalog/designers") {
    return "designers";
  }
  if (pathname === "/catalog/sale") {
    return "sale";
  }
  if (pathname === "/catalog") {
    const gender = new URLSearchParams(search).get("gender");
    if (gender === "men") {
      return "men";
    }
    if (gender === "women") {
      return "women";
    }
    return "new";
  }
  return null;
}

function ShowcaseNavMenu({ section, onNavigate }: { section: ShowcaseNavigationSection; onNavigate: () => void }) {
  if (!section.menu) {
    return null;
  }

  return (
    <div className="showcase-nav__overlay">
      <div className="showcase-nav__safe-zone" aria-hidden="true" />
      <div className="showcase-nav__panel">
        <div className="showcase-nav__panel-content">
          {section.menu.blocks.map((block) => (
            <section key={block.id} className="showcase-nav__block" aria-label={block.title}>
              <h3 className="showcase-nav__block-title">{block.title}</h3>
              <ul className="showcase-nav__block-list">
                {block.items.map((item) => (
                  <li key={item.id}>
                    <Link className="showcase-nav__link" to={buildRouteTargetHref(item.target)} onClick={onNavigate}>
                      <span className="showcase-nav__link-label">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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

  const currentSectionKey = useMemo(
    () => resolveCurrentSection(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeSectionKey) ?? null,
    [activeSectionKey, sections]
  );

  return (
    <section className="showcase-nav" aria-label="Разделы витрины" onMouseLeave={() => setActiveSectionKey(null)}>
      <div className="showcase-nav__dock">
        <div className="showcase-nav__bar" aria-label="Верхняя навигация">
          {sections.map((section) => {
            const isCurrent = activeSectionKey === null && currentSectionKey === section.key;
            const isActive = activeSectionKey === section.key || isCurrent;
            return (
              <button
                key={section.key}
                type="button"
                className={isActive ? "showcase-nav__item showcase-nav__item--active" : "showcase-nav__item"}
                aria-expanded={activeSectionKey === section.key && section.menu ? true : undefined}
                onMouseEnter={() => setActiveSectionKey(section.key)}
                onFocus={() => setActiveSectionKey(section.key)}
                onClick={() => {
                  if (!section.target) {
                    setActiveSectionKey(section.key);
                    return;
                  }
                  setActiveSectionKey(null);
                  navigate(buildRouteTargetHref(section.target));
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        {activeSection ? <ShowcaseNavMenu section={activeSection} onNavigate={() => setActiveSectionKey(null)} /> : null}
      </div>
    </section>
  );
}
