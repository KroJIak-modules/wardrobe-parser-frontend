import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LatexBrand, renderBrandLatexHtml } from "../shared/latex-brand";
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

function normalizeDesignerLabel(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function buildSelectionSignature(ids: readonly string[]) {
  return [...ids].sort().join(",");
}

function TruncatedLatexBrand({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const fullLabel = normalizeDesignerLabel(value);
  const [displayLabel, setDisplayLabel] = useState(fullLabel);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return;
    }

    let frameId = 0;

    const measureFits = (candidate: string, maxWidth: number) => {
      measure.innerHTML = renderBrandLatexHtml(candidate);
      return measure.scrollWidth <= maxWidth;
    };

    const updateLabel = () => {
      const maxWidth = Math.floor(container.clientWidth);
      if (!maxWidth || !fullLabel) {
        setDisplayLabel(fullLabel);
        return;
      }

      if (measureFits(fullLabel, maxWidth)) {
        setDisplayLabel(fullLabel);
        return;
      }

      let low = 0;
      let high = fullLabel.length;

      while (low < high) {
        const mid = Math.floor((low + high + 1) / 2);
        const candidate = `${fullLabel.slice(0, mid).trimEnd()}...`;
        if (measureFits(candidate, maxWidth)) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      const nextLabel = low > 0 ? `${fullLabel.slice(0, low).trimEnd()}...` : "...";
      setDisplayLabel(nextLabel);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateLabel);
    };

    scheduleUpdate();

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(container);

    void document.fonts.ready.then(scheduleUpdate);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [fullLabel]);

  return (
    <>
      <span ref={containerRef} className="designers-page__designer-label-wrap">
        <LatexBrand value={displayLabel} className={className} />
      </span>
      <span ref={measureRef} className="latex-brand designers-page__designer-measure" aria-hidden="true" />
    </>
  );
}

export function AdminShowcaseDesignersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  return (
    <section className="designers-page" aria-label="Страница дизайнеров">
      <div ref={alphabetCardRef} className="designers-page__alphabet-card">
        <div className="designers-page__alphabet" aria-label="Алфавит дизайнеров">
          {alphabet.map((letter) => {
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
        <div className="designers-page__grid" aria-live="polite">
          {groupedEntries.map((group) => (
            <section key={group.letter} id={`designers-letter-${group.letter}`} className="designers-page__section">
              <div className="designers-page__section-head">
                <h2 className="designers-page__letter">{group.letter}</h2>
              </div>
              <ul className="designers-page__list">
                {group.entries.map((entry) => {
                  const isSelected = selectedIds.includes(entry.id);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={isSelected ? "designers-page__designer designers-page__designer--selected" : "designers-page__designer"}
                        onClick={() => toggleDesigner(entry.id)}
                        title={entry.label}
                      >
                        <TruncatedLatexBrand value={entry.label} className="designers-page__designer-label" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="designers-page__actions-wrap">
        <div className="designers-page__actions">
          <button
            type="button"
            className={hasPendingChanges ? "designers-page__action-btn designers-page__action-btn--primary" : "designers-page__action-btn"}
            onClick={applySelection}
          >
            ПРИМЕНИТЬ
          </button>
          <button
            type="button"
            className="designers-page__action-btn"
            onClick={clearSelection}
            disabled={!hasSelection}
          >
            ОЧИСТИТЬ
          </button>
          <button type="button" className="designers-page__scroll-top" aria-label="Наверх" onClick={scrollToTop}>
            <IconChevronLeft className="designers-page__scroll-top-icon" />
          </button>
        </div>
      </div>
    </section>
  );
}
