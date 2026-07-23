import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { IconChevronLeft } from "../shared/mono-icons";
import type { ShowcaseDesignersDirectoryEntry, ShowcaseDesignersDirectoryResponse } from "./showcase-contracts";
import { fetchShowcaseDesignersDirectory } from "./showcase-api";
import "./admin-showcase-designers-page.css";

function readSelectedDesigners(searchParams: URLSearchParams) {
  const raw = String(searchParams.get("designer") || "").trim();
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildGroupedEntries(alphabet: readonly string[], entries: readonly ShowcaseDesignersDirectoryEntry[]) {
  const groups = new Map<string, ShowcaseDesignersDirectoryEntry[]>();
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
    .map((letter) => ({
      letter,
      entries: groups.get(letter) ?? [],
    }))
    .filter((group) => group.entries.length > 0);
}

type DesignersEntryMode = "browse" | "catalog-filter";

type DesignersNavigationState = {
  designersEntryMode?: DesignersEntryMode;
};

function resolveDesignersEntryMode(locationState: unknown, searchParams: URLSearchParams): DesignersEntryMode {
  if (locationState && typeof locationState === "object" && "designersEntryMode" in locationState) {
    const mode = (locationState as DesignersNavigationState).designersEntryMode;
    if (mode === "browse" || mode === "catalog-filter") {
      return mode;
    }
  }

  return searchParams.toString() === "" ? "browse" : "catalog-filter";
}

function buildSelectionSignature(ids: readonly string[]) {
  return [...ids].sort().join(",");
}

/** Varied column counts/widths so loading reads as real content, not a frozen block. */
const DESIGNERS_SKELETON_COLUMNS: ReadonlyArray<{ letter: string; widths: readonly number[] }> = [
  { letter: "A", widths: [72, 48, 86, 54, 64, 78] },
  { letter: "B", widths: [58, 82, 44, 70, 90, 52, 66] },
  { letter: "C", widths: [80, 46, 68, 55, 74] },
  { letter: "D", widths: [62, 88, 50, 76, 42, 70, 58, 84] },
  { letter: "E", widths: [54, 78, 66, 48, 90, 60] },
  { letter: "F", widths: [70, 44, 82, 56, 74, 48, 68] },
  { letter: "G", widths: [86, 52, 64, 78, 46] },
  { letter: "H", widths: [48, 72, 90, 58, 66, 80, 44] },
];

export function AdminShowcaseDesignersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entryMode = resolveDesignersEntryMode(location.state, searchParams);
  const [directory, setDirectory] = useState<ShowcaseDesignersDirectoryResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => readSelectedDesigners(searchParams));
  const alphabetCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let aborted = false;
    void (async () => {
      const response = await fetchShowcaseDesignersDirectory().catch(() => null);
      if (!aborted) {
        setDirectory(response);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    setSelectedIds(readSelectedDesigners(searchParams));
  }, [searchParams]);

  const alphabet = directory?.alphabet ?? [];
  const entries = directory?.entries ?? [];
  const groupedEntries = useMemo(() => buildGroupedEntries(alphabet, entries), [alphabet, entries]);
  const availableLetters = useMemo(() => new Set(groupedEntries.map((group) => group.letter)), [groupedEntries]);
  const appliedSelectedIds = useMemo(() => readSelectedDesigners(searchParams), [searchParams]);
  const hasSelection = selectedIds.length > 0;
  const hasPendingChanges = useMemo(
    () => buildSelectionSignature(selectedIds) !== buildSelectionSignature(appliedSelectedIds),
    [appliedSelectedIds, selectedIds],
  );

  const toggleDesigner = (designerId: string) => {
    if (entryMode === "browse") {
      const next = new URLSearchParams();
      next.set("designer", designerId);
      navigate({ pathname: "/catalog", search: `?${next.toString()}` });
      return;
    }

    setSelectedIds((current) => (current.includes(designerId) ? current.filter((item) => item !== designerId) : [...current, designerId]));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const applySelection = () => {
    const next = new URLSearchParams(searchParams);
    if (selectedIds.length > 0) {
      next.set("designer", selectedIds.join(","));
    } else {
      next.delete("designer");
    }
    const search = next.toString();
    navigate({
      pathname: "/catalog",
      search: search ? `?${search}` : "",
    });
  };

  const scrollToLetter = (letter: string) => {
    const target = document.getElementById(`designers-letter-${letter}`);
    if (!target) {
      return;
    }

    const alphabetCard = alphabetCardRef.current;
    const stickyOffset = alphabetCard
      ? parseFloat(window.getComputedStyle(alphabetCard).top || "0") + alphabetCard.getBoundingClientRect().height + 14
      : 180;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - stickyOffset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isDirectoryLoading = directory === null;

  return (
    <section className="designers-page" aria-label="Страница дизайнеров">
      <div ref={alphabetCardRef} className="designers-page__alphabet-card">
        <div className="designers-page__alphabet" aria-label="Алфавит дизайнеров">
          {isDirectoryLoading
            ? Array.from({ length: 27 }, (_, index) => (
                <span
                  key={`alphabet-skeleton-${index}`}
                  className={
                    index % 5 === 0
                      ? "designers-page__alphabet-btn designers-page__alphabet-skeleton designers-page__alphabet-skeleton--dim"
                      : "designers-page__alphabet-btn designers-page__alphabet-skeleton"
                  }
                  aria-hidden="true"
                />
              ))
            : alphabet.map((letter) => {
                const isAvailable = availableLetters.has(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    className={isAvailable ? "designers-page__alphabet-btn" : "designers-page__alphabet-btn designers-page__alphabet-btn--disabled"}
                    onClick={() => scrollToLetter(letter)}
                    disabled={!isAvailable}
                  >
                    {letter}
                  </button>
                );
              })}
        </div>
      </div>

      <div className="designers-page__directory-card">
        {isDirectoryLoading ? (
          <div className="designers-page__grid designers-page__grid--skeleton" aria-busy="true" aria-label="Загрузка дизайнеров">
            {DESIGNERS_SKELETON_COLUMNS.map((column) => (
              <section key={column.letter} className="designers-page__section designers-page__section--skeleton">
                <div className="designers-page__section-head">
                  <span className="designers-page__letter-skeleton" aria-hidden="true">
                    {column.letter}
                  </span>
                </div>
                <ul className="designers-page__list">
                  {column.widths.map((width, rowIndex) => (
                    <li key={`${column.letter}-row-${rowIndex}`}>
                      <div
                        className="designers-page__designer designers-page__designer--skeleton"
                        style={{ ["--designer-skeleton-width" as string]: `${width}%` }}
                        aria-hidden="true"
                      >
                        <span className="designers-page__designer-skeleton-bar" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="designers-page__grid" aria-live="polite">
            {groupedEntries.map((group) => (
              <section key={group.letter} id={`designers-letter-${group.letter}`} className="designers-page__section">
                <div className="designers-page__section-head">
                  <h2 className="designers-page__letter">{group.letter}</h2>
                </div>
                <ul className="designers-page__list">
                  {group.entries.map((entry) => {
                    const designerKey = entry.slug || entry.id;
                    const isSelected = selectedIds.includes(designerKey);
                    return (
                      <li key={designerKey}>
                        <button
                          type="button"
                          className={isSelected ? "designers-page__designer designers-page__designer--selected" : "designers-page__designer"}
                          onClick={() => toggleDesigner(designerKey)}
                          title={entry.label}
                        >
                          <span className="designers-page__designer-label">{entry.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="designers-page__actions-wrap">
        <div className="designers-page__actions">
          {entryMode === "catalog-filter" ? (
            <>
              <button
                type="button"
                className={hasPendingChanges ? "designers-page__action-btn designers-page__action-btn--primary" : "designers-page__action-btn"}
                onClick={applySelection}
                disabled={isDirectoryLoading}
              >
                ПРИМЕНИТЬ
              </button>
              <button
                type="button"
                className="designers-page__action-btn"
                onClick={clearSelection}
                disabled={!hasSelection || isDirectoryLoading}
              >
                ОЧИСТИТЬ
              </button>
            </>
          ) : null}
          <button type="button" className="designers-page__scroll-top" aria-label="Наверх" onClick={scrollToTop}>
            <IconChevronLeft className="designers-page__scroll-top-icon" />
          </button>
        </div>
      </div>
    </section>
  );
}
