import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { landingHeroButtonLabel, siteMenuItems } from "../../app/site-static-content";
import { SiteHeader } from "../../features/header/site-header";
import { SiteHomeNotification } from "../../features/home-notification/site-home-notification";
import { SiteImage } from "../../features/image/site-image";
import type { SiteImageSkeletonVariant } from "../../features/image/site-image";
import { LandingGlassButtons } from "../../features/landing/landing-glass-buttons";
import {
  SiteCarouselSection,
  SiteFooterSection,
  SiteProductsSection,
} from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems } from "../../runtime/use-site-cart";
import { useSiteHomeNotification } from "../../runtime/use-site-home-notification";
import { useSiteProducts } from "../../runtime/use-site-products";
import { useSiteShowcaseMedia } from "../../runtime/use-site-showcase-media";
import "./site-home-page.css";

type IntroPhase = "intro" | "transition" | "entered";

const INTRO_TRANSITION_MS = 880;
const HOME_DEBUG_SKELETON_VARIANTS: readonly SiteImageSkeletonVariant[] = ["spotlight", "admin-image", "pulse", "shine"];

function SiteHomeSurface({
  showHeader = true,
  headerMode = "fixed",
  notificationsEnabled = true,
  showcaseMedia,
  showcaseError,
}: {
  showHeader?: boolean;
  headerMode?: "fixed" | "preview";
  notificationsEnabled?: boolean;
  showcaseMedia: ReturnType<typeof useSiteShowcaseMedia>["media"];
  showcaseError: string | null;
}) {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [headerTheme, setHeaderTheme] = useState<"light" | "dark">("light");
  const [searchValue, setSearchValue] = useState("");
  const homeNotification = useSiteHomeNotification(notificationsEnabled);
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSiteProducts("", { limit: 12 });
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const sync = () => setIsMobileCarousel(mediaQuery.matches);
    sync();

    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const carouselSlides = isMobileCarousel
    ? showcaseMedia.carouselSlidesMobile ?? showcaseMedia.carouselSlidesDesktop
    : showcaseMedia.carouselSlidesDesktop;

  return (
    <div className="site-home-surface">
      {showHeader ? (
        <SiteHeader
          theme={headerTheme}
          menuItems={siteMenuItems}
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
      ) : null}
      <div className="site-home-surface__content">
        <div ref={carouselRef} className="site-home-surface__carousel">
          <SiteCarouselSection
            slides={carouselSlides}
            emptyMessage={showcaseError || "Карусель витрины пока пуста"}
          />
        </div>
        <div className="site-home-surface__products">
          <SiteProductsSection
            title="Все товары"
            ctaLabel="Смотреть все"
            ctaTo="/catalog"
            products={products}
            loading={productsLoading}
            errorMessage={productsError}
            debugSkeletonVariants={HOME_DEBUG_SKELETON_VARIANTS}
          />
        </div>
        <div className="site-home-surface__footer">
          <SiteFooterSection />
        </div>
      </div>
      {homeNotification.isOpen ? (
        <SiteHomeNotification payload={homeNotification.payload} onDismiss={homeNotification.dismiss} />
      ) : null}
    </div>
  );
}

export function SiteHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldOpenStorefront = searchParams.get("view") === "storefront";
  const [phase, setPhase] = useState<IntroPhase>(shouldOpenStorefront ? "entered" : "intro");
  const { media, error: showcaseError } = useSiteShowcaseMedia();

  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

  useLayoutEffect(() => {
    if (!shouldOpenStorefront) {
      return;
    }

    if (phase !== "entered") {
      setPhase("entered");
    }

    window.scrollTo(0, 0);
  }, [phase, shouldOpenStorefront]);

  useEffect(() => {
    if (phase === "entered") {
      return;
    }

    // The landing screen is intentionally gated: the user can only enter the storefront through the CTA.
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "transition") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase("entered");
      window.scrollTo(0, 0);
    }, INTRO_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [phase]);

  const transitionStyle = useMemo(
    () => ({ "--site-intro-duration": `${INTRO_TRANSITION_MS}ms` }) as CSSProperties,
    []
  );

  if (phase === "entered") {
    return <SiteHomeSurface showcaseMedia={media} showcaseError={showcaseError} />;
  }

  return (
    <main className="site-landing" data-phase={phase}>
      <div
        className={`site-landing__track${phase === "transition" ? " site-landing__track--shifted" : ""}`}
        style={transitionStyle}
      >
        <section className="site-landing__hero" aria-label="Титульная страница">
          {media.heroImageSrc ? (
            <SiteImage src={media.heroImageSrc} alt="" className="site-landing__image" fillContainer />
          ) : (
            <div className="site-landing__image site-landing__image--placeholder" aria-hidden="true" />
          )}
          <div className="site-landing__scrim" aria-hidden="true" />
          <LandingGlassButtons
            label={landingHeroButtonLabel}
            onEnter={() => {
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete("view");
                return next;
              });
              setPhase("transition");
            }}
          />
        </section>
        <section className="site-landing__preview" aria-hidden="true">
          <SiteHomeSurface
            showHeader
            headerMode="preview"
            notificationsEnabled={false}
            showcaseMedia={media}
            showcaseError={showcaseError}
          />
        </section>
      </div>
    </main>
  );
}
