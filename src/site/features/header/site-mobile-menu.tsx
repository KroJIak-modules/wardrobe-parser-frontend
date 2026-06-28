import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { siteFooterColumns } from "../../app/site-static-content";
import type { SiteFooterColumn } from "../storefront/site-storefront-contracts";
import { SiteMobileDrawerShell } from "../shared/site-mobile-drawer-shell";
import {
  buildSiteMobileSearchHref,
  getSiteMobileMenuGroups,
  getSiteMobileMenuPanelTitle,
  type SiteMobileMenuAction,
  type SiteMobileMenuGender,
  type SiteMobileMenuPanel,
} from "./site-mobile-menu-data";
import "./site-mobile-menu.css";

const MOBILE_MENU_FOOTER_OFFSET = 40;
const MOBILE_MENU_FOOTER_ITEM_HEIGHT = 14;
const MOBILE_MENU_FOOTER_ITEM_GAP = 30;

const MOBILE_MENU_FOOTER_GEOMETRY: Record<SiteFooterColumn["id"], { left: number; width: number }> = {
  info: { left: 68, width: 145 },
  social: { left: 85, width: 111 },
};

type SiteMobileMenuFooterLayout = {
  blocks: SiteFooterColumn[];
  topById: Partial<Record<SiteFooterColumn["id"], number>>;
};

type SiteMobileMenuTransitionDirection = "forward" | "backward";

type SiteMobileMenuPanelLayer = {
  id: number;
  panel: SiteMobileMenuPanel;
  direction: SiteMobileMenuTransitionDirection;
  phase: "enter" | "active" | "exit";
};

type SiteMobileMenuRenderedFooter = {
  id: SiteFooterColumn["id"];
  column: SiteFooterColumn;
  top: number;
  phase: "enter" | "active" | "exit";
};

function getPanelDepth(panel: SiteMobileMenuPanel) {
  return panel === "root" ? 0 : 1;
}

function getFooterBlockHeight(column: SiteFooterColumn) {
  return MOBILE_MENU_FOOTER_ITEM_HEIGHT + column.links.length * (MOBILE_MENU_FOOTER_ITEM_HEIGHT + MOBILE_MENU_FOOTER_ITEM_GAP);
}

function getFooterLayout(menuHeight: number, lastContentBottom: number, infoColumn: SiteFooterColumn, socialColumn: SiteFooterColumn): SiteMobileMenuFooterLayout {
  const anchorTop = Math.round(lastContentBottom + MOBILE_MENU_FOOTER_OFFSET);
  const availableHeight = menuHeight - anchorTop;
  const infoHeight = getFooterBlockHeight(infoColumn);
  const socialHeight = getFooterBlockHeight(socialColumn);

  if (availableHeight >= infoHeight + MOBILE_MENU_FOOTER_OFFSET + socialHeight) {
    return {
      blocks: [socialColumn, infoColumn],
      topById: {
        social: anchorTop,
        info: anchorTop + socialHeight + MOBILE_MENU_FOOTER_OFFSET,
      },
    };
  }

  if (availableHeight >= socialHeight) {
    return {
      blocks: [socialColumn],
      topById: {
        social: anchorTop,
      },
    };
  }

  return { blocks: [], topById: {} };
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="site-mobile-menu__search-icon" viewBox="0 0 14 14" fill="none">
      <circle cx="6.1" cy="6.1" r="3.7" stroke="currentColor" strokeWidth="0.8" />
      <path d="M8.9 8.9L12 12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function RootActionChevron() {
  return (
    <svg aria-hidden="true" className="site-mobile-menu__content-chevron" viewBox="0 0 6 11" fill="none">
      <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DetailHeaderChevron() {
  return (
    <svg aria-hidden="true" className="site-mobile-menu__detail-chevron" viewBox="0 0 6 11" fill="none">
      <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getActionClassName(action: SiteMobileMenuAction, panel: SiteMobileMenuPanel) {
  if (panel === "root") {
    return "site-mobile-menu__content-action site-mobile-menu__content-action--root";
  }

  return action.presentation === "heading"
    ? "site-mobile-menu__content-action site-mobile-menu__content-action--heading"
    : "site-mobile-menu__content-action";
}

function isActionInteractive(action: SiteMobileMenuAction) {
  return Boolean(action.panel || action.to);
}

function SiteMobileMenuFooterBlock({
  column,
  top,
  phase,
  onClose,
  onTransitionEnd,
}: {
  column: SiteFooterColumn;
  top: number;
  phase: "enter" | "active" | "exit";
  onClose: () => void;
  onTransitionEnd: () => void;
}) {
  const navigate = useNavigate();
  const geometry = MOBILE_MENU_FOOTER_GEOMETRY[column.id];

  return (
    <nav
      className={`site-mobile-menu__footer site-mobile-menu__footer--${column.id} site-mobile-menu__footer--${phase}`}
      style={{ top, left: geometry.left, width: geometry.width }}
      aria-label={column.title}
      onTransitionEnd={(event) => {
        if (event.currentTarget !== event.target || event.propertyName !== "transform") {
          return;
        }

        onTransitionEnd();
      }}
    >
      <p className="site-mobile-menu__footer-title">{column.title}</p>
      {column.links.map((link) => {
        const content = <span>{link.label}</span>;

        if (link.to) {
          return (
            <button
              key={link.label}
              type="button"
              className="site-mobile-menu__footer-link"
              onClick={() => {
                onClose();
                navigate(link.to ?? "/");
              }}
            >
              {content}
            </button>
          );
        }

        if (link.href) {
          return (
            <a key={link.label} className="site-mobile-menu__footer-link" href={link.href} target="_blank" rel="noreferrer">
              {content}
            </a>
          );
        }

        return (
          <span key={link.label} className="site-mobile-menu__footer-link">
            {content}
          </span>
        );
      })}
    </nav>
  );
}

export function SiteMobileMenu({
  isClosing,
  onClose,
  onCloseAnimationEnd,
}: {
  isClosing: boolean;
  onClose: () => void;
  onCloseAnimationEnd: () => void;
}) {
  const navigate = useNavigate();
  const [gender, setGender] = useState<SiteMobileMenuGender>("men");
  const [panel, setPanel] = useState<SiteMobileMenuPanel>("root");
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeContentRef = useRef<HTMLDivElement | null>(null);
  const nextPanelLayerIdRef = useRef(1);
  const groups = useMemo(() => getSiteMobileMenuGroups(panel, gender), [gender, panel]);
  const infoFooterColumn = siteFooterColumns.find((column) => column.id === "info") ?? null;
  const socialFooterColumn = siteFooterColumns.find((column) => column.id === "social") ?? null;
  const [footerLayout, setFooterLayout] = useState<SiteMobileMenuFooterLayout>({ blocks: [], topById: {} });
  const [panelLayers, setPanelLayers] = useState<SiteMobileMenuPanelLayer[]>([
    { id: 0, panel: "root", direction: "forward", phase: "active" },
  ]);
  const [renderedFooters, setRenderedFooters] = useState<SiteMobileMenuRenderedFooter[]>([]);

  const startPanelTransition = (nextPanel: SiteMobileMenuPanel) => {
    setPanel((currentPanel) => {
      if (currentPanel === nextPanel) {
        return currentPanel;
      }

      const direction: SiteMobileMenuTransitionDirection = getPanelDepth(nextPanel) > getPanelDepth(currentPanel) ? "forward" : "backward";
      const nextLayerId = nextPanelLayerIdRef.current;
      nextPanelLayerIdRef.current += 1;

      setPanelLayers((currentLayers) => {
        const topLayer = currentLayers[currentLayers.length - 1];
        return [
          ...currentLayers.map((layer) =>
            layer.id === topLayer?.id ? { ...layer, phase: "exit", direction } : layer,
          ),
          { id: nextLayerId, panel: nextPanel, direction, phase: "enter" },
        ];
      });

      return nextPanel;
    });
  };

  useEffect(() => {
    const enterLayer = panelLayers.find((layer) => layer.phase === "enter");
    if (!enterLayer) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setPanelLayers((currentLayers) =>
        currentLayers.map((layer) => (layer.id === enterLayer.id ? { ...layer, phase: "active" } : layer)),
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [panelLayers]);

  useEffect(() => {
    const hasEnteringFooter = renderedFooters.some((footer) => footer.phase === "enter");
    if (!hasEnteringFooter) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setRenderedFooters((currentFooters) =>
        currentFooters.map((footer) => (footer.phase === "enter" ? { ...footer, phase: "active" } : footer)),
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [renderedFooters]);

  useLayoutEffect(() => {
    if (!menuRef.current || !activeContentRef.current || !infoFooterColumn || !socialFooterColumn) {
      setFooterLayout({ blocks: [], topById: {} });
      return;
    }

    const menuElement = menuRef.current;
    const contentElement = activeContentRef.current;

    const updateFooterLayout = () => {
      const actionElements = contentElement.querySelectorAll<HTMLElement>("[data-mobile-menu-action]");
      const lastActionElement = actionElements.item(actionElements.length - 1);
      if (!lastActionElement) {
        setFooterLayout({ blocks: [], topById: {} });
        return;
      }

      const menuRect = menuElement.getBoundingClientRect();
      const lastActionRect = lastActionElement.getBoundingClientRect();
      setFooterLayout(getFooterLayout(menuRect.height, lastActionRect.bottom - menuRect.top, infoFooterColumn, socialFooterColumn));
    };

    updateFooterLayout();

    const resizeObserver = new ResizeObserver(updateFooterLayout);
    resizeObserver.observe(menuElement);
    resizeObserver.observe(contentElement);
    window.addEventListener("resize", updateFooterLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFooterLayout);
    };
  }, [groups, infoFooterColumn, socialFooterColumn]);

  useEffect(() => {
    if (!infoFooterColumn || !socialFooterColumn) {
      setRenderedFooters([]);
      return;
    }

    const nextFooterMap = new Map(
      footerLayout.blocks.map((column) => [
        column.id,
        {
          id: column.id,
          column,
          top: footerLayout.topById[column.id] ?? 0,
        },
      ]),
    );

    setRenderedFooters((currentFooters) => {
      const currentFooterMap = new Map(currentFooters.map((footer) => [footer.id, footer]));
      const nextFooters: SiteMobileMenuRenderedFooter[] = [];

      footerLayout.blocks.forEach((column) => {
        const nextFooter = nextFooterMap.get(column.id);
        if (!nextFooter) {
          return;
        }

        const currentFooter = currentFooterMap.get(column.id);
        nextFooters.push({
          id: column.id,
          column,
          top: nextFooter.top,
          phase: currentFooter?.phase === "exit" ? "enter" : currentFooter ? "active" : "enter",
        });
      });

      currentFooters.forEach((footer) => {
        if (nextFooterMap.has(footer.id)) {
          return;
        }

        nextFooters.push({ ...footer, phase: "exit" });
      });

      return nextFooters;
    });
  }, [footerLayout, infoFooterColumn, socialFooterColumn]);

  const activateAction = (action: SiteMobileMenuAction) => {
    if (action.panel) {
      startPanelTransition(action.panel);
      return;
    }

    if (!action.to) {
      return;
    }

    onClose();
    navigate(action.to, action.navigationState ? { state: action.navigationState } : undefined);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (query === "") {
      return;
    }

    onClose();
    navigate(buildSiteMobileSearchHref(query));
  };

  return (
    <SiteMobileDrawerShell
      ref={menuRef}
      ariaLabel="Мобильное меню"
      className="site-mobile-menu"
      isClosing={isClosing}
      onClose={onClose}
      onCloseAnimationEnd={onCloseAnimationEnd}
    >
        <div className={`site-mobile-menu__tabs site-mobile-menu__tabs--${gender}`}>
          <span className="site-mobile-menu__tabs-indicator" aria-hidden="true" />
          <button
            type="button"
            className="site-mobile-menu__tab"
            onClick={() => {
              setGender("men");
              startPanelTransition("root");
            }}
          >
            МУЖСКОЕ
          </button>
          <button
            type="button"
            className="site-mobile-menu__tab"
            onClick={() => {
              setGender("women");
              startPanelTransition("root");
            }}
          >
            ЖЕНСКОЕ
          </button>
          <button
            type="button"
            className="site-mobile-menu__tab"
            onClick={() => {
              onClose();
              navigate("/sale");
            }}
          >
            СКИДКИ
          </button>
        </div>

        {panelLayers.map((layer) => {
          const layerGroups = getSiteMobileMenuGroups(layer.panel, gender);
          const layerTitle = getSiteMobileMenuPanelTitle(layer.panel);
          const isRootPanel = layer.panel === "root";
          const isTopLayer = layer.id === panelLayers[panelLayers.length - 1]?.id;

          return (
            <div
              key={layer.id}
              className={`site-mobile-menu__panel-layer site-mobile-menu__panel-layer--${layer.phase} site-mobile-menu__panel-layer--${layer.direction}`}
              aria-hidden={!isTopLayer}
              onTransitionEnd={(event) => {
                if (event.currentTarget !== event.target || event.propertyName !== "transform") {
                  return;
                }

                if (layer.phase === "exit") {
                  setPanelLayers((currentLayers) => currentLayers.filter((currentLayer) => currentLayer.id !== layer.id));
                }
              }}
            >
              {isRootPanel ? (
                <form className="site-mobile-menu__search" role="search" onSubmit={submitSearch}>
                  <input
                    className="site-mobile-menu__search-input"
                    value={searchValue}
                    placeholder="Поиск"
                    aria-label="Поиск"
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                  <button type="submit" className="site-mobile-menu__search-submit" aria-label="Искать">
                    <SearchIcon />
                  </button>
                </form>
              ) : layerTitle ? (
                <button
                  type="button"
                  className="site-mobile-menu__detail-header"
                  aria-label="Назад"
                  onClick={() => startPanelTransition("root")}
                >
                  <DetailHeaderChevron />
                  <span className="site-mobile-menu__detail-title">{layerTitle}</span>
                </button>
              ) : null}

              {layerGroups.length > 0 ? (
                <div
                  ref={isTopLayer ? activeContentRef : null}
                  className={
                    isRootPanel
                      ? "site-mobile-menu__content site-mobile-menu__content--root"
                      : "site-mobile-menu__content site-mobile-menu__content--detail"
                  }
                >
                  {layerGroups.map((group) => (
                    <div
                      key={group.id}
                      className={
                        isRootPanel
                          ? "site-mobile-menu__content-group site-mobile-menu__content-group--root"
                          : "site-mobile-menu__content-group"
                      }
                    >
                      {group.actions.map((action) => {
                        const className = getActionClassName(action, layer.panel);

                        if (!isActionInteractive(action)) {
                          return (
                            <span
                              key={`${group.id}-${action.label}`}
                              data-mobile-menu-action="true"
                              className={`${className} site-mobile-menu__content-action--static`}
                            >
                              <span className="site-mobile-menu__content-label">{action.label}</span>
                            </span>
                          );
                        }

                        return (
                          <button
                            key={`${group.id}-${action.label}`}
                            data-mobile-menu-action="true"
                            type="button"
                            className={className}
                            onClick={() => activateAction(action)}
                          >
                            <span className="site-mobile-menu__content-label">{action.label}</span>
                            {isRootPanel ? <RootActionChevron /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {renderedFooters.map((footer) => (
          <SiteMobileMenuFooterBlock
            key={footer.id}
            column={footer.column}
            top={footer.top}
            phase={footer.phase}
            onClose={onClose}
            onTransitionEnd={() => {
              if (footer.phase !== "exit") {
                return;
              }

              setRenderedFooters((currentFooters) => currentFooters.filter((currentFooter) => currentFooter.id !== footer.id));
            }}
          />
        ))}
    </SiteMobileDrawerShell>
  );
}
