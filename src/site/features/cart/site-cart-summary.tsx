import { useEffect, useState, type CSSProperties } from "react";
import { formatSiteRubles } from "../../app/site-format";
import type { SiteCartQuoteProgress, SiteCartQuoteStatus } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import "./site-cart-svc-progress.css";

const SITE_CART_SVC_DESKTOP_MEDIA_QUERY = "(min-width: 1101px)";

function CopyIcon() {
  return (
    <svg className="site-cart-summary__copy-icon" viewBox="0 0 11 11" aria-hidden="true">
      <path d="M3.20833 1.375C2.70107 1.375 2.29167 1.7844 2.29167 2.29167V7.79167H3.20833V2.29167H7.79167V1.375H3.20833ZM4.58333 3.20833C4.07607 3.20833 3.66667 3.61774 3.66667 4.125V8.70833C3.66667 9.21559 4.07607 9.625 4.58333 9.625H9.16667C9.67393 9.625 10.0833 9.21559 10.0833 8.70833V4.125C10.0833 3.61774 9.67393 3.20833 9.16667 3.20833H4.58333ZM4.58333 4.125H9.16667V8.70833H4.58333V4.125Z" fill="currentColor" />
    </svg>
  );
}

function formatProgressHint(progress: SiteCartQuoteProgress) {
  if (progress.preorderSubtotalRub <= 0) {
    const firstLevel = progress.tiers[0]?.minRub;
    return firstLevel && firstLevel > 0
      ? `Добавьте товаров «Под заказ» ещё на ${formatSiteRubles(firstLevel)} ₽, чтобы достичь первого уровня.`
      : "Добавьте товары «Под заказ», чтобы получить выгодные условия.";
  }
  if (progress.amountToNextThresholdRub !== null && progress.amountToNextThresholdRub > 0) {
    return `Добавьте товаров «Под заказ» ещё на ${formatSiteRubles(progress.amountToNextThresholdRub)} ₽, чтобы перейти на следующий уровень.`;
  }
  return "Вы достигли максимального уровня выгодных условий.";
}

function SiteCartSvcProgress({ progress }: { progress: SiteCartQuoteProgress }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dividerCount = Math.max(0, progress.tiers.length - 1);
  const fillWidth = isMounted ? progress.percent : 0;

  return (
    <section className="site-cart-svc-progress" aria-label="Выгодные условия для товаров под заказ">
      <p className="site-cart-svc-progress__title">Чем больше товаров «Под заказ», тем выгоднее условия.</p>
      <div className="site-cart-svc-progress__track" aria-label={`Текущий уровень: ${Math.round(progress.percent)}%`}>
        <span className="site-cart-svc-progress__fill" style={{ "--site-cart-svc-progress-fill-width": `${fillWidth}%` } as CSSProperties} />
        {Array.from({ length: dividerCount }, (_, index) => (
          <span
            className="site-cart-svc-progress__divider"
            key={progress.tiers[index + 1]?.id ?? index}
            style={{ left: `${((index + 1) / progress.tiers.length) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="site-cart-svc-progress__detail">{formatProgressHint(progress)}</p>
    </section>
  );
}

export function SiteCartSummary({
  originalTotalPriceRub,
  finalTotalPriceRub,
  quoteStatus,
  svcProgress,
  hasItems,
  onSendRequest,
  onCopyRequest,
}: {
  originalTotalPriceRub: number;
  finalTotalPriceRub: number;
  quoteStatus: SiteCartQuoteStatus;
  svcProgress: SiteCartQuoteProgress | null;
  hasItems: boolean;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  const isDesktop = useSiteMediaQuery(SITE_CART_SVC_DESKTOP_MEDIA_QUERY);
  const quoteReady = quoteStatus === "ready";

  return (
    <div className="site-cart-summary-column">
      {isDesktop && quoteReady && svcProgress ? <SiteCartSvcProgress progress={svcProgress} /> : null}
      <aside className={hasItems ? "site-cart-summary" : "site-cart-summary site-cart-summary--empty"} aria-label="Итог и отправка запроса">
        <p className="site-cart-summary__total">
          {quoteReady ? <s className="site-cart-summary__original-total">{formatSiteRubles(originalTotalPriceRub)} ₽</s> : null}
          <span>Итого: {formatSiteRubles(quoteReady ? finalTotalPriceRub : originalTotalPriceRub)} ₽</span>
        </p>
        {quoteStatus === "loading" ? <p className="site-cart-summary__quote-status">Пересчитываем стоимость…</p> : null}
        {quoteStatus === "error" ? <p className="site-cart-summary__quote-status">Не удалось пересчитать стоимость</p> : null}
        <p className="site-cart-summary__description">
          {hasItems
            ? "После нажатия кнопки «Отправить запрос» откроется чат в Telegram. Сообщение с выбранными товарами сформируется автоматически. Отправьте его в чат для оформления заказа. Если сообщение не появилось автоматически, нажмите кнопку:"
            : "Добавьте товары в корзину, чтобы сформировать запрос на заказ и отправить его в Telegram."}
        </p>
        <button type="button" className="site-cart-summary__copy" onClick={onCopyRequest} disabled={!hasItems || !quoteReady}>
          <CopyIcon />
          <span>Скопировать запрос вручную</span>
        </button>
        <button type="button" className="site-cart-summary__send" onClick={onSendRequest} disabled={!hasItems || !quoteReady}>
          ОТПРАВИТЬ ЗАПРОС
        </button>
      </aside>
    </div>
  );
}
