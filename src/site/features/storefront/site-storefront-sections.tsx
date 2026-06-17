import { useEffect, useMemo, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % siteCarouselSlides.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, []);

  const slides = useMemo(
    () =>
      siteCarouselSlides.map((slide, index) => ({
        ...slide,
        slot: getCarouselSlot(index, activeIndex, siteCarouselSlides.length),
      })),
    [activeIndex]
  );

  return (
    <section className="site-carousel" aria-label="Карусель фотографий">
      <div className="site-carousel__viewport">
        {slides.map((slide) => (
          <figure
            key={slide.id}
            className="site-carousel__slide"
            data-slot={slide.slot}
            aria-hidden={slide.slot === "center" ? "false" : "true"}
          >
            <img src={slide.imageSrc} alt={slide.alt} className="site-carousel__image" />
          </figure>
        ))}
        <button
          type="button"
          className="site-carousel__arrow site-carousel__arrow--left"
          aria-label="Предыдущий кадр"
          onClick={() =>
            setActiveIndex((current) => (current + siteCarouselSlides.length - 1) % siteCarouselSlides.length)
          }
        >
          <span className="site-carousel__arrow-shape" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="site-carousel__arrow site-carousel__arrow--right"
          aria-label="Следующий кадр"
          onClick={() => setActiveIndex((current) => (current + 1) % siteCarouselSlides.length)}
        >
          <span className="site-carousel__arrow-shape" aria-hidden="true" />
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
