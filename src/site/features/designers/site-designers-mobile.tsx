import { useEffect, useMemo, useRef, useState } from "react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import type { SiteDesignersEntryMode } from "./site-designers-navigation";
import type { SiteDesignersDirectoryEntry } from "../../runtime/site-designers-mock";
import { buildDesignerLetterOffset, buildGroupedDesignerEntries } from "./site-designers-model";
import { useSiteDesignersActionsOffset } from "./use-site-designers-actions-offset";
import { useSiteDesignersSelection } from "./use-site-designers-selection";
import "./site-designers-mobile.css";

const SITE_DESIGNERS_MOBILE_SECTION_TOP_OFFSET = 107;
const SITE_DESIGNERS_MOBILE_ACTIONS_BASE_BOTTOM = 24;
const SITE_DESIGNERS_MOBILE_ACCEPT_ICON_URL = resolveSitePublicAssetUrl("/site-mock/mobile-designers/accept.svg");
const SITE_DESIGNERS_MOBILE_TRASH_ICON_URL = resolveSitePublicAssetUrl("/site-mock/mobile-designers/trash.svg");
const SITE_DESIGNERS_MOBILE_ARROW_ICON_URL = resolveSitePublicAssetUrl("/site-mock/mobile-designers/arrow.svg");

function isPointWithinRect(rect: DOMRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function SiteDesignersMobileDirectory({
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
  const actionsRef = useRef<HTMLDivElement>(null);
  const actionsBottomOffset = useSiteDesignersActionsOffset({
    baseBottomOffset: SITE_DESIGNERS_MOBILE_ACTIONS_BASE_BOTTOM,
    actionsRef,
    stopSelector: ".site-designers-mobile__designer",
    stopGap: 5,
  });
  const [activeLetter, setActiveLetter] = useState(groupedEntries[0]?.letter ?? null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const alphabetButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const isAlphabetDraggingRef = useRef(false);

  const {
    selectedDesignerIds,
    hasSelection,
    toggleDesigner,
    clearSelectedDesigners,
    buildAppliedSearchParams,
  } = useSiteDesignersSelection(searchParams);
  const alphabetAvailability = useMemo(() => new Set(groupedEntries.map((section) => section.letter)), [groupedEntries]);

  useEffect(() => {
    if (!activeLetter && groupedEntries[0]) {
      setActiveLetter(groupedEntries[0].letter);
    }
  }, [activeLetter, groupedEntries]);

  useEffect(() => {
    let frameId = 0;

    const updateActiveLetterFromScroll = () => {
      if (isAlphabetDraggingRef.current || groupedEntries.length === 0) {
        return;
      }

      let nextActiveLetter = groupedEntries[0].letter;

      for (const section of groupedEntries) {
        const element = sectionRefs.current.get(section.letter);
        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top <= SITE_DESIGNERS_MOBILE_SECTION_TOP_OFFSET + 1) {
          nextActiveLetter = section.letter;
          continue;
        }

        break;
      }

      setActiveLetter((current) => (current === nextActiveLetter ? current : nextActiveLetter));
    };

    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateActiveLetterFromScroll();
      });
    };

    updateActiveLetterFromScroll();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [groupedEntries]);

  useEffect(() => {
    const resolveLetterAtPoint = (clientX: number, clientY: number) => {
      for (const [letter, button] of alphabetButtonRefs.current.entries()) {
        if (!button || button.disabled) {
          continue;
        }

        if (isPointWithinRect(button.getBoundingClientRect(), clientX, clientY)) {
          return letter;
        }
      }

      return null;
    };

    const scrollToLetter = (letter: string) => {
      const target = sectionRefs.current.get(letter);
      if (!target) {
        return;
      }

      setActiveLetter((current) => (current === letter ? current : letter));
      window.scrollTo({
        top: buildDesignerLetterOffset(target, SITE_DESIGNERS_MOBILE_SECTION_TOP_OFFSET),
        behavior: "auto",
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isAlphabetDraggingRef.current) {
        return;
      }

      const letter = resolveLetterAtPoint(event.clientX, event.clientY);
      if (letter) {
        scrollToLetter(letter);
      }
    };

    const handlePointerUp = () => {
      isAlphabetDraggingRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  const activateLetter = (letter: string, behavior: ScrollBehavior) => {
    const target = sectionRefs.current.get(letter);
    if (!target) {
      return;
    }

    setActiveLetter(letter);
    window.scrollTo({
      top: buildDesignerLetterOffset(target, SITE_DESIGNERS_MOBILE_SECTION_TOP_OFFSET),
      behavior,
    });
  };

  return (
    <section className="site-designers-mobile" aria-label="Каталог дизайнеров">
      <div
        className="site-designers-mobile__alphabet"
        onPointerDown={(event) => {
          isAlphabetDraggingRef.current = true;
          const currentTarget = event.currentTarget;
          currentTarget.setPointerCapture?.(event.pointerId);

          for (const [letter, button] of alphabetButtonRefs.current.entries()) {
            if (!button || button.disabled) {
              continue;
            }

            if (isPointWithinRect(button.getBoundingClientRect(), event.clientX, event.clientY)) {
              activateLetter(letter, "auto");
              break;
            }
          }
        }}
      >
        {alphabet.map((letter) => {
          const isAvailable = alphabetAvailability.has(letter);
          const isActive = letter === activeLetter;

          return (
            <button
              key={letter}
              ref={(node) => {
                if (node) {
                  alphabetButtonRefs.current.set(letter, node);
                  return;
                }

                alphabetButtonRefs.current.delete(letter);
              }}
              type="button"
              className={
                isAvailable
                  ? isActive
                    ? "site-designers-mobile__alphabet-button site-designers-mobile__alphabet-button--active"
                    : "site-designers-mobile__alphabet-button"
                  : "site-designers-mobile__alphabet-button site-designers-mobile__alphabet-button--disabled"
              }
              disabled={!isAvailable}
              onClick={() => {
                if (!isAvailable) {
                  return;
                }

                activateLetter(letter, "smooth");
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="site-designers-mobile__sections">
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
            className="site-designers-mobile__section"
          >
            <h2 className="site-designers-mobile__letter">{section.letter}</h2>
            <ul className="site-designers-mobile__list">
              {section.entries.map((entry) => {
                const isSelected = selectedDesignerIds.includes(entry.id);

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={
                        isSelected
                          ? "site-designers-mobile__designer site-designers-mobile__designer--selected"
                          : "site-designers-mobile__designer"
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

      <div ref={actionsRef} className="site-designers-mobile__actions" style={{ bottom: `${actionsBottomOffset}px` }}>
        {mode === "catalog-filter" ? (
          <>
            <button
              type="button"
              className="site-designers-mobile__action-button"
              aria-label="Применить"
              onClick={() => onApply(buildAppliedSearchParams())}
            >
              <img className="site-designers-mobile__action-icon site-designers-mobile__action-icon--accept" src={SITE_DESIGNERS_MOBILE_ACCEPT_ICON_URL} alt="" />
            </button>
            <button
              type="button"
              className={
                hasSelection
                  ? "site-designers-mobile__action-button"
                  : "site-designers-mobile__action-button site-designers-mobile__action-button--disabled"
              }
              aria-label="Очистить"
              disabled={!hasSelection}
              onClick={() => {
                if (!hasSelection) {
                  return;
                }

                clearSelectedDesigners();
              }}
            >
              <img className="site-designers-mobile__action-icon site-designers-mobile__action-icon--trash" src={SITE_DESIGNERS_MOBILE_TRASH_ICON_URL} alt="" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          className="site-designers-mobile__action-button"
          aria-label="Наверх"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }}
        >
          <img className="site-designers-mobile__action-icon site-designers-mobile__action-icon--arrow" src={SITE_DESIGNERS_MOBILE_ARROW_ICON_URL} alt="" />
        </button>
      </div>
    </section>
  );
}
