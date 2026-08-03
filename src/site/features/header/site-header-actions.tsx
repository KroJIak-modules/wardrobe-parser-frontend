import type { MutableRefObject } from "react";
import type { SiteNavItem } from "../storefront/site-storefront-contracts";
import type { IndicatorState } from "./site-header-contracts";
import { useSiteCart } from "../../runtime/use-site-cart";
import { SiteHeaderCartIcon, SiteHeaderSearchIcon } from "./site-header-logo";

export function SiteHeaderActions({
  actionItems,
  searchValue,
  isSearchExpanded,
  isActionsTransitionReady,
  actionsWidth,
  actionIndicator,
  searchInputRef,
  actionsRowRef,
  actionItemRefs,
  actionLabelRefs,
  isSearchInteractive,
  onSearchValueChange,
  onSearchSubmit,
  onActionsLeave,
  onActionHover,
  onActionFocus,
  onActionActivate,
  onActionBlur,
}: {
  actionItems: SiteNavItem[];
  searchValue: string;
  isSearchExpanded: boolean;
  isActionsTransitionReady: boolean;
  actionsWidth: number;
  actionIndicator: IndicatorState;
  searchInputRef: MutableRefObject<HTMLInputElement | null>;
  actionsRowRef: MutableRefObject<HTMLDivElement | null>;
  actionItemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  actionLabelRefs: MutableRefObject<Array<HTMLSpanElement | null>>;
  isSearchInteractive: boolean;
  onSearchValueChange?: (value: string) => void;
  onSearchSubmit: () => void;
  onActionsLeave: () => void;
  onActionHover: (index: number) => void;
  onActionFocus: (index: number) => void;
  onActionActivate: (index: number, item: SiteNavItem) => void;
  onActionBlur: () => void;
}) {
  const { totalItems } = useSiteCart();
  const cartCountLabel = totalItems >= 10 ? "9+" : `${totalItems}`;
  const hasCartCount = totalItems > 0;

  return (
    <div
      className={`site-header__actions${isSearchExpanded ? " site-header__actions--expanded" : ""}${isActionsTransitionReady ? " site-header__actions--ready" : ""}`}
      style={{ width: `${actionsWidth}px` }}
      onMouseLeave={onActionsLeave}
    >
      <div className="site-header__actions-surface" />
      <div className="site-header__search-field" aria-hidden={!isSearchExpanded}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            onSearchValueChange?.(nextValue);
          }}
          onBlur={onActionBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearchSubmit();
            }
          }}
          className="site-header__search-input"
          placeholder="Поиск"
          aria-label="Поиск"
        />
      </div>
      <button
        type="button"
        className="site-header__search-icon-button"
        aria-label="Запустить поиск"
        onClick={() => {
          if (!isSearchExpanded) {
            onActionActivate(0, actionItems[0]);
            return;
          }

          onSearchSubmit();
        }}
      >
        <SiteHeaderSearchIcon />
      </button>
      <div ref={actionsRowRef} className="site-header__actions-row">
        <span
          className="site-header__actions-indicator"
          aria-hidden="true"
          style={{
            width: `${actionIndicator.width}px`,
            opacity: actionIndicator.opacity,
            transform: `translateX(${actionIndicator.left}px)`,
          }}
        />
        {actionItems.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            ref={(node) => {
              actionItemRefs.current[index] = node;
            }}
            type="button"
            className="site-header__action-item"
            onMouseEnter={() => onActionHover(index)}
            onFocus={() => onActionFocus(index)}
            onClick={() => {
              if (index === 0 && isSearchInteractive) {
                onActionActivate(index, item);
                return;
              }

              onActionActivate(index, item);
            }}
            onBlur={onActionBlur}
          >
            <span
              ref={(node) => {
                actionLabelRefs.current[index] = node;
              }}
              className="site-header__action-item-label"
            >
              {index === 1 ? (
                <>
                  <span className="site-header__action-item-text">{item.label}</span>
                  <SiteHeaderCartIcon className="site-header__action-cart-icon" />
                  {hasCartCount ? (
                    <span
                      aria-hidden="true"
                      className={
                        cartCountLabel.length > 1
                          ? "site-header__action-cart-count site-header__action-cart-count--wide"
                          : "site-header__action-cart-count"
                      }
                    >
                      {cartCountLabel}
                    </span>
                  ) : null}
                </>
              ) : index === 0 ? (
                <>
                  <span className="site-header__action-item-text">{item.label}</span>
                  <SiteHeaderSearchIcon className="site-header__action-search-icon" />
                </>
              ) : (
                item.label
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
