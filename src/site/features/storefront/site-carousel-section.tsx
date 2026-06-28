import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import type { SiteCarouselSlide } from "./site-storefront-contracts";

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
  emptyMessage = "Карусель пока не настроена",
  layout = "desktop",
}: {
  slides: SiteCarouselSlide[];
  emptyMessage?: string;
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

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

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
    return () => {
      if (orbitResetRef.current) {
        window.clearTimeout(orbitResetRef.current);
      }
    };
  }, []);

  if (slides.length === 0) {
    return (
      <section className="site-carousel site-carousel--empty" aria-label="Карусель фотографий">
        <div className="site-carousel__empty">{emptyMessage}</div>
      </section>
    );
  }

  return (
    <section className={`site-carousel${layout === "mobile" ? " site-carousel--mobile" : ""}`} aria-label="Карусель фотографий">
      <div className="site-carousel__embla">
        <div className="site-carousel__viewport" ref={emblaRef}>
          <div className="site-carousel__container">
            {slides.map((slide, index) => (
              <figure
                key={slide.id}
                className="site-carousel__slide"
                data-active={selectedIndex === index ? "true" : "false"}
                aria-hidden={selectedIndex === index ? "false" : "true"}
              >
                <img
                  src={resolveSitePublicAssetUrl(slide.imageSrc)}
                  alt={slide.alt}
                  className="site-carousel__image"
                  loading="eager"
                  decoding="async"
                />
              </figure>
            ))}
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
