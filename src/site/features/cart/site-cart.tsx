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

function WindowCloseIcon() {
  return (
    <svg aria-hidden="true" className="site-cart-card__close-icon" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.375 0.375C8.65114 0.375 8.875 0.598858 8.875 0.875V7.875H15.875C16.1511 7.875 16.375 8.09886 16.375 8.375C16.375 8.65114 16.1511 8.875 15.875 8.875H8.875V15.875C8.875 16.1511 8.65114 16.375 8.375 16.375C8.09886 16.375 7.875 16.1511 7.875 15.875V8.875H0.875C0.598858 8.875 0.375 8.65114 0.375 8.375C0.375 8.09886 0.598858 7.875 0.875 7.875H7.875V0.875C7.875 0.598858 8.09886 0.375 8.375 0.375Z"
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
  return (
    <article className="site-cart-card">
      <div className="site-cart-card__window-bar">
        <p className="site-cart-card__availability">{item.availabilityLabel.toUpperCase()}</p>
        <button type="button" className="site-cart-card__close" aria-label={`Убрать ${item.name} из корзины`} onClick={onRemove}>
          <WindowCloseIcon />
        </button>
      </div>

      <div className="site-cart-card__body">
        <div className="site-cart-card__media">
          {item.imageSrc ? <img src={item.imageSrc} alt={item.imageAlt} className="site-cart-card__image" /> : null}
        </div>

        <div className="site-cart-card__content">
          <div className="site-cart-card__copy">
            <p className="site-cart-card__brand">{item.brand}</p>
            <p className="site-cart-card__name">{item.name.toUpperCase()}</p>
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
    </article>
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

        <aside className="site-cart-summary" aria-label="Итог и отправка запроса">
          <p className="site-cart-summary__total">Итого: {formatRubles(totalPriceRub)} ₽</p>
          <p className="site-cart-summary__description">
            {hasItems
              ? "После нажатия кнопки «Отправить запрос» откроется чат в Telegram. Сообщение с выбранными товарами сформируется автоматически. Отправьте его в чат для оформления заказа. Если сообщение не появилось автоматически, нажмите кнопку:"
              : "Добавьте товары в корзину, чтобы сформировать запрос на заказ и отправить его в Telegram."}
          </p>
          <button type="button" className="site-cart-summary__copy" onClick={onCopyRequest}>
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
