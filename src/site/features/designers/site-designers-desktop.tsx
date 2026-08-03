import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteDesignersEntryMode } from "./site-designers-navigation";
import type { SiteDesignersDirectoryEntry } from "../../runtime/site-designers";
import {
  buildDesignerLetterOffset,
  buildGroupedDesignerEntries,
} from "./site-designers-model";
import { useSiteDesignersActionsOffset } from "./use-site-designers-actions-offset";
import { useSiteDesignersSelection } from "./use-site-designers-selection";
import "./site-designers.css";

const SITE_DESIGNERS_DESKTOP_SCROLL_TOP_OFFSET = 137;

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

export function SiteDesignersDesktopDirectory({
  alphabet,
  entries,
  mode,
  searchParams,
  onApply,
  onBrowseSelect,
}: {
  alphabet: readonly string[];
  entries: readonly SiteDesignersDirectoryEntry[];
  mode: SiteDesignersEntryMode;
  searchParams: URLSearchParams;
  onApply: (next: URLSearchParams) => void;
  onBrowseSelect: (designerId: string) => void;
}) {
  const groupedEntries = useMemo(() => buildGroupedDesignerEntries(alphabet, entries), [alphabet, entries]);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsBottomOffset = useSiteDesignersActionsOffset({
    baseBottomOffset: 55,
    actionsRef,
    stopSelector: ".site-designers-shell__designer",
    stopGap: 5,
  });
  const {
    selectedDesignerIds,
    hasSelection,
    toggleDesigner,
    clearSelectedDesigners,
    buildAppliedSearchParams,
  } = useSiteDesignersSelection(searchParams);
  const alphabetAvailability = useMemo(() => new Set(groupedEntries.map((section) => section.letter)), [groupedEntries]);

  return (
    <section className="site-designers-shell" aria-label="Каталог дизайнеров">
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
                  top: buildDesignerLetterOffset(target, SITE_DESIGNERS_DESKTOP_SCROLL_TOP_OFFSET),
                  behavior: "smooth",
                });
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="site-designers-shell__sections">
        {groupedEntries.map((section) => (
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
                        if (mode === "browse") {
                          onBrowseSelect(entry.id);
                          return;
                        }

                        toggleDesigner(entry.id);
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
      </div>

      <div className="site-designers-actions">
        <div ref={actionsRef} className="site-designers-actions__inner" style={{ bottom: `${actionsBottomOffset}px` }}>
          {mode === "catalog-filter" ? (
            <>
              <button
                type="button"
                className="site-designers-actions__button site-designers-actions__button--apply"
                onClick={() => onApply(buildAppliedSearchParams())}
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

                  clearSelectedDesigners();
                }}
              >
                ОЧИСТИТЬ
              </button>
            </>
          ) : null}
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
