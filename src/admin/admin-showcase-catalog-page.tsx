import { useEffect, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, BadgeCheck, Clock3 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { CatalogFilterGroup, CatalogFilterOption, CatalogViewKey, ShowcaseIconToken } from "./showcase-contracts";
import { fetchCatalogExperience, readCatalogExperienceSeed } from "./showcase-mock-api";
import { clearGroupSelection, getGroupSelection, toggleGroupOption } from "./showcase-url-state";
import "./admin-showcase-catalog-page.css";

const ICON_BY_TOKEN = {
  "sort-desc": ArrowDownWideNarrow,
  "sort-asc": ArrowUpNarrowWide,
  preorder: Clock3,
  "in-stock": BadgeCheck,
} as const satisfies Record<ShowcaseIconToken, typeof ArrowDownWideNarrow>;

function getIndicator(group: CatalogFilterGroup, selectedValues: readonly string[]) {
  if (selectedValues.length === 0) {
    return null;
  }

  if (group.indicatorMode === "count") {
    return { text: String(selectedValues.length) };
  }

  if (group.indicatorMode === "gender_short") {
    return { text: selectedValues[0] === "women" ? "Ж" : "М" };
  }

  const selectedOption = group.options.find((option) => option.value === selectedValues[0]);
  if (!selectedOption?.icon) {
    return null;
  }

  return { icon: selectedOption.icon };
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

  return (
    <div className="showcase-filters__flyout">
      <div className={panelClassName}>
        {group.options.length > 0 ? (
          <ul className="showcase-filters__list">
            {group.options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const Icon = option.icon ? ICON_BY_TOKEN[option.icon] : null;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={isSelected ? "showcase-filters__item showcase-filters__item--selected" : "showcase-filters__item"}
                    onClick={() => onToggle(option)}
                  >
                    {Icon ? <Icon size={12} className="showcase-filters__item-icon" aria-hidden="true" /> : null}
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
  const [experience, setExperience] = useState<CatalogExperienceResponse | null>(() => readCatalogExperienceSeed(viewKey));
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExperience(readCatalogExperienceSeed(viewKey));
    void (async () => {
      const response = await fetchCatalogExperience(viewKey);
      if (!cancelled) {
        setExperience(response);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewKey]);

  const filterGroups = experience?.filterGroups ?? [];

  return (
    <section className="showcase-catalog-page" aria-label="Страница листинга витрины">
      {experience ? (
        <div className="showcase-filters" onMouseLeave={() => setActiveGroupKey(null)}>
          {filterGroups.map((group) => {
            const isActive = activeGroupKey === group.key;
            const selectedValues = getGroupSelection(searchParams, group);
            const indicator = getIndicator(group, selectedValues);
            const IndicatorIcon = indicator?.icon ? ICON_BY_TOKEN[indicator.icon] : null;

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
                  <span>{group.label}</span>
                  {indicator ? (
                    <span className="showcase-filters__trigger-note">
                      (
                      {IndicatorIcon ? <IndicatorIcon size={11} className="showcase-filters__trigger-note-icon" aria-hidden="true" /> : indicator.text}
                      )
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
      ) : (
        <div className="showcase-catalog-page__loading" aria-hidden="true" />
      )}
    </section>
  );
}
