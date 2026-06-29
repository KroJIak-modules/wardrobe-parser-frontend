import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { landingHeroButtonLabel } from "../../app/site-static-content";
import { SiteImage } from "../../features/image/site-image";
import { LandingGlassButtons } from "../../features/landing/landing-glass-buttons";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteShowcaseMedia } from "../../runtime/use-site-showcase-media";
import { SiteHomeSurface } from "./site-home-surface";
import "./site-home-page.css";

type IntroPhase = "intro" | "transition" | "entered";

const INTRO_TRANSITION_MS = 880;

export function SiteHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldOpenStorefront = searchParams.get("view") === "storefront";
  const [phase, setPhase] = useState<IntroPhase>(shouldOpenStorefront ? "entered" : "intro");
  const { media, error: showcaseError, isCarouselReady } = useSiteShowcaseMedia({ preloadCarousel: true });
  const isMobileLayout = useSiteMediaQuery("(max-width: 640px)");
  const heroImageSrc = isMobileLayout ? media.heroImageSrcMobile ?? media.heroImageSrcDesktop : media.heroImageSrcDesktop;

  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

  useEffect(() => {
    const previousHtmlBackground = document.documentElement.style.background;
    const previousBodyBackground = document.body.style.background;
    const nextBackground = phase === "entered" ? "#fff" : "#0b0a09";

    document.documentElement.style.background = nextBackground;
    document.body.style.background = nextBackground;

    return () => {
      document.documentElement.style.background = previousHtmlBackground;
      document.body.style.background = previousBodyBackground;
    };
  }, [phase]);

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

  return (
    <main className="site-landing" data-phase={phase}>
      {isMobileLayout && phase === "entered" ? (
        <SiteMobileHomeHeader
          onLogoActivate={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
              return;
            }

            navigate("/?view=storefront");
          }}
        />
      ) : null}
      <div
        className={`site-landing__track${phase === "transition" ? " site-landing__track--shifted" : ""}`}
        style={transitionStyle}
      >
        <section className="site-landing__hero" aria-label="Титульная страница">
          {heroImageSrc ? (
            <SiteImage src={heroImageSrc} alt="" className="site-landing__image" fillContainer enableSkeleton={false} />
          ) : (
            <div className="site-landing__image site-landing__image--placeholder" aria-hidden="true" />
          )}
          <div className="site-landing__scrim" aria-hidden="true" />
          <LandingGlassButtons
            label={landingHeroButtonLabel}
            onEnter={() => {
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.set("view", "storefront");
                return next;
              });
              setPhase("transition");
            }}
          />
        </section>
        <section className="site-landing__preview" aria-hidden={phase === "intro" ? "true" : "false"}>
          <SiteHomeSurface
            showHeader
            headerMode={phase === "entered" ? "fixed" : "preview"}
            notificationsEnabled={phase === "entered"}
            isCarouselReady={isCarouselReady}
            showcaseMedia={media}
            showcaseError={showcaseError}
          />
        </section>
      </div>
    </main>
  );
}
