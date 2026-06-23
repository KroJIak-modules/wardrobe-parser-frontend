import { useEffect, useMemo, useRef, useState } from "react";
import { patchCatalogSearchParams, readCatalogListParam } from "../catalog/site-catalog-query";
import type { SiteDesignersDirectoryEntry } from "../../runtime/site-designers-mock";
import "./site-designers.css";

type SiteDesignersSection = {
  letter: string;
  entries: SiteDesignersDirectoryEntry[];
};

function buildGroupedEntries(alphabet: readonly string[], entries: readonly SiteDesignersDirectoryEntry[]) {
  const groups = new Map<string, SiteDesignersDirectoryEntry[]>();

  for (const letter of alphabet) {
    groups.set(letter, []);
  }

  for (const entry of entries) {
    const bucket = groups.get(entry.letter);
    if (bucket) {
      bucket.push(entry);
    }
  }

  return alphabet
    .map<SiteDesignersSection>((letter) => ({
      letter,
      entries: groups.get(letter) ?? [],
    }))
    .filter((section) => section.entries.length > 0);
}

function buildGridRows(sections: readonly SiteDesignersSection[], columns: number) {
  const rows: SiteDesignersSection[][] = [];

  for (let index = 0; index < sections.length; index += columns) {
    rows.push(sections.slice(index, index + columns));
  }

  return rows;
}

function buildLetterOffset(target: HTMLElement) {
  const topPadding = 137;
  const viewportTop = target.getBoundingClientRect().top + window.scrollY;
  return Math.max(0, viewportTop - topPadding);
}

function ScrollTopArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="site-designers-actions__arrow-icon"
      viewBox="0 0 64 51"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#site-designers-arrow-filter)">
        <rect width="50.1492" height="63.5711" rx="15" transform="matrix(0 1 1 0 0 0)" fill="rgba(255,255,255,0.1)" />
        <path
          d="M31.7927 15.0005C32.1917 14.9894 32.5887 15.1726 32.8386 15.5249L45.3386 33.1616C45.7383 33.7256 45.6099 34.5107 45.0514 34.9145C44.4928 35.3181 43.7159 35.1882 43.3161 34.6245L31.7848 18.3559L20.2555 34.6245C19.8558 35.1883 19.0788 35.3181 18.5202 34.9145C17.9616 34.5108 17.8327 33.7266 18.2321 33.1626L30.7331 15.5249C30.983 15.1726 31.3799 14.9895 31.779 15.0005H31.7927Z"
          fill="rgba(0,0,0,0.8)"
        />
      </g>
      <defs>
        <filter
          id="site-designers-arrow-filter"
          x="0"
          y="-2"
          width="63.571"
          height="54.1494"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_444_2" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend mode="normal" in2="effect1_innerShadow_444_2" result="effect2_innerShadow_444_2" />
        </filter>
      </defs>
    </svg>
  );
}

export function SiteDesignersDirectory({
  alphabet,
  entries,
  searchParams,
  onApply,
}: {
  alphabet: readonly string[];
  entries: readonly SiteDesignersDirectoryEntry[];
  searchParams: URLSearchParams;
  onApply: (next: URLSearchParams) => void;
}) {
  const groupedEntries = useMemo(() => buildGroupedEntries(alphabet, entries), [alphabet, entries]);
  const rows = useMemo(() => buildGridRows(groupedEntries, 6), [groupedEntries]);
  const shellRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const appliedDesignerIds = useMemo(() => readCatalogListParam(searchParams, "designer"), [searchParams]);
  const [selectedDesignerIds, setSelectedDesignerIds] = useState<string[]>(appliedDesignerIds);
  const [actionsBottomOffset, setActionsBottomOffset] = useState(55);

  const hasSelection = selectedDesignerIds.length > 0;
  const alphabetAvailability = useMemo(() => new Set(groupedEntries.map((section) => section.letter)), [groupedEntries]);

  useEffect(() => {
    setSelectedDesignerIds(appliedDesignerIds);
  }, [appliedDesignerIds]);

  useEffect(() => {
    let frameId = 0;

    const updateActionsOffset = () => {
      const footerNode = document.querySelector<HTMLElement>(".site-footer");
      if (!footerNode) {
        return;
      }

      const footerTop = footerNode.getBoundingClientRect().top;
      const nextOffset = Math.max(55, window.innerHeight - footerTop + 55);
      setActionsBottomOffset((current) => (current === nextOffset ? current : nextOffset));
    };

    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateActionsOffset();
      });
    };

    updateActionsOffset();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section ref={shellRef} className="site-designers-shell" aria-label="Каталог дизайнеров">
      <div className="site-designers-shell__alphabet">
        {alphabet.map((letter) => {
          const isAvailable = alphabetAvailability.has(letter);

          return (
            <button
              key={letter}
              type="button"
              className={isAvailable ? "site-designers-shell__alphabet-btn" : "site-designers-shell__alphabet-btn site-designers-shell__alphabet-btn--disabled"}
              disabled={!isAvailable}
              onClick={() => {
                const target = sectionRefs.current.get(letter);
                if (!target) {
                  return;
                }

                window.scrollTo({
                  top: buildLetterOffset(target),
                  behavior: "smooth",
                });
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="site-designers-shell__rows">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex + 1}`} className="site-designers-shell__row">
            {row.map((section) => (
              <section
                key={section.letter}
                ref={(node) => {
                  if (node) {
                    sectionRefs.current.set(section.letter, node);
                    return;
                  }

                  sectionRefs.current.delete(section.letter);
                }}
                className="site-designers-shell__section"
              >
                <h2 className="site-designers-shell__letter">{section.letter}</h2>
                <ul className="site-designers-shell__list">
                  {section.entries.map((entry) => {
                    const isSelected = selectedDesignerIds.includes(entry.id);

                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className={
                            isSelected
                              ? "site-designers-shell__designer site-designers-shell__designer--selected"
                              : "site-designers-shell__designer"
                          }
                          onClick={() => {
                            setSelectedDesignerIds((current) =>
                              current.includes(entry.id)
                                ? current.filter((value) => value !== entry.id)
                                : [...current, entry.id],
                            );
                          }}
                        >
                          {entry.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {Array.from({ length: Math.max(0, 6 - row.length) }, (_, fillerIndex) => (
              <div key={`row-${rowIndex + 1}-filler-${fillerIndex + 1}`} className="site-designers-shell__section site-designers-shell__section--empty" />
            ))}
          </div>
        ))}
      </div>

      <div className="site-designers-actions">
        <div className="site-designers-actions__inner" style={{ bottom: `${actionsBottomOffset}px` }}>
          <button
            type="button"
            className="site-designers-actions__button site-designers-actions__button--apply"
            onClick={() =>
              onApply(
                patchCatalogSearchParams(searchParams, {
                  designer: selectedDesignerIds,
                  page: null,
                }),
              )
            }
          >
            ПРИМЕНИТЬ
          </button>
          <button
            type="button"
            className={
              hasSelection
                ? "site-designers-actions__button site-designers-actions__button--clear"
                : "site-designers-actions__button site-designers-actions__button--clear site-designers-actions__button--disabled"
            }
            disabled={!hasSelection}
            onClick={() => {
              if (!hasSelection) {
                return;
              }

              setSelectedDesignerIds([]);
            }}
          >
            ОЧИСТИТЬ
          </button>
          <button
            type="button"
            className="site-designers-actions__scroll-top"
            aria-label="Наверх"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <ScrollTopArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
