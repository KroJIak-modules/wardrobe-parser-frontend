import { Link } from "react-router-dom";
import { buildDesignerCatalogHref } from "../catalog/site-catalog-query";
import { SiteImage } from "../image/site-image";
import { SiteWindowCloseButton, SiteWindowShell, SiteWindowTitlebar } from "../window-shell/site-window-shell";
import type { SiteCartItem } from "../../runtime/site-cart-mock";
import "./site-cart.css";

function formatRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="site-cart-summary__copy-icon" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.20833 1.375C2.70107 1.375 2.29167 1.7844 2.29167 2.29167V7.79167H3.20833V2.29167H7.79167V1.375H3.20833ZM4.58333 3.20833C4.07607 3.20833 3.66667 3.61774 3.66667 4.125V8.70833C3.66667 9.21559 4.07607 9.625 4.58333 9.625H9.16667C9.67393 9.625 10.0833 9.21559 10.0833 8.70833V4.125C10.0833 3.61774 9.67393 3.20833 9.16667 3.20833H4.58333ZM4.58333 4.125H9.16667V8.70833H4.58333V4.125Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SiteCartCard({
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

            <p className="site-cart-card__price">{formatRubles(item.priceRub * item.quantity)} ₽</p>
          </div>
        </div>
      </div>
    </SiteWindowShell>
  );
}

export function SiteCartView({
  items,
  totalPriceRub,
  hasItems,
  onIncrement,
  onDecrement,
  onRemove,
  onSendRequest,
  onCopyRequest,
}: {
  items: readonly SiteCartItem[];
  totalPriceRub: number;
  hasItems: boolean;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  return (
    <section className="site-cart" aria-labelledby="site-cart-title">
      <h1 id="site-cart-title" className="site-cart__title">
        КОРЗИНА
      </h1>

      <div className="site-cart__layout">
        <div className="site-cart__items" aria-label="Товары в корзине">
          {hasItems ? (
            items.map((item) => (
              <SiteCartCard
                key={item.id}
                item={item}
                onIncrement={() => onIncrement(item.id)}
                onDecrement={() => onDecrement(item.id)}
                onRemove={() => onRemove(item.id)}
              />
            ))
          ) : (
            <div className="site-cart__empty">Пока здесь пусто</div>
          )}
        </div>

        <aside className={hasItems ? "site-cart-summary" : "site-cart-summary site-cart-summary--empty"} aria-label="Итог и отправка запроса">
          <p className="site-cart-summary__total">Итого: {formatRubles(totalPriceRub)} ₽</p>
          <p className="site-cart-summary__description">
            {hasItems
              ? "После нажатия кнопки «Отправить запрос» откроется чат в Telegram. Сообщение с выбранными товарами сформируется автоматически. Отправьте его в чат для оформления заказа. Если сообщение не появилось автоматически, нажмите кнопку:"
              : "Добавьте товары в корзину, чтобы сформировать запрос на заказ и отправить его в Telegram."}
          </p>
          <button type="button" className="site-cart-summary__copy" onClick={onCopyRequest} disabled={!hasItems}>
            <CopyIcon />
            <span>Скопировать запрос вручную</span>
          </button>
          <button type="button" className="site-cart-summary__send" onClick={onSendRequest} disabled={!hasItems}>
            ОТПРАВИТЬ ЗАПРОС
          </button>
        </aside>
      </div>
    </section>
  );
}
