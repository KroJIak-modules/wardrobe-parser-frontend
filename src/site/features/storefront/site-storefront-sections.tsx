import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { siteFooterColumns } from "../../app/site-static-content";
import { SiteImage, type SiteImageSkeletonVariant } from "../image/site-image";
import { SiteProductCard } from "../product-card/site-product-card";
import type { SiteCarouselSlide, SiteProduct } from "./site-storefront-contracts";
import "./site-storefront.css";

type SiteProductsSectionProps = {
  title: string;
  products: SiteProduct[];
  ctaLabel?: string;
  ctaTo?: string;
  emptyMessage?: string;
  loading?: boolean;
  errorMessage?: string | null;
  debugSkeletonVariants?: readonly SiteImageSkeletonVariant[];
};

type SiteProductsGridProps = {
  products: SiteProduct[];
  emptyMessage?: string;
  loading?: boolean;
  errorMessage?: string | null;
  debugSkeletonVariants?: readonly SiteImageSkeletonVariant[];
};

function CarouselArrowIcon({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <img
      aria-hidden="true"
      src="/site-mock/carousel-arrow-right.svg"
      alt=""
      className={`site-carousel__arrow-body${mirrored ? " site-carousel__arrow-body--left" : ""}`}
    />
  );
}

export function SiteCarouselSection({
  slides,
  emptyMessage = "Карусель пока не настроена",
}: {
  slides: SiteCarouselSlide[];
  emptyMessage?: string;
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
    triggerDotOrbit("prev");
    emblaApi?.scrollPrev();
  }, [emblaApi, triggerDotOrbit]);

  const scrollNext = useCallback(() => {
    triggerDotOrbit("next");
    emblaApi?.scrollNext();
  }, [emblaApi, triggerDotOrbit]);

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
    setSelectedIndex((current) => {
      if (slides.length === 0) {
        return 0;
      }
      return Math.min(current, slides.length - 1);
    });
  }, [slides.length]);

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
    <section className="site-carousel" aria-label="Карусель фотографий">
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
                <SiteImage src={slide.imageSrc} alt={slide.alt} className="site-carousel__image" fillContainer />
              </figure>
            ))}
          </div>
        </div>
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

export function SiteProductsGrid({
  products,
  emptyMessage = "Ничего не найдено",
  loading = false,
  errorMessage = null,
  debugSkeletonVariants = [],
}: SiteProductsGridProps) {
  if (loading) {
    return <div className="site-products__status">Загрузка товаров...</div>;
  }

  if (errorMessage) {
    return <div className="site-products__status site-products__status--error">{errorMessage}</div>;
  }

  if (products.length === 0) {
    return <div className="site-products__empty">{emptyMessage}</div>;
  }

  return (
    <div className="site-products__grid">
      {products.map((product, index) => (
        <SiteProductCard
          key={product.id}
          product={product}
          forceImageSkeleton={index < debugSkeletonVariants.length}
          imageSkeletonVariant={debugSkeletonVariants[index] ?? "wave"}
        />
      ))}
    </div>
  );
}

export function SiteProductsSection({
  title,
  products,
  ctaLabel,
  ctaTo,
  emptyMessage = "Ничего не найдено",
  loading = false,
  errorMessage = null,
  debugSkeletonVariants = [],
}: SiteProductsSectionProps) {
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
      <SiteProductsGrid
        products={products}
        emptyMessage={emptyMessage}
        loading={loading}
        errorMessage={errorMessage}
        debugSkeletonVariants={debugSkeletonVariants}
      />
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
              item.to ? (
                <Link key={item.label} className="site-footer__link" to={item.to}>
                  {item.label}
                </Link>
              ) : item.href ? (
                <a
                  key={item.label}
                  className="site-footer__link"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <span key={item.label} className="site-footer__link">
                  {item.label}
                </span>
              )
            ))}
          </div>
        </section>
      ))}
    </footer>
  );
}
