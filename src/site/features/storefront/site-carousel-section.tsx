import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import type { SiteCarouselSlide } from "./site-storefront-contracts";

const ARROW_REPEAT_GUARD_MS = 140;
const ACTIVE_SLIDE_MEDIA_RADIUS = 1;

function getLoopSlideDistance(fromIndex: number, toIndex: number, totalSlides: number) {
  if (totalSlides <= 1) {
    return 0;
  }

  const directDistance = Math.abs(fromIndex - toIndex);
  return Math.min(directDistance, totalSlides - directDistance);
}

function CarouselArrowIcon({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <img
      aria-hidden="true"
      src={resolveSitePublicAssetUrl("/site-mock/carousel-arrow.svg")}
      alt=""
      className={`site-carousel__arrow-body${mirrored ? " site-carousel__arrow-body--left" : ""}`}
    />
  );
}

export function SiteCarouselSection({
  slides,
  layout = "desktop",
}: {
  slides: SiteCarouselSlide[];
  layout?: "desktop" | "mobile";
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    containScroll: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dotOrbitDirection, setDotOrbitDirection] = useState<"next" | "prev" | null>(null);
  const [dotOrbitTick, setDotOrbitTick] = useState(0);
  const previousSelectedIndexRef = useRef<number | null>(null);
  const orbitResetRef = useRef<number | null>(null);
  const videoElementsRef = useRef<Record<string, HTMLVideoElement | null>>({});
  const lastArrowActivationRef = useRef<{ direction: "next" | "prev" | null; timestampMs: number }>({
    direction: null,
    timestampMs: 0,
  });

  const triggerDotOrbit = useCallback((direction: "next" | "prev") => {
    if (orbitResetRef.current) {
      window.clearTimeout(orbitResetRef.current);
    }

    setDotOrbitDirection(direction);
    setDotOrbitTick((current) => current + 1);
    orbitResetRef.current = window.setTimeout(() => {
      setDotOrbitDirection(null);
      orbitResetRef.current = null;
    }, 760);
  }, []);

  const canActivateArrow = useCallback(
    (direction: "next" | "prev") => {
      if (!emblaApi || slides.length <= 1) {
        return false;
      }

      const now = window.performance.now();
      const lastActivation = lastArrowActivationRef.current;
      if (lastActivation.direction === direction && now - lastActivation.timestampMs < ARROW_REPEAT_GUARD_MS) {
        return false;
      }

      lastArrowActivationRef.current = {
        direction,
        timestampMs: now,
      };
      return true;
    },
    [emblaApi, slides.length]
  );

  const scrollPrev = useCallback(() => {
    if (!canActivateArrow("prev")) {
      return;
    }

    emblaApi.scrollPrev();
  }, [canActivateArrow, emblaApi]);

  const scrollNext = useCallback(() => {
    if (!canActivateArrow("next")) {
      return;
    }

    emblaApi.scrollNext();
  }, [canActivateArrow, emblaApi]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) {
      return;
    }

    const syncSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    syncSelectedIndex();
    emblaApi.on("select", syncSelectedIndex);
    emblaApi.on("reInit", syncSelectedIndex);

    return () => {
      emblaApi.off("select", syncSelectedIndex);
      emblaApi.off("reInit", syncSelectedIndex);
    };
  }, [emblaApi, slides.length]);

  useEffect(() => {
    previousSelectedIndexRef.current = null;
    setSelectedIndex((current) => {
      if (slides.length === 0) {
        return 0;
      }
      return Math.min(current, slides.length - 1);
    });
  }, [slides.length]);

  useEffect(() => {
    const previousIndex = previousSelectedIndexRef.current;
    previousSelectedIndexRef.current = selectedIndex;

    if (previousIndex === null || slides.length <= 1) {
      return;
    }

    const delta = (selectedIndex - previousIndex + slides.length) % slides.length;
    if (delta === 1) {
      triggerDotOrbit("next");
    } else if (delta === slides.length - 1) {
      triggerDotOrbit("prev");
    }
  }, [selectedIndex, slides.length, triggerDotOrbit]);

  useEffect(() => {
    for (const [slideIndex, slide] of slides.entries()) {
      if (slide.mediaKind !== "video") {
        continue;
      }

      const videoElement = videoElementsRef.current[slide.id];
      if (!videoElement) {
        continue;
      }

      if (slideIndex === selectedIndex) {
        const playPromise = videoElement.play();
        if (playPromise instanceof Promise) {
          playPromise.catch(() => undefined);
        }
        continue;
      }

      videoElement.pause();
    }
  }, [selectedIndex, slides]);

  useEffect(() => {
    return () => {
      if (orbitResetRef.current) {
        window.clearTimeout(orbitResetRef.current);
      }
    };
  }, []);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className={`site-carousel${layout === "mobile" ? " site-carousel--mobile" : ""}`} aria-label="Карусель фотографий">
      <div className="site-carousel__embla">
        <div className="site-carousel__viewport" ref={emblaRef}>
          <div className="site-carousel__container">
            {slides.map((slide, index) => {
              const loopDistance = getLoopSlideDistance(index, selectedIndex, slides.length);
              const isActiveSlide = selectedIndex === index;
              const shouldPrioritizeSlideMedia = loopDistance <= ACTIVE_SLIDE_MEDIA_RADIUS;

              return (
              <figure
                key={slide.id}
                className="site-carousel__slide"
                data-active={isActiveSlide ? "true" : "false"}
                aria-hidden={isActiveSlide ? "false" : "true"}
              >
                {slide.mediaKind === "video" ? (
                  <video
                    ref={(element) => {
                      videoElementsRef.current[slide.id] = element;
                    }}
                    src={resolveSitePublicAssetUrl(slide.imageSrc)}
                    className="site-carousel__image"
                    autoPlay={isActiveSlide}
                    loop
                    muted
                    playsInline
                    preload={shouldPrioritizeSlideMedia ? "metadata" : "none"}
                  />
                ) : (
                  <img
                    src={resolveSitePublicAssetUrl(slide.imageSrc)}
                    alt={slide.alt}
                    className="site-carousel__image"
                    loading={shouldPrioritizeSlideMedia ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={isActiveSlide ? "high" : "auto"}
                  />
                )}
              </figure>
              );
            })}
          </div>
        </div>
        {layout === "desktop" ? (
          <>
            <button
              type="button"
              className="site-carousel__arrow site-carousel__arrow--left"
              aria-label="Предыдущий кадр"
              onClick={scrollPrev}
              disabled={slides.length <= 1}
            >
              <CarouselArrowIcon />
            </button>
            <button
              type="button"
              className="site-carousel__arrow site-carousel__arrow--right"
              aria-label="Следующий кадр"
              onClick={scrollNext}
              disabled={slides.length <= 1}
            >
              <CarouselArrowIcon mirrored />
            </button>
          </>
        ) : null}
      </div>
      <div
        key={`${dotOrbitDirection ?? "idle"}-${dotOrbitTick}`}
        className={`site-carousel__dots${dotOrbitDirection ? " site-carousel__dots--orbiting" : ""}`}
        data-direction={dotOrbitDirection ?? undefined}
        aria-hidden="true"
      >
        <span className="site-carousel__dot site-carousel__dot--left" />
        <span className="site-carousel__dot site-carousel__dot--center" />
        <span className="site-carousel__dot site-carousel__dot--right" />
      </div>
    </section>
  );
}
