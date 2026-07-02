import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../../features/header/site-header";
import { SiteHomeNotification } from "../../features/home-notification/site-home-notification";
import {
  SiteCarouselSection,
  SiteFooterSection,
  SiteProductsSection,
} from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteHomeNotification } from "../../runtime/use-site-home-notification";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteNavigation } from "../../runtime/use-site-navigation";
import { useSiteProducts } from "../../runtime/use-site-products";
import { useSiteShowcaseMedia } from "../../runtime/use-site-showcase-media";

export function SiteHomeSurface({
  showHeader = true,
  headerMode = "fixed",
  notificationsEnabled = true,
  isCarouselReady = false,
  showcaseMedia,
  showcaseError,
}: {
  showHeader?: boolean;
  headerMode?: "fixed" | "preview";
  notificationsEnabled?: boolean;
  isCarouselReady?: boolean;
  showcaseMedia: ReturnType<typeof useSiteShowcaseMedia>["media"];
  showcaseError: string | null;
}) {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { menuItems, dropdownMenus } = useSiteNavigation();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [headerTheme, setHeaderTheme] = useState<"light" | "dark">("light");
  const [searchValue, setSearchValue] = useState("");
  const homeNotification = useSiteHomeNotification(notificationsEnabled);
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSiteProducts("", { limit: 12 });
  const carouselSlides = isMobileLayout
    ? showcaseMedia.carouselSlidesMobile ?? showcaseMedia.carouselSlidesDesktop
    : showcaseMedia.carouselSlidesDesktop;

  useEffect(() => {
    if (isMobileLayout) {
      return;
    }

    const carouselNode = carouselRef.current;
    if (!carouselNode) {
      return;
    }

    let frameId = 0;

    const updateHeaderTheme = () => {
      const rect = carouselNode.getBoundingClientRect();
      const sampleLine = 40;
      const isHeroBehindHeader = rect.top <= sampleLine && rect.bottom >= sampleLine;
      setHeaderTheme(isHeroBehindHeader ? "dark" : "light");
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateHeaderTheme);
    };

    updateHeaderTheme();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isMobileLayout]);

  return (
    <div className={`site-home-surface${isMobileLayout ? " site-home-surface--mobile" : ""}`}>
      {showHeader ? (
        !isMobileLayout ? (
          <SiteHeader
            theme={headerTheme}
            menuItems={menuItems}
            dropdownMenus={dropdownMenus}
            actionItems={actionItems}
            mode={headerMode}
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onSearchSubmit={(value) => {
              const params = new URLSearchParams();
              if (value !== "") {
                params.set("q", value);
              }

              navigate({
                pathname: "/catalog",
                search: params.toString() ? `?${params.toString()}` : "",
              });
            }}
          />
        ) : null
      ) : null}
      <div className="site-home-surface__content">
        <div ref={carouselRef} className="site-home-surface__carousel">
          {isCarouselReady ? (
            <SiteCarouselSection
              slides={carouselSlides}
              emptyMessage={showcaseError || "Карусель витрины пока пуста"}
              layout={isMobileLayout ? "mobile" : "desktop"}
            />
          ) : (
            <div className="site-home-surface__carousel-placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="site-home-surface__products">
          <SiteProductsSection
            title="Все товары"
            ctaLabel="Смотреть все"
            ctaTo="/catalog"
            layout={isMobileLayout ? "mobile" : "desktop"}
            products={products}
            loading={productsLoading}
            errorMessage={productsError}
          />
        </div>
        <div className="site-home-surface__footer">
          <SiteFooterSection layout={isMobileLayout ? "mobile" : "desktop"} />
        </div>
      </div>
      {homeNotification.isOpen ? (
        <SiteHomeNotification payload={homeNotification.payload} onDismiss={homeNotification.dismiss} />
      ) : null}
    </div>
  );
}
