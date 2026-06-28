import { Link } from "react-router-dom";
import type { SiteCartItem } from "../../runtime/site-cart-mock";
import { formatSiteRubles } from "../../app/site-format";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage } from "../image/site-image";
import { SiteWindowCloseButton, SiteWindowShell, SiteWindowTitlebar } from "../window-shell/site-window-shell";

export function SiteCartCard({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: SiteCartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const designerHref = buildDesignerCatalogHref(item.designerId);
  const productHref = `/show/${item.productId}`;

  return (
    <SiteWindowShell as="article" className="site-cart-card" frameClassName="site-cart-card__frame">
      <SiteWindowTitlebar
        title={item.availabilityLabel}
        className="site-cart-card__window-bar"
        titleClassName="site-cart-card__availability"
        closeButton={
          <SiteWindowCloseButton
            className="site-cart-card__close"
            ariaLabel={`Убрать ${item.name} из корзины`}
            onClick={onRemove}
          />
        }
      />

      <div className="site-cart-card__body">
        <div className="site-cart-card__media">
          {item.imageSrc ? <SiteImage src={item.imageSrc} alt={item.imageAlt} className="site-cart-card__image" fillContainer /> : null}
        </div>

        <div className="site-cart-card__content">
          <div className="site-cart-card__copy">
            <Link to={designerHref} className="site-cart-card__brand-link">
              {item.brand}
            </Link>
            <Link to={productHref} className="site-cart-card__name-link">
              {item.name.toUpperCase()}
            </Link>
          </div>

          <div className="site-cart-card__footer">
            <div className="site-cart-card__meta">
              <div className="site-cart-card__meta-row">
                <span className="site-cart-card__meta-label">Размер</span>
                <span className="site-cart-card__meta-value">{item.size}</span>
              </div>
              <div className="site-cart-card__meta-row">
                <span className="site-cart-card__meta-label">Количество</span>
                <div className="site-cart-card__quantity">
                  <button type="button" className="site-cart-card__qty-btn" aria-label={`Уменьшить количество ${item.name}`} onClick={onDecrement}>
                    -
                  </button>
                  <span className="site-cart-card__qty-value">{item.quantity}</span>
                  <button type="button" className="site-cart-card__qty-btn" aria-label={`Увеличить количество ${item.name}`} onClick={onIncrement}>
                    +
                  </button>
                </div>
              </div>
            </div>

            <p className="site-cart-card__price">{formatSiteRubles(item.priceRub * item.quantity)} ₽</p>
          </div>
        </div>
      </div>
    </SiteWindowShell>
  );
}
