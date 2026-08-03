import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { siteFooterColumns } from "../../app/site-static-content";
import type { SiteFooterColumn } from "../storefront/site-storefront-contracts";
import type { SiteApiNavigation } from "../../runtime/site-public-api";
import { SiteMobileDrawerShell } from "../shared/site-mobile-drawer-shell";
import { SiteWindowCloseButton } from "../window-shell/site-window-shell";
import { prepareSiteCatalogFilterNavigation } from "../catalog/site-catalog-navigation";
import {
  buildSiteMobileSearchHref,
  getSiteMobileMenuGroups,
  getSiteMobileMenuPanelTitle,
  type SiteMobileMenuAction,
  type SiteMobileMenuGender,
  type SiteMobileMenuPanel,
} from "./site-mobile-menu-data";
import "./site-mobile-menu.css";

type SiteMobileMenuTransitionDirection = "forward" | "backward";

type SiteMobileMenuPanelLayer = {
  id: number;
  panel: SiteMobileMenuPanel;
  direction: SiteMobileMenuTransitionDirection;
  phase: "enter" | "active" | "exit";
};

function getPanelDepth(panel: SiteMobileMenuPanel) {
  return panel === "root" ? 0 : 1;
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
  onClose,
}: {
  column: SiteFooterColumn;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <nav className={`site-mobile-menu__footer site-mobile-menu__footer--${column.id}`} aria-label={column.title}>
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
  navigation,
  presentation = "mobile",
  isClosing,
  onClose,
  onCloseAnimationEnd,
}: {
  navigation: SiteApiNavigation | null;
  presentation?: "mobile" | "tablet";
  isClosing: boolean;
  onClose: () => void;
  onCloseAnimationEnd: () => void;
}) {
  const navigate = useNavigate();
  const [gender, setGender] = useState<SiteMobileMenuGender>("men");
  const [panel, setPanel] = useState<SiteMobileMenuPanel>("root");
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const nextPanelLayerIdRef = useRef(1);
  const [panelLayers, setPanelLayers] = useState<SiteMobileMenuPanelLayer[]>([
    { id: 0, panel: "root", direction: "forward", phase: "active" },
  ]);

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

    menuRef.current?.scrollTo({ top: 0, behavior: "auto" });
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

  const getPanelFrameClassName = (menuPanel: SiteMobileMenuPanel) => {
    if (menuPanel === "root") {
      return "site-mobile-menu__panel-frame site-mobile-menu__panel-frame--root";
    }

    if (menuPanel === "new") {
      return "site-mobile-menu__panel-frame site-mobile-menu__panel-frame--detail site-mobile-menu__panel-frame--new";
    }

    if (menuPanel === "designers") {
      return "site-mobile-menu__panel-frame site-mobile-menu__panel-frame--detail site-mobile-menu__panel-frame--designers";
    }

    return "site-mobile-menu__panel-frame site-mobile-menu__panel-frame--detail site-mobile-menu__panel-frame--root-group";
  };

  const activateAction = (action: SiteMobileMenuAction) => {
    if (action.panel) {
      startPanelTransition(action.panel);
      return;
    }

    if (!action.to) {
      return;
    }

    onClose();
    const destination = prepareSiteCatalogFilterNavigation(action.to, action.navigationState);
    navigate(destination.to, destination.state ? { state: destination.state } : undefined);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (query === "") {
      return;
    }

    onClose();
    const destination = prepareSiteCatalogFilterNavigation(buildSiteMobileSearchHref(query));
    navigate(destination.to, destination.state ? { state: destination.state } : undefined);
  };

  return (
    <SiteMobileDrawerShell
      ref={menuRef}
      ariaLabel="Мобильное меню"
      className="site-mobile-menu"
      presentation={presentation}
      isClosing={isClosing}
      onClose={onClose}
      onCloseAnimationEnd={onCloseAnimationEnd}
    >
      <SiteWindowCloseButton
        className="site-mobile-menu__close"
        ariaLabel="Закрыть меню"
        onClick={onClose}
        iconSrc="/site-mock/mobile-header/menu-close.svg"
        rotateIcon={false}
      />
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
            const destination = prepareSiteCatalogFilterNavigation("/sale");
            navigate(destination.to, destination.state ? { state: destination.state } : undefined);
          }}
        >
          СКИДКИ
        </button>
      </div>

      <div className="site-mobile-menu__panel-stack">
        {panelLayers.map((layer) => {
          const layerGroups = getSiteMobileMenuGroups(navigation, layer.panel, gender);
          const layerTitle = getSiteMobileMenuPanelTitle(navigation, layer.panel, gender);
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
              <div className={getPanelFrameClassName(layer.panel)}>
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
                              <span key={`${group.id}-${action.label}`} className={`${className} site-mobile-menu__content-action--static`}>
                                <span className="site-mobile-menu__content-label">{action.label}</span>
                              </span>
                            );
                          }

                          return (
                            <button
                              key={`${group.id}-${action.label}`}
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

                <div className="site-mobile-menu__footers">
                  {siteFooterColumns.map((column) => (
                    <SiteMobileMenuFooterBlock key={column.id} column={column} onClose={onClose} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SiteMobileDrawerShell>
  );
}
