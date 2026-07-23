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
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";

export function SiteHomeSurface({
  showHeader = true,
  headerMode = "fixed",
  notificationsEnabled = true,
  onLogoActivate,
  isCarouselReady = false,
  isCarouselResolved = false,
  showcaseMedia,
}: {
  showHeader?: boolean;
  headerMode?: "fixed" | "preview";
  notificationsEnabled?: boolean;
  onLogoActivate?: () => void;
  isCarouselReady?: boolean;
  isCarouselResolved?: boolean;
  showcaseMedia: ReturnType<typeof useSiteShowcaseMedia>["media"];
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
  const hasCarouselForViewport = carouselSlides.length > 0;

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
            onLogoActivate={onLogoActivate}
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
        {!isCarouselResolved || hasCarouselForViewport ? (
          <div
            ref={carouselRef}
            className={isCarouselReady ? "site-home-surface__carousel site-home-surface__carousel--ready" : "site-home-surface__carousel"}
          >
            {isCarouselReady ? (
              <SiteCarouselSection
                slides={carouselSlides}
                layout={isMobileLayout ? "mobile" : "desktop"}
              />
            ) : (
              <div className="site-home-surface__carousel-placeholder" aria-hidden="true">
                {isCarouselResolved && hasCarouselForViewport && !isMobileLayout ? (
                  <>
                    <span className="site-carousel__arrow site-carousel__arrow--left">
                      <img
                        src={resolveSitePublicAssetUrl("/site-mock/carousel-arrow.svg")}
                        alt=""
                        className="site-carousel__arrow-body"
                      />
                    </span>
                    <span className="site-carousel__arrow site-carousel__arrow--right">
                      <img
                        src={resolveSitePublicAssetUrl("/site-mock/carousel-arrow.svg")}
                        alt=""
                        className="site-carousel__arrow-body site-carousel__arrow-body--left"
                      />
                    </span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
        <div className="site-home-surface__products">
          <SiteProductsSection
            title="Все товары"
            ctaLabel="Смотреть все"
            ctaTo="/catalog"
            layout={isMobileLayout ? "mobile" : "desktop"}
            products={products}
            loading={productsLoading}
            errorMessage={productsError}
            skeletonCount={12}
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
