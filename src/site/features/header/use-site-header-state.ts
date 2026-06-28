import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSiteHeaderDropdownMenu } from "./site-header-dropdown-content";
import type { IndicatorState } from "./site-header-contracts";

const EMPTY_INDICATOR: IndicatorState = { left: 0, width: 0, opacity: 0 };
const MENU_INDICATOR_SIDE_PADDING = 10;
const ACTION_INDICATOR_SIDE_PADDING = 7;
const ACTIONS_SIDE_INSET = 18;
const SEARCH_ICON_LEFT = 161;
const SEARCH_ICON_WIDTH = 23;
const SEARCH_ICON_TO_SEARCH_HOVER_GAP = 10;

function normalizeSearchSubmitValue(value: string) {
  return value.trim();
}

export function useSiteHeaderState({
  actionItemsCount,
  allowEmptySearchSubmit,
  isSearchInteractive,
  locationKey,
  onSearchSubmit,
  searchValue,
}: {
  actionItemsCount: number;
  allowEmptySearchSubmit: boolean;
  isSearchInteractive: boolean;
  locationKey: string;
  onSearchSubmit?: (value: string) => void;
  searchValue: string;
}) {
  const menuRowRef = useRef<HTMLDivElement | null>(null);
  const actionsRowRef = useRef<HTMLDivElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const actionItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSearchHoverFrameRef = useRef<number | null>(null);
  const lastLocationRef = useRef(locationKey);
  const shouldSyncCollapsedSearchRef = useRef(false);
  const [hoveredMenuIndex, setHoveredMenuIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(searchValue.trim() !== "");
  const [hoveredActionIndex, setHoveredActionIndex] = useState<number | null>(null);
  const [menuIndicator, setMenuIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);
  const [actionIndicator, setActionIndicator] = useState<IndicatorState>(EMPTY_INDICATOR);
  const [actionsRowWidth, setActionsRowWidth] = useState(144);
  const [collapsedActionsWidth, setCollapsedActionsWidth] = useState(180);
  const [isActionsTransitionReady, setIsActionsTransitionReady] = useState(false);

  const expandedActionsWidth =
    actionsRowWidth +
    ACTIONS_SIDE_INSET +
    SEARCH_ICON_LEFT +
    SEARCH_ICON_WIDTH +
    SEARCH_ICON_TO_SEARCH_HOVER_GAP +
    ACTION_INDICATOR_SIDE_PADDING;
  const actionsWidth = isSearchExpanded ? Math.max(expandedActionsWidth, collapsedActionsWidth) : collapsedActionsWidth;

  const syncCollapsedActionsWidth = useCallback(() => {
    const nextRowWidth = actionsRowRef.current?.getBoundingClientRect().width ?? 0;
    const nextWidth = nextRowWidth + ACTIONS_SIDE_INSET * 2;
    setActionsRowWidth((currentWidth) => (currentWidth === nextRowWidth ? currentWidth : nextRowWidth));
    setCollapsedActionsWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const syncIndicator = useCallback(
    (
      itemRefs: Array<HTMLButtonElement | null>,
      labelRefs: Array<HTMLSpanElement | null>,
      index: number | null,
      sidePadding: number,
      setter: (value: IndicatorState) => void,
    ) => {
      if (index === null) {
        setter(EMPTY_INDICATOR);
        return;
      }

      const target = itemRefs[index];
      if (!target) {
        setter(EMPTY_INDICATOR);
        return;
      }

      const label = labelRefs[index];
      const labelWidth = label?.offsetWidth ?? target.offsetWidth;
      const labelLeft = label?.offsetLeft ?? 0;
      const desiredWidth = Math.ceil(labelWidth + sidePadding * 2);
      const centeredLeft = target.offsetLeft + labelLeft + labelWidth / 2 - desiredWidth / 2;
      setter({
        left: centeredLeft,
        width: desiredWidth,
        opacity: 1,
      });
    },
    [],
  );

  const syncActionIndicator = useCallback(
    (index: number | null) => {
      syncIndicator(
        actionItemRefs.current,
        actionLabelRefs.current,
        index,
        ACTION_INDICATOR_SIDE_PADDING,
        setActionIndicator,
      );
    },
    [syncIndicator],
  );

  useLayoutEffect(() => {
    syncIndicator(
      menuItemRefs.current,
      menuLabelRefs.current,
      hoveredMenuIndex,
      MENU_INDICATOR_SIDE_PADDING,
      setMenuIndicator,
    );
  }, [hoveredMenuIndex, syncIndicator]);

  useLayoutEffect(() => {
    syncActionIndicator(hoveredActionIndex);
  }, [hoveredActionIndex, isSearchExpanded, syncActionIndicator]);

  useLayoutEffect(() => {
    syncCollapsedActionsWidth();
  }, [actionItemsCount, syncCollapsedActionsWidth]);

  useEffect(() => {
    const target = actionsRowRef.current;
    if (!target || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncCollapsedActionsWidth();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [syncCollapsedActionsWidth]);

  useEffect(() => {
    let isCancelled = false;

    const markReady = () => {
      syncCollapsedActionsWidth();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!isCancelled) {
            setIsActionsTransitionReady(true);
          }
        });
      });
    };

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(markReady).catch(markReady);
    } else {
      markReady();
    }

    return () => {
      isCancelled = true;
    };
  }, [syncCollapsedActionsWidth]);

  useEffect(() => {
    const handleResize = () => {
      syncIndicator(
        menuItemRefs.current,
        menuLabelRefs.current,
        hoveredMenuIndex,
        MENU_INDICATOR_SIDE_PADDING,
        setMenuIndicator,
      );
      syncActionIndicator(hoveredActionIndex);
      syncCollapsedActionsWidth();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredActionIndex, hoveredMenuIndex, syncActionIndicator, syncCollapsedActionsWidth, syncIndicator]);

  useEffect(() => {
    if (searchValue.trim() !== "") {
      setIsSearchExpanded(true);
    }
  }, [searchValue]);

  useEffect(() => {
    if (lastLocationRef.current === locationKey) {
      return;
    }

    lastLocationRef.current = locationKey;
    shouldSyncCollapsedSearchRef.current = true;
  }, [locationKey]);

  useEffect(() => {
    if (!shouldSyncCollapsedSearchRef.current) {
      return;
    }

    shouldSyncCollapsedSearchRef.current = false;
    if (searchValue.trim() !== "") {
      return;
    }

    setHoveredActionIndex((current) => (current === 0 ? null : current));
    setIsSearchExpanded(false);
  }, [searchValue]);

  const handleSearchSubmit = useCallback(() => {
    const normalizedValue = normalizeSearchSubmitValue(searchValue);
    if (normalizedValue === "" && !allowEmptySearchSubmit) {
      return;
    }

    onSearchSubmit?.(normalizedValue);
  }, [allowEmptySearchSubmit, onSearchSubmit, searchValue]);

  const collapseSearchIfEmpty = useCallback(() => {
    if (document.activeElement === searchInputRef.current || searchValue.trim() !== "") {
      return;
    }

    setIsSearchExpanded(false);
  }, [searchValue]);

  const expandSearch = useCallback(() => {
    setIsSearchExpanded(true);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const activateSearchHover = useCallback(() => {
    if (pendingSearchHoverFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingSearchHoverFrameRef.current);
      pendingSearchHoverFrameRef.current = null;
    }

    if (isSearchExpanded) {
      setHoveredActionIndex(0);
      return;
    }

    setHoveredActionIndex(null);
    setIsSearchExpanded(true);
    pendingSearchHoverFrameRef.current = window.requestAnimationFrame(() => {
      setHoveredActionIndex(0);
      pendingSearchHoverFrameRef.current = null;
    });
  }, [isSearchExpanded]);

  useEffect(() => {
    return () => {
      if (pendingSearchHoverFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingSearchHoverFrameRef.current);
      }
    };
  }, []);

  const handleMenuHover = useCallback((index: number, label: string) => {
    const nextMenu = getSiteHeaderDropdownMenu(label);
    setHoveredMenuIndex(index);
    setOpenMenuIndex(nextMenu ? index : null);
  }, []);

  const handleMenuActivate = useCallback((index: number, label: string) => {
    setHoveredMenuIndex(index);
    const nextMenu = getSiteHeaderDropdownMenu(label);
    setOpenMenuIndex(nextMenu ? index : null);
    return Boolean(nextMenu);
  }, []);

  const resetMenuState = useCallback(() => {
    setHoveredMenuIndex(null);
    setOpenMenuIndex(null);
  }, []);

  const clearHoveredAction = useCallback(() => {
    setHoveredActionIndex(null);
  }, []);

  const handleActionHover = useCallback(
    (index: number) => {
      if (index === 0) {
        activateSearchHover();
        return;
      }

      setHoveredActionIndex(index);
      collapseSearchIfEmpty();
    },
    [activateSearchHover, collapseSearchIfEmpty],
  );

  const handleActionBlur = useCallback(() => {
    setHoveredActionIndex(null);
    collapseSearchIfEmpty();
  }, [collapseSearchIfEmpty]);

  return {
    actionIndicator,
    actionItemRefs,
    actionLabelRefs,
    actionsRowRef,
    actionsWidth,
    activateSearchHover,
    clearHoveredAction,
    collapseSearchIfEmpty,
    expandSearch,
    handleActionBlur,
    handleActionHover,
    handleMenuActivate,
    handleMenuHover,
    handleSearchSubmit,
    hoveredActionIndex,
    hoveredMenuIndex,
    isActionsTransitionReady,
    isSearchExpanded,
    menuIndicator,
    menuItemRefs,
    menuLabelRefs,
    menuRowRef,
    openMenuIndex,
    resetMenuState,
    searchInputRef,
    setHoveredActionIndex,
    setOpenMenuIndex,
    isSearchInteractive,
  };
}
