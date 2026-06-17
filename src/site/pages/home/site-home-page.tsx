import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SiteHeader } from "../../features/header/site-header";
import {
  SiteCarouselSection,
  SiteFooterSection,
  SiteProductsSection,
} from "../../features/storefront/site-storefront-sections";
import {
  landingHeroButtonLabel,
  landingHeroImageSrc,
  siteActionItems,
  siteMenuItems,
  siteProducts,
} from "../../mock/site-mock-data";
import "./site-home-page.css";

type IntroPhase = "intro" | "transition" | "entered";

const INTRO_TRANSITION_MS = 880;

function SiteHomeSurface({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="site-home-surface">
      {showHeader ? <SiteHeader theme="light" menuItems={siteMenuItems} actionItems={siteActionItems} /> : null}
      <div className="site-home-surface__content">
        <div className="site-home-surface__carousel">
          <SiteCarouselSection />
        </div>
        <div className="site-home-surface__products">
          <SiteProductsSection title="Все товары" ctaLabel="Смотреть все" ctaTo="/catalog" products={siteProducts} />
        </div>
        <div className="site-home-surface__footer">
          <SiteFooterSection />
        </div>
      </div>
    </div>
  );
}

export function SiteHomePage() {
  const [phase, setPhase] = useState<IntroPhase>("intro");

  useEffect(() => {
    document.title = "Anton Shell";
  }, []);

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
    return <SiteHomeSurface />;
  }

  return (
    <main className="site-landing" data-phase={phase}>
      <div
        className={`site-landing__track${phase === "transition" ? " site-landing__track--shifted" : ""}`}
        style={transitionStyle}
      >
        <section className="site-landing__hero" aria-label="Титульная страница">
          <img src={landingHeroImageSrc} alt="" className="site-landing__image" />
          <div className="site-landing__scrim" aria-hidden="true" />
          <button
            type="button"
            className="site-landing__button"
            onClick={() => setPhase("transition")}
            aria-label={landingHeroButtonLabel}
          >
            <span>{landingHeroButtonLabel}</span>
          </button>
        </section>
        <section className="site-landing__preview" aria-hidden="true">
          <SiteHomeSurface showHeader={phase === "transition"} />
        </section>
      </div>
    </main>
  );
}
