import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { siteCarouselSlides, siteFooterColumns, type SiteProduct } from "../../mock/site-mock-data";
import "./site-storefront.css";

type SiteProductsSectionProps = {
  title: string;
  products: SiteProduct[];
  ctaLabel?: string;
  ctaTo?: string;
};

const CAROUSEL_INTERVAL_MS = 4800;
const CAROUSEL_TRANSITION_MS = 820;

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getCarouselSlot(index: number, activeIndex: number, total: number) {
  const offset = (index - activeIndex + total) % total;
  if (offset === 0) {
    return "center";
  }
  return offset === 1 ? "right" : "left";
}

export function SiteCarouselSection() {
  const slideCount = siteCarouselSlides.length;
  const transitionFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const carouselPanels = useMemo(() => {
    const realPanels = siteCarouselSlides.map((_, activeIndex) => ({
      id: `state-${activeIndex}`,
      activeIndex,
      slides: siteCarouselSlides.map((slide, index) => ({
        ...slide,
        slot: getCarouselSlot(index, activeIndex, slideCount),
      })),
    }));

    const clonedPanels = [realPanels[realPanels.length - 1], ...realPanels, realPanels[0]];

    return clonedPanels.map((panel, index) => ({
      ...panel,
      cloneKey: `${panel.id}-${index}`,
    }));
  }, [slideCount]);

  const moveTrack = useCallback(
    (direction: 1 | -1) => {
      if (slideCount < 2 || isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      setIsAnimating(true);
      setIsTransitionEnabled(true);
      setTrackIndex((current) => current + direction);
    },
    [slideCount]
  );

  useEffect(() => {
    if (slideCount < 2) {
      return;
    }

    const timerId = window.setInterval(() => {
      moveTrack(1);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [moveTrack, slideCount]);

  useEffect(
    () => () => {
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current);
      }
    },
    []
  );

  const handleTrackTransitionEnd = useCallback(() => {
    if (trackIndex === 0 || trackIndex === slideCount + 1) {
      const resetIndex = trackIndex === 0 ? slideCount : 1;
      setIsTransitionEnabled(false);
      setTrackIndex(resetIndex);
      isAnimatingRef.current = false;
      setIsAnimating(false);

      transitionFrameRef.current = window.requestAnimationFrame(() => {
        transitionFrameRef.current = window.requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
          transitionFrameRef.current = null;
        });
      });

      return;
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, [slideCount, trackIndex]);

  return (
    <section className="site-carousel" aria-label="Карусель фотографий">
      <div className="site-carousel__viewport">
        <div
          className="site-carousel__track"
          data-transition-enabled={isTransitionEnabled ? "true" : "false"}
          style={{
            transform: `translate3d(-${trackIndex * 100}%, 0, 0)`,
            transitionDuration: `${CAROUSEL_TRANSITION_MS}ms`,
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {carouselPanels.map((panel, panelIndex) => (
            <div
              key={panel.cloneKey}
              className="site-carousel__panel"
              aria-hidden={panelIndex === trackIndex ? "false" : "true"}
            >
              {panel.slides.map((slide) => (
                <figure
                  key={`${panel.cloneKey}-${slide.id}`}
                  className="site-carousel__slide"
                  data-slot={slide.slot}
                  aria-hidden={panelIndex === trackIndex && slide.slot === "center" ? "false" : "true"}
                >
                  <img src={slide.imageSrc} alt={slide.alt} className="site-carousel__image" />
                </figure>
              ))}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="site-carousel__arrow site-carousel__arrow--left"
          aria-label="Предыдущий кадр"
          disabled={isAnimating}
          onClick={() => moveTrack(-1)}
        >
          <img
            src="/site-mock/carousel-arrow-right.svg"
            alt=""
            className="site-carousel__arrow-body"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="site-carousel__arrow site-carousel__arrow--right"
          aria-label="Следующий кадр"
          disabled={isAnimating}
          onClick={() => moveTrack(1)}
        >
          <img
            src="/site-mock/carousel-arrow-right.svg"
            alt=""
            className="site-carousel__arrow-body site-carousel__arrow-body--left"
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="site-carousel__dots" aria-hidden="true">
        <span className="site-carousel__dot" />
        <span className="site-carousel__dot site-carousel__dot--center" />
        <span className="site-carousel__dot" />
      </div>
    </section>
  );
}

export function SiteProductsSection({ title, products, ctaLabel, ctaTo }: SiteProductsSectionProps) {
  return (
    <section className="site-products" aria-labelledby="site-products-title">
      <div className="site-products__header">
        <h2 id="site-products-title" className="site-products__title">
          {title}
        </h2>
        {ctaLabel && ctaTo ? (
          <Link to={ctaTo} className="site-products__cta">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
      <div className="site-products__grid">
        {products.map((product) => (
          <article key={product.id} className="site-product-card">
            <div className="site-product-card__media">
              <span className="site-product-card__watermark" aria-hidden="true" />
              <img src={product.imageSrc} alt={product.imageAlt} className="site-product-card__image" />
            </div>
            <div className="site-product-card__meta">
              <p className="site-product-card__brand">{product.brand}</p>
              <p className="site-product-card__name">{product.name}</p>
              <p className="site-product-card__statusline">
                <span className="site-product-card__price">{formatRubles(product.priceRub)} ₽</span>
                <span className="site-product-card__divider">-</span>
                <span className="site-product-card__availability">{product.availability}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SiteFooterSection() {
  return (
    <footer className="site-footer" aria-label="Дополнительная информация">
      {siteFooterColumns.map((column) => (
        <section key={column.title} className="site-footer__column">
          <div className="site-footer__title">{column.title}</div>
          <div className="site-footer__links">
            {column.links.map((item) => (
              <span key={item} className="site-footer__link">
                {item}
              </span>
            ))}
          </div>
        </section>
      ))}
    </footer>
  );
}
