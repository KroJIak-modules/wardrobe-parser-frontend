import { useEffect, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import type { CatalogExperienceResponse, CatalogFilterGroup, CatalogFilterOption, CatalogViewKey } from "./showcase-contracts";
import { fetchCatalogExperience, readCatalogExperienceSeed } from "./showcase-mock-api";
import { clearGroupSelection, getGroupSelection, toggleGroupOption } from "./showcase-url-state";
import "./admin-showcase-catalog-page.css";

function getTriggerLabel(group: CatalogFilterGroup, selectedValues: readonly string[]) {
  if (group.selectionMode === "single" && selectedValues.length > 0) {
    return (group.options.find((option) => option.value === selectedValues[0])?.label ?? group.label).toUpperCase();
  }

  return group.label.toUpperCase();
}

function ShowcaseFilterFlyout({
  group,
  selectedValues,
  onToggle,
  onReset,
}: {
  group: CatalogFilterGroup;
  selectedValues: readonly string[];
  onToggle: (option: CatalogFilterOption) => void;
  onReset: () => void;
}) {
  const hasSelection = selectedValues.length > 0;
  const panelClassName =
    group.panelWidth === "wide" ? "showcase-filters__panel showcase-filters__panel--wide" : "showcase-filters__panel";
  const flyoutClassName =
    group.panelWidth === "wide" ? "showcase-filters__flyout showcase-filters__flyout--wide" : "showcase-filters__flyout";
  const selectedSet = new Set(selectedValues);
  const orderedOptions =
    group.prioritizeSelected && selectedSet.size > 0
      ? [...group.options.filter((option) => selectedSet.has(option.value)), ...group.options.filter((option) => !selectedSet.has(option.value))]
      : group.options;
  const shouldScroll = Boolean(group.maxVisibleOptions && orderedOptions.length > group.maxVisibleOptions);
  const listClassName = shouldScroll ? "showcase-filters__list showcase-filters__list--scrollable" : "showcase-filters__list";
  const listStyle = shouldScroll
    ? ({
        "--showcase-filter-visible-options": String(group.maxVisibleOptions),
      } as CSSProperties)
    : undefined;

  return (
    <div className={flyoutClassName}>
      <div className={panelClassName}>
        {orderedOptions.length > 0 ? (
          <ul className={listClassName} style={listStyle}>
            {orderedOptions.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={isSelected ? "showcase-filters__item showcase-filters__item--selected" : "showcase-filters__item"}
                    onClick={() => onToggle(option)}
                  >
                    <span>{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {hasSelection ? (
        <button type="button" className="showcase-filters__reset" onClick={onReset}>
          Сбросить все
        </button>
      ) : null}
    </div>
  );
}

export function AdminShowcaseCatalogPage({ viewKey }: { viewKey: CatalogViewKey }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experience, setExperience] = useState<CatalogExperienceResponse | null>(() =>
    readCatalogExperienceSeed({ viewKey, searchParams })
  );
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExperience(readCatalogExperienceSeed({ viewKey, searchParams }));
    void (async () => {
      const response = await fetchCatalogExperience({ viewKey, searchParams });
      if (!cancelled) {
        setExperience(response);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, viewKey]);

  const filterGroups = experience?.filterGroups ?? [];

  return (
    <section className="showcase-catalog-page" aria-label="Страница листинга витрины">
      {experience ? (
        <>
          <header className="showcase-catalog-page__header">
            <h1 className="showcase-catalog-page__title">{experience.view.header.title}</h1>
            {experience.view.header.description ? (
              <p className="showcase-catalog-page__description">{experience.view.header.description}</p>
            ) : null}
          </header>

          <div className="showcase-filters" onMouseLeave={() => setActiveGroupKey(null)}>
            {filterGroups.map((group) => {
              const isActive = activeGroupKey === group.key;
              const selectedValues = getGroupSelection(searchParams, group);
              const triggerLabel = getTriggerLabel(group, selectedValues);
              const shouldShowCount = group.selectionMode === "multiple" && selectedValues.length > 0;

              return (
                <section
                  key={group.key}
                  className="showcase-filters__group"
                  onMouseEnter={() => setActiveGroupKey(group.key)}
                  onFocus={() => setActiveGroupKey(group.key)}
                >
                  <button
                    type="button"
                    className={isActive ? "showcase-filters__trigger showcase-filters__trigger--active" : "showcase-filters__trigger"}
                    aria-expanded={isActive}
                  >
                    <span>{triggerLabel}</span>
                    {shouldShowCount ? (
                      <span className="showcase-filters__trigger-note">
                        ({selectedValues.length})
                      </span>
                    ) : null}
                  </button>
                  <div className="showcase-filters__safe-zone" aria-hidden="true" />
                  {isActive ? (
                    <ShowcaseFilterFlyout
                      group={group}
                      selectedValues={selectedValues}
                      onToggle={(option) => setSearchParams(toggleGroupOption(searchParams, group, option.value))}
                      onReset={() => setSearchParams(clearGroupSelection(searchParams, group))}
                    />
                  ) : null}
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <div className="showcase-catalog-page__loading" aria-hidden="true" />
      )}
    </section>
  );
}
