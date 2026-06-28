import { formatSiteRubles } from "../../app/site-format";

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

export function SiteCartSummary({
  totalPriceRub,
  hasItems,
  onSendRequest,
  onCopyRequest,
}: {
  totalPriceRub: number;
  hasItems: boolean;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  return (
    <aside className={hasItems ? "site-cart-summary" : "site-cart-summary site-cart-summary--empty"} aria-label="Итог и отправка запроса">
      <p className="site-cart-summary__total">Итого: {formatSiteRubles(totalPriceRub)} ₽</p>
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
  );
}
