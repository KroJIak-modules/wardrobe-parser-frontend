import { Link } from "react-router-dom";
import type { SiteCartItem } from "../../runtime/use-site-cart";
import { formatSiteRubles } from "../../app/site-format";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage } from "../image/site-image";
import { SiteOldPrice } from "../price/site-old-price";
import { SiteWindowCloseButton, SiteWindowShell, SiteWindowTitlebar } from "../window-shell/site-window-shell";

export function SiteCartCard({
  item,
  quotedLinePriceRub,
  oldLinePriceRub,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: SiteCartItem;
  quotedLinePriceRub: number | null;
  oldLinePriceRub: number | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const { snapshot } = item;
  const snapshotLinePriceRub = snapshot.priceRub * item.quantity;
  const currentLinePriceRub = quotedLinePriceRub ?? snapshotLinePriceRub;
  const snapshotOldLinePriceRub = typeof snapshot.oldPriceRub === "number" ? snapshot.oldPriceRub * item.quantity : null;
  const displayOldLinePriceRub = oldLinePriceRub ?? snapshotOldLinePriceRub;
  const designerHref = buildDesignerCatalogHref(snapshot.designerId);
  const productHref = (() => {
    try {
      return new URL(snapshot.productUrl).pathname;
    } catch {
      return snapshot.productUrl;
    }
  })();

  return (
    <SiteWindowShell as="article" className="site-cart-card" frameClassName="site-cart-card__frame">
      <SiteWindowTitlebar
        title={snapshot.availabilityLabel}
        className="site-cart-card__window-bar"
        titleClassName="site-cart-card__availability"
        closeButton={
          <SiteWindowCloseButton
            className="site-cart-card__close"
            ariaLabel={`Убрать ${snapshot.name} из корзины`}
            onClick={onRemove}
          />
        }
      />

      <div className="site-cart-card__body">
        <div className="site-cart-card__media">
          {snapshot.imageSrc ? <SiteImage src={snapshot.imageSrc} alt={snapshot.imageAlt} className="site-cart-card__image" fillContainer /> : null}
        </div>

        <div className="site-cart-card__content">
          <div className="site-cart-card__copy">
            <Link to={designerHref} className="site-cart-card__brand-link">
              {snapshot.brand}
            </Link>
            <Link to={productHref} className="site-cart-card__name-link">
              {snapshot.name.toUpperCase()}
            </Link>
          </div>

          <div className="site-cart-card__footer">
            <div className="site-cart-card__meta">
              <div className="site-cart-card__meta-row">
                <span className="site-cart-card__meta-label">Размер</span>
                <span className="site-cart-card__meta-value">{snapshot.size}</span>
              </div>
              <div className="site-cart-card__meta-row">
                <span className="site-cart-card__meta-label">Количество</span>
                <div className="site-cart-card__quantity">
                  <button type="button" className="site-cart-card__qty-btn" aria-label={`Уменьшить количество ${snapshot.name}`} onClick={onDecrement}>
                    -
                  </button>
                  <span className="site-cart-card__qty-value">{item.quantity}</span>
                  <button type="button" className="site-cart-card__qty-btn" aria-label={`Увеличить количество ${snapshot.name}`} onClick={onIncrement}>
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="site-cart-card__price-stack">
              {displayOldLinePriceRub !== null && displayOldLinePriceRub > currentLinePriceRub ? (
                <SiteOldPrice className="site-cart-card__old-price" valueRub={displayOldLinePriceRub} />
              ) : null}
              <p className="site-cart-card__price">{formatSiteRubles(currentLinePriceRub)} ₽</p>
            </div>
          </div>
        </div>
      </div>
    </SiteWindowShell>
  );
}
