import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSiteDesignersLocationState } from "../designers/site-designers-navigation";
import { SiteMobileDrawerShell } from "../shared/site-mobile-drawer-shell";
import { useSitePageScrollLock } from "../shared/use-site-page-scroll-lock";
import { SiteWindowCloseButton } from "../window-shell/site-window-shell";
import type { SiteCatalogFilterGroup, SiteCatalogFilterOption } from "./site-catalog-contracts";
import { SHOW_ALL_DESIGNERS_VALUE } from "./site-catalog-filter-constants";
import { getOrderedCatalogFilterOptions } from "./site-catalog-filter-options";
import { getCatalogSelectedValues, getCatalogTriggerLabel, toggleCatalogGroupOption } from "./site-catalog-logic";
import { patchCatalogSearchParams } from "./site-catalog-query";
import "./site-catalog-mobile-filters-drawer.css";

const FILTER_GROUP_ORDER = ["availability", "section", "designer", "gender"] as const;
const FILTER_DRAWER_CLEARABLE_KEYS = new Set(FILTER_GROUP_ORDER);

function PlusIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={
        isOpen
          ? "site-catalog-mobile-filters-drawer__group-icon site-catalog-mobile-filters-drawer__group-icon--open"
          : "site-catalog-mobile-filters-drawer__group-icon"
      }
      viewBox="0 0 14 14"
      fill="none"
    >
      <path
        d="M7 2V12"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        className="site-catalog-mobile-filters-drawer__group-icon-vertical"
      />
      <path d="M2 7H12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function getOrderedFilterGroups(filterGroups: readonly SiteCatalogFilterGroup[]) {
  const order = new Map(FILTER_GROUP_ORDER.map((key, index) => [key, index]));

  return [...filterGroups].sort((left, right) => {
    const leftOrder = order.get(left.key) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.key) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

function hasSelectedClearableFilters(searchParams: URLSearchParams, filterGroups: readonly SiteCatalogFilterGroup[]) {
  return filterGroups.some((group) => FILTER_DRAWER_CLEARABLE_KEYS.has(group.key) && getCatalogSelectedValues(searchParams, group).length > 0);
}

function buildClearedSearchParams(searchParams: URLSearchParams, filterGroups: readonly SiteCatalogFilterGroup[]) {
  const patch: Record<string, null> = { page: null };

  filterGroups.forEach((group) => {
    if (!FILTER_DRAWER_CLEARABLE_KEYS.has(group.key)) {
      return;
    }

    patch[group.queryParam] = null;
  });

  patch.multi = null;

  return patchCatalogSearchParams(searchParams, patch);
}

export type SiteCatalogMobileFiltersDrawerHandle = {
  applyAndClose: () => void;
};

export const SiteCatalogMobileFiltersDrawer = forwardRef<
  SiteCatalogMobileFiltersDrawerHandle,
  {
    filterGroups: readonly SiteCatalogFilterGroup[];
    searchParams: URLSearchParams;
    isClosing: boolean;
    onApply: (next: URLSearchParams) => void;
    onClose: () => void;
    onCloseAnimationEnd: () => void;
  }
>(function SiteCatalogMobileFiltersDrawer({
  filterGroups,
  searchParams,
  isClosing,
  onApply,
  onClose,
  onCloseAnimationEnd,
}, ref) {
  const navigate = useNavigate();
  const orderedGroups = useMemo(() => getOrderedFilterGroups(filterGroups), [filterGroups]);
  const [draftSearchParams, setDraftSearchParams] = useState(() => new URLSearchParams(searchParams));
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const [openOptionsMaxHeight, setOpenOptionsMaxHeight] = useState<number | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const groupsRef = useRef<HTMLDivElement | null>(null);
  const activeOptionsRef = useRef<HTMLDivElement | null>(null);
  useSitePageScrollLock(true);

  useEffect(() => {
    setDraftSearchParams(new URLSearchParams(searchParams));
    setOpenGroupKey(null);
  }, [searchParams]);

  useLayoutEffect(() => {
    if (!openGroupKey || !actionsRef.current || !activeOptionsRef.current || !groupsRef.current) {
      setOpenOptionsMaxHeight(null);
      return;
    }

    let frameId = 0;
    const optionsElement = activeOptionsRef.current;
    const actionsElement = actionsRef.current;
    const groupsElement = groupsRef.current;

    const updateMaxHeight = () => {
      const groupsRect = groupsElement.getBoundingClientRect();
      const actionsRect = actionsElement.getBoundingClientRect();
      const naturalGroupsBottom =
        groupsRect.bottom + Math.max(0, optionsElement.scrollHeight - optionsElement.clientHeight);
      const limitBottom = actionsRect.top - 50;
      const overflow = Math.ceil(naturalGroupsBottom - limitBottom);
      const nextMaxHeight =
        overflow > 0 ? Math.max(0, Math.floor(optionsElement.scrollHeight - overflow)) : null;

      setOpenOptionsMaxHeight((current) => (current === nextMaxHeight ? current : nextMaxHeight));
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateMaxHeight);
    };

    updateMaxHeight();

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(optionsElement);
    resizeObserver.observe(actionsElement);
    resizeObserver.observe(groupsElement);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [draftSearchParams, openGroupKey, orderedGroups]);

  const hasSelectionsToClear = useMemo(
    () => hasSelectedClearableFilters(draftSearchParams, orderedGroups),
    [draftSearchParams, orderedGroups],
  );

  const applyDraftAndClose = () => {
    const nextSearchParams = patchCatalogSearchParams(draftSearchParams, { page: null });

    if (nextSearchParams.toString() === searchParams.toString()) {
      onClose();
      return;
    }

    onApply(nextSearchParams);
  };

  useImperativeHandle(
    ref,
    () => ({
      applyAndClose: applyDraftAndClose,
    }),
    [draftSearchParams, onApply, onClose, searchParams],
  );

  const toggleOption = (group: SiteCatalogFilterGroup, option: SiteCatalogFilterOption) => {
    if (group.key === "designer" && option.value === SHOW_ALL_DESIGNERS_VALUE) {
      onClose();
      navigate(
        {
          pathname: "/designers",
          search: draftSearchParams.toString() ? `?${draftSearchParams.toString()}` : "",
        },
        {
          state: createSiteDesignersLocationState("catalog-filter"),
        },
      );
      return;
    }

    setDraftSearchParams((current) =>
      patchCatalogSearchParams(toggleCatalogGroupOption(current, group, option.value), {
        page: null,
      }),
    );
  };

  return (
    <SiteMobileDrawerShell
      ariaLabel="Фильтры каталога"
      className="site-catalog-mobile-filters-drawer"
      isClosing={isClosing}
      onClose={applyDraftAndClose}
      onCloseAnimationEnd={onCloseAnimationEnd}
    >
      <div className="site-catalog-mobile-filters-drawer__header">
        <p className="site-catalog-mobile-filters-drawer__title">ФИЛЬТРЫ</p>
        <SiteWindowCloseButton
          className="site-catalog-mobile-filters-drawer__close"
          ariaLabel="Закрыть фильтры"
          onClick={applyDraftAndClose}
          iconSrc="/site-mock/mobile-catalog/filters-close-icon.svg"
          rotateIcon={false}
        />
      </div>

      <div className="site-catalog-mobile-filters-drawer__body">
        <div ref={groupsRef} className="site-catalog-mobile-filters-drawer__groups">
          {orderedGroups.map((group) => {
            const isOpen = openGroupKey === group.key;
            const selectedValues = getCatalogSelectedValues(draftSearchParams, group);
            const triggerLabel = getCatalogTriggerLabel(draftSearchParams, group, selectedValues);
            const orderedOptions = getOrderedCatalogFilterOptions(group, selectedValues);

            return (
              <section
                key={group.key}
                className={
                  isOpen
                    ? "site-catalog-mobile-filters-drawer__group site-catalog-mobile-filters-drawer__group--open"
                    : "site-catalog-mobile-filters-drawer__group"
                }
              >
                <button
                  type="button"
                  className="site-catalog-mobile-filters-drawer__group-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroupKey((current) => (current === group.key ? null : group.key))}
                >
                  <span className="site-catalog-mobile-filters-drawer__group-label">{triggerLabel}</span>
                  <PlusIcon isOpen={isOpen} />
                </button>

                {isOpen ? (
                  <div
                    ref={activeOptionsRef}
                    className={
                      openOptionsMaxHeight !== null
                        ? "site-catalog-mobile-filters-drawer__options site-catalog-mobile-filters-drawer__options--scrollable"
                        : "site-catalog-mobile-filters-drawer__options"
                    }
                    aria-label={group.label}
                    style={openOptionsMaxHeight !== null ? { maxHeight: `${openOptionsMaxHeight}px` } : undefined}
                  >
                    {orderedOptions.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      const isStrongAction = option.value === SHOW_ALL_DESIGNERS_VALUE;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={
                            isSelected
                              ? "site-catalog-mobile-filters-drawer__option site-catalog-mobile-filters-drawer__option--selected"
                              : isStrongAction || option.keepAtBottom
                                ? "site-catalog-mobile-filters-drawer__option site-catalog-mobile-filters-drawer__option--strong"
                                : "site-catalog-mobile-filters-drawer__option"
                          }
                          onClick={() => toggleOption(group, option)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <div ref={actionsRef} className="site-catalog-mobile-filters-drawer__actions">
        <button
          type="button"
          className="site-catalog-mobile-filters-drawer__apply"
          onClick={applyDraftAndClose}
        >
          ПРИМЕНИТЬ
        </button>
        <button
          type="button"
          className="site-catalog-mobile-filters-drawer__clear"
          disabled={!hasSelectionsToClear}
          onClick={() => {
            setDraftSearchParams((current) => buildClearedSearchParams(current, orderedGroups));
            setOpenGroupKey(null);
          }}
        >
          ОЧИСТИТЬ
        </button>
      </div>
    </SiteMobileDrawerShell>
  );
});
