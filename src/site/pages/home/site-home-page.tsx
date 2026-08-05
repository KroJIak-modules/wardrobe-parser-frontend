import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  heroHomeState,
  resolveHomeView,
  shouldAnimateHomeIntro,
  storefrontHomeState,
} from "../../app/site-home-entry";
import { landingHeroButtonLabel } from "../../app/site-static-content";
import { SiteImage } from "../../features/image/site-image";
import { LandingGlassButtons } from "../../features/landing/landing-glass-buttons";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteShowcaseMedia } from "../../runtime/use-site-showcase-media";
import { SiteHomeSurface } from "./site-home-surface";
import "./site-home-page.css";

type IntroPhase = "intro" | "transition" | "entered";

const INTRO_TRANSITION_MS = 880;

export function SiteHomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isStorefrontRequested, setIsStorefrontRequested] = useState(
    () => resolveHomeView(location.state) === "storefront",
  );
  const shouldAnimateIntoStorefront = shouldAnimateHomeIntro(location.state);
  const shouldOpenStorefront = isStorefrontRequested;
  const [phase, setPhase] = useState<IntroPhase>(() => {
    if (!shouldOpenStorefront) {
      return "intro";
    }
    return shouldAnimateIntoStorefront ? "transition" : "entered";
  });
  const [isCtaTransitionPending, setIsCtaTransitionPending] = useState(false);
  const { media, isCarouselReady, isCarouselResolved, loading: isShowcaseMediaLoading } = useSiteShowcaseMedia({ preloadCarousel: true });
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const heroAsset = isMobileLayout ? media.heroMobile ?? media.heroDesktop : media.heroDesktop;
  const hasHeroForViewport = heroAsset !== null;
  const isHeroAvailabilityResolved = !isShowcaseMediaLoading;

  useEffect(() => {
    setIsStorefrontRequested(resolveHomeView(location.state) === "storefront");
  }, [location.key, location.state]);

  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

  useEffect(() => {
    if (!isHeroAvailabilityResolved) {
      return;
    }

    if (!hasHeroForViewport) {
      setPhase("entered");
      return;
    }

    if (!shouldOpenStorefront) {
      setPhase("intro");
      return;
    }

    setPhase((currentPhase) => {
      if (currentPhase === "transition" || currentPhase === "entered") {
        return currentPhase;
      }
      if (shouldAnimateIntoStorefront || isCtaTransitionPending) {
        return "transition";
      }
      return "entered";
    });
  }, [
    hasHeroForViewport,
    isCtaTransitionPending,
    isHeroAvailabilityResolved,
    shouldAnimateIntoStorefront,
    shouldOpenStorefront,
  ]);

  useLayoutEffect(() => {
    if (!isHeroAvailabilityResolved) {
      return;
    }

    if (!hasHeroForViewport || !shouldOpenStorefront) {
      return;
    }

    if (phase === "entered") {
      window.scrollTo(0, 0);
    }
  }, [hasHeroForViewport, isHeroAvailabilityResolved, phase, shouldOpenStorefront]);

  useEffect(() => {
    if (!isHeroAvailabilityResolved || phase === "entered" || !hasHeroForViewport) {
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
  }, [hasHeroForViewport, isHeroAvailabilityResolved, phase]);

  useEffect(() => {
    if (phase !== "transition") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase("entered");
      window.scrollTo(0, 0);
      if (shouldAnimateIntoStorefront || isCtaTransitionPending) {
        navigate("/", { replace: true, state: storefrontHomeState() });
      }
      setIsCtaTransitionPending(false);
    }, INTRO_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isCtaTransitionPending, navigate, phase, shouldAnimateIntoStorefront]);

  const transitionStyle = useMemo(
    () => ({ "--site-intro-duration": `${INTRO_TRANSITION_MS}ms` }) as CSSProperties,
    []
  );

  return (
    <main className="site-landing" data-phase={phase}>
      {!isHeroAvailabilityResolved || hasHeroForViewport ? (
        <div
          className={`site-landing__track${phase === "transition" ? " site-landing__track--shifted" : ""}`}
          style={transitionStyle}
        >
          <section className="site-landing__hero" aria-label="Титульная страница">
            {heroAsset?.mediaKind === "video" ? (
              <video
                src={heroAsset.url}
                className="site-landing__image"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            ) : heroAsset ? (
              <SiteImage
                src={heroAsset.url}
                alt=""
                className="site-landing__image"
                fillContainer
                enableSkeleton={false}
              />
            ) : (
              <div className="site-landing__image site-landing__image--placeholder" aria-hidden="true" />
            )}
            <div className="site-landing__scrim" aria-hidden="true" />
            <LandingGlassButtons
              label={landingHeroButtonLabel}
              heroAsset={heroAsset}
              onEnter={() => {
                setIsStorefrontRequested(true);
                setIsCtaTransitionPending(true);
                setPhase("transition");
              }}
            />
          </section>
          <section className="site-landing__preview" aria-hidden={phase === "intro" ? "true" : "false"}>
            <SiteHomeSurface
              showHeader
              headerMode={phase === "entered" ? "fixed" : "preview"}
              notificationsEnabled={phase === "entered"}
              onLogoActivate={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                navigate("/", { state: heroHomeState() });
              }}
              isCarouselReady={isCarouselReady}
              isCarouselResolved={isCarouselResolved}
              showcaseMedia={media}
            />
          </section>
        </div>
      ) : (
        <SiteHomeSurface
          showHeader
          headerMode="fixed"
          notificationsEnabled
          onLogoActivate={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            navigate("/", { state: heroHomeState() });
          }}
          isCarouselReady={isCarouselReady}
          isCarouselResolved={isCarouselResolved}
          showcaseMedia={media}
        />
      )}
    </main>
  );
}
