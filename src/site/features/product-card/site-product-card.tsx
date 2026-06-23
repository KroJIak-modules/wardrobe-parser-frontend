import { Link } from "react-router-dom";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import type { SiteProduct } from "../storefront/site-storefront-contracts";
import "./site-product-card.css";

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function SiteProductCard({
  product,
  imageLoading = "lazy",
}: {
  product: SiteProduct;
  imageLoading?: "lazy" | "eager";
}) {
  const designerHref = product.designerId ? buildDesignerCatalogHref(product.designerId) : null;

  return (
    <article className="site-product-tile">
      <div className="site-product-tile__shell">
        <Link to={`/show/${product.id}`} className="site-product-tile__media-link" aria-label={`${product.brand} ${product.name}`}>
          <div className="site-product-tile__media">
            <span className="site-product-tile__watermark" aria-hidden="true" />
            {product.imageSrc ? (
              <img
                src={product.imageSrc}
                alt={product.imageAlt}
                className="site-product-tile__image"
                loading={imageLoading}
                decoding={imageLoading === "eager" ? "sync" : "async"}
                fetchPriority={imageLoading === "eager" ? "high" : "auto"}
              />
            ) : (
              <div className="site-product-tile__image site-product-tile__image--empty">Фото скоро появится</div>
            )}
          </div>
        </Link>
        <div className="site-product-tile__meta">
          {designerHref ? (
            <Link to={designerHref} className="site-product-tile__brand-link">
              {product.brand}
            </Link>
          ) : (
            <p className="site-product-tile__brand">{product.brand}</p>
          )}
          <Link to={`/show/${product.id}`} className="site-product-tile__content-link">
            <p className="site-product-tile__name">{product.name}</p>
            <p className="site-product-tile__statusline">
              <span className="site-product-tile__price">{formatRubles(product.priceRub)} ₽</span>
              <span className="site-product-tile__divider">-</span>
              <span className="site-product-tile__availability">{product.availability}</span>
            </p>
          </Link>
        </div>
      </div>
    </article>
  );
}
