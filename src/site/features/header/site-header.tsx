import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { storefrontHomeState } from "../../app/site-home-entry";
import { prepareSiteCatalogFilterNavigation } from "../catalog/site-catalog-navigation";
import type { SiteDesignersLocationState } from "../designers/site-designers-navigation";
import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import type { SiteHeaderProps } from "./site-header-contracts";
import { SiteHeaderActions } from "./site-header-actions";
import { SiteHeaderLogo } from "./site-header-logo";
import { SiteHeaderMenu } from "./site-header-menu";
import { useSiteHeaderState } from "./use-site-header-state";
import "./site-header.css";

export function SiteHeader({
  theme,
  menuItems,
  dropdownMenus,
  actionItems,
  mode = "fixed",
  onLogoActivate,
  searchValue = "",
  allowEmptySearchSubmit = false,
  onSearchValueChange,
  onSearchSubmit,
}: SiteHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSearchInteractive = typeof onSearchValueChange === "function" || typeof onSearchSubmit === "function";
  const dropdownMenuLabels = new Set(Object.keys(dropdownMenus ?? {}));
  const {
    actionIndicator,
    actionItemRefs,
    actionLabelRefs,
    actionsRowRef,
    actionsWidth,
    clearHoveredAction,
    collapseSearchIfEmpty,
    expandSearch,
    handleActionBlur,
    handleActionHover,
    handleMenuActivate: syncMenuActivation,
    handleMenuHover,
    handleSearchSubmit,
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
  } = useSiteHeaderState({
    actionItemsCount: actionItems.length,
    allowEmptySearchSubmit,
    dropdownMenuLabels,
    isSearchInteractive,
    locationKey: `${location.pathname}${location.search}`,
    onSearchSubmit,
    searchValue,
  });

  const handleLogoActivate = useCallback(() => {
    if (onLogoActivate) {
      onLogoActivate();
      return;
    }

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate("/", { state: storefrontHomeState() });
  }, [location.pathname, navigate, onLogoActivate]);

  const navigateFromDropdown = useCallback(
    (to: string, navigationState?: SiteDesignersLocationState) => {
      resetMenuState();
      const destination = prepareSiteCatalogFilterNavigation(to, navigationState);
      navigate(destination.to, destination.state ? { state: destination.state } : undefined);
    },
    [navigate, resetMenuState],
  );

  const handleMenuActivate = useCallback(
    (index: number, item: SiteNavItem) => {
      const hasDropdown = syncMenuActivation(index, item.label);
      if (!hasDropdown && item.to) {
        const destination = prepareSiteCatalogFilterNavigation(item.to);
        navigate(destination.to, destination.state ? { state: destination.state } : undefined);
      }
    },
    [navigate, syncMenuActivation],
  );

  const handleActionActivate = useCallback(
    (index: number, item: SiteNavItem) => {
      if (index === 0 && isSearchInteractive) {
        if (!isSearchExpanded) {
          expandSearch();
          return;
        }

        handleSearchSubmit();
        return;
      }

      if (item.to) {
        const destination = prepareSiteCatalogFilterNavigation(item.to);
        navigate(destination.to, destination.state ? { state: destination.state } : undefined);
      }
    },
    [expandSearch, handleSearchSubmit, isSearchExpanded, isSearchInteractive, navigate],
  );

  return (
    <>
      {mode === "fixed" ? <SiteHeaderLogo onActivate={handleLogoActivate} /> : null}
      <header className={`site-header site-header--${theme} site-header--${mode}`}>
        {mode === "preview" ? <SiteHeaderLogo onActivate={handleLogoActivate} /> : null}
        <SiteHeaderMenu
          menuItems={menuItems}
          dropdownMenus={dropdownMenus}
          menuRowRef={menuRowRef}
          menuItemRefs={menuItemRefs}
          menuLabelRefs={menuLabelRefs}
          menuIndicator={menuIndicator}
          hoveredMenuIndex={hoveredMenuIndex}
          openMenuIndex={openMenuIndex}
          onMenuLeave={resetMenuState}
          onMenuHover={handleMenuHover}
          onMenuActivate={handleMenuActivate}
          onNavigateFromDropdown={navigateFromDropdown}
        />

        <SiteHeaderActions
          actionItems={actionItems}
          searchValue={searchValue}
          isSearchExpanded={isSearchExpanded}
          isActionsTransitionReady={isActionsTransitionReady}
          actionsWidth={actionsWidth}
          actionIndicator={actionIndicator}
          searchInputRef={searchInputRef}
          actionsRowRef={actionsRowRef}
          actionItemRefs={actionItemRefs}
          actionLabelRefs={actionLabelRefs}
          isSearchInteractive={isSearchInteractive}
          onSearchValueChange={onSearchValueChange}
          onSearchSubmit={handleSearchSubmit}
          onActionsLeave={() => {
            clearHoveredAction();
            collapseSearchIfEmpty();
          }}
          onActionHover={handleActionHover}
          onActionFocus={handleActionHover}
          onActionActivate={handleActionActivate}
          onActionBlur={handleActionBlur}
        />
      </header>
    </>
  );
}
