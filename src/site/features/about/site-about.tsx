import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { SiteImage } from "../image/site-image";
import type { SiteCarouselSlide } from "../storefront/site-storefront-contracts";
import type { SiteAboutTextPanelViewModel } from "../../runtime/site-about-mock";
import "./site-about.css";

function getOrbitDirection(previousIndex: number, nextIndex: number, totalSlides: number) {
  if (totalSlides <= 1 || previousIndex === nextIndex) {
    return null;
  }

  const forwardDistance = (nextIndex - previousIndex + totalSlides) % totalSlides;
  const backwardDistance = (previousIndex - nextIndex + totalSlides) % totalSlides;
  return forwardDistance <= backwardDistance ? "next" : "prev";
}

function SiteAboutTextBody({
  bodyId,
  paragraphs,
}: {
  bodyId: string;
  paragraphs: readonly string[];
}) {
  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split("\n");

        return (
          <Fragment key={`${bodyId}-${paragraphIndex + 1}`}>
            <p className="site-about__text-paragraph">
              {lines.map((line, lineIndex) => (
                <span key={`${bodyId}-${paragraphIndex + 1}-${lineIndex + 1}`}>
                  {line}
                  {lineIndex < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
            {paragraphIndex < paragraphs.length - 1 ? <div className="site-about__text-spacer" aria-hidden="true" /> : null}
          </Fragment>
        );
      })}
    </>
  );
}

function SiteAboutTextCard({
  bodyId,
  paragraphs,
}: {
  bodyId: string;
  paragraphs: readonly string[];
}) {
  return (
    <article className="site-about__text-shell">
      <div className="site-about__text-card">
        <div className="site-about__text-copy">
          <SiteAboutTextBody bodyId={bodyId} paragraphs={paragraphs} />
        </div>
      </div>
    </article>
  );
}

function SiteAboutPhotoCarousel({
  slides,
  emptyMessage = "Фотографии пока не добавлены",
}: {
  slides: readonly SiteCarouselSlide[];
  emptyMessage?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
    align: "start",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dotOrbitDirection, setDotOrbitDirection] = useState<"next" | "prev" | null>(null);
  const [dotOrbitTick, setDotOrbitTick] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const orbitResetRef = useRef<number | null>(null);
  const previousIndexRef = useRef(0);

  const triggerDotOrbit = useCallback((direction: "next" | "prev") => {
    if (orbitResetRef.current !== null) {
      window.clearTimeout(orbitResetRef.current);
    }

    setDotOrbitDirection(direction);
    setDotOrbitTick((current) => current + 1);
    orbitResetRef.current = window.setTimeout(() => {
      setDotOrbitDirection(null);
      orbitResetRef.current = null;
    }, 760);
  }, []);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) {
      return;
    }

    const syncSelectedIndex = () => {
      const nextIndex = emblaApi.selectedScrollSnap();
      const direction = getOrbitDirection(previousIndexRef.current, nextIndex, slides.length);
      if (direction) {
        triggerDotOrbit(direction);
      }

      previousIndexRef.current = nextIndex;
      setSelectedIndex(nextIndex);
    };

    syncSelectedIndex();
    emblaApi.on("select", syncSelectedIndex);
    emblaApi.on("reInit", syncSelectedIndex);

    return () => {
      emblaApi.off("select", syncSelectedIndex);
      emblaApi.off("reInit", syncSelectedIndex);
    };
  }, [emblaApi, slides.length, triggerDotOrbit]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible" || isDragging) {
        return;
      }

      emblaApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [emblaApi, isDragging, slides.length]);

  useEffect(() => {
    return () => {
      if (orbitResetRef.current !== null) {
        window.clearTimeout(orbitResetRef.current);
      }
    };
  }, []);

  const viewportClassName = useMemo(
    () => (isDragging ? "site-about__carousel-viewport site-about__carousel-viewport--dragging" : "site-about__carousel-viewport"),
    [isDragging],
  );

  if (slides.length === 0) {
    return (
      <div className="site-about__media-shell">
        <div className="site-about__media-card site-about__media-card--empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="site-about__media-shell">
      <div className="site-about__media-backdrop" aria-hidden="true" />
      <div className="site-about__media-column">
        <div
          className={viewportClassName}
          ref={emblaRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchCancel={() => setIsDragging(false)}
        >
          <div className="site-about__carousel-container">
            {slides.map((slide, index) => (
              <figure
                key={slide.id}
                className="site-about__carousel-slide"
                data-active={selectedIndex === index ? "true" : "false"}
                aria-hidden={selectedIndex === index ? "false" : "true"}
              >
                <SiteImage src={slide.imageSrc} alt={slide.alt} className="site-about__carousel-image" fillContainer />
              </figure>
            ))}
          </div>
        </div>

        <div
          key={`${dotOrbitDirection ?? "idle"}-${dotOrbitTick}`}
          className={`site-about__dots${dotOrbitDirection ? " site-about__dots--orbiting" : ""}`}
          data-direction={dotOrbitDirection ?? undefined}
          aria-hidden="true"
        >
          <span className="site-about__dot site-about__dot--left" />
          <span className="site-about__dot site-about__dot--center" />
          <span className="site-about__dot site-about__dot--right" />
        </div>
      </div>
    </div>
  );
}

export function SiteAboutView({
  title,
  photoSlides,
  textPanel,
}: {
  title: string;
  photoSlides: readonly SiteCarouselSlide[];
  textPanel: SiteAboutTextPanelViewModel | null;
}) {
  const layoutClassName = textPanel ? "site-about__layout" : "site-about__layout site-about__layout--single";

  return (
    <section className="site-about" aria-labelledby="site-about-title">
      <h1 id="site-about-title" className="site-about__title">
        {title}
      </h1>

      <div className={layoutClassName}>
        {textPanel ? <SiteAboutTextCard bodyId={`${textPanel.id}-left`} paragraphs={textPanel.paragraphs} /> : null}
        <SiteAboutPhotoCarousel slides={photoSlides} />
        {textPanel ? <SiteAboutTextCard bodyId={`${textPanel.id}-right`} paragraphs={textPanel.paragraphs} /> : null}
      </div>

      {textPanel ? (
        <div className="site-about__mobile-text" aria-label="Описание">
          <SiteAboutTextBody bodyId={textPanel.id} paragraphs={textPanel.paragraphs} />
        </div>
      ) : null}
    </section>
  );
}
