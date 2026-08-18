import { useEffect, useState, type CSSProperties } from "react";
import { formatSiteRubles } from "../../app/site-format";
import { SiteOldPrice } from "../price/site-old-price";
import type { SiteCartQuoteProgress, SiteCartQuoteStatus } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import "./site-cart-svc-progress.css";

const SITE_CART_SVC_PROGRESS_MEDIA_QUERY = "(min-width: 0px)";
const SITE_CART_SVC_TABLET_MEDIA_QUERY = "(min-width: 641px) and (max-width: 1100px)";
const SITE_CART_SVC_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

function CopyIcon() {
  return (
    <svg className="site-cart-summary__copy-icon" viewBox="0 0 11 11" aria-hidden="true">
      <path d="M3.20833 1.375C2.70107 1.375 2.29167 1.7844 2.29167 2.29167V7.79167H3.20833V2.29167H7.79167V1.375H3.20833ZM4.58333 3.20833C4.07607 3.20833 3.66667 3.61774 3.66667 4.125V8.70833C3.66667 9.21559 4.07607 9.625 4.58333 9.625H9.16667C9.67393 9.625 10.0833 9.21559 10.0833 8.70833V4.125C10.0833 3.61774 9.67393 3.20833 9.16667 3.20833H4.58333ZM4.58333 4.125H9.16667V8.70833H4.58333V4.125Z" fill="currentColor" />
    </svg>
  );
}

function formatProgressHint(progress: SiteCartQuoteProgress | null, isLoading: boolean) {
  if (progress === null) {
    return isLoading ? "Рассчитываем выгодные условия…" : "Добавьте товары «Под заказ», чтобы получить выгодные условия.";
  }
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

function SiteCartSvcProgress({ progress, isLoading }: { progress: SiteCartQuoteProgress | null; isLoading: boolean }) {
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const tiers = progress?.tiers ?? [];
  const dividerCount = Math.max(0, tiers.length - 1);
  const isTablet = useSiteMediaQuery(SITE_CART_SVC_TABLET_MEDIA_QUERY);
  const isMobile = useSiteMediaQuery(SITE_CART_SVC_MOBILE_MEDIA_QUERY);
  const trackWidth = isTablet ? 524 : isMobile ? 282 : 362;
  const trackFillWidth = trackWidth - (isMobile ? 2 : 4);
  const targetFillWidth = progress?.percent && progress.percent > 0
    ? Math.max(19, trackFillWidth * progress.percent / 100)
    : 0;
  const fillWidth = hasEntered ? targetFillWidth : 0;

  return (
    <section className="site-cart-svc-progress" aria-label="Выгодные условия для товаров под заказ">
      <p className="site-cart-svc-progress__title">Чем больше товаров «Под заказ», тем выгоднее условия.</p>
      <div className="site-cart-svc-progress__track" aria-label={`Текущий уровень: ${Math.round(progress?.percent ?? 0)}%`}>
        <span className="site-cart-svc-progress__fill" style={{ "--site-cart-svc-progress-fill-width": `${fillWidth}px` } as CSSProperties} />
        {Array.from({ length: dividerCount }, (_, index) => (
          <span
            className="site-cart-svc-progress__divider"
            key={tiers[index + 1]?.id ?? index}
            style={{ left: `${((index + 1) / tiers.length) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="site-cart-svc-progress__detail">{formatProgressHint(progress, isLoading)}</p>
    </section>
  );
}

export function SiteCartSummary({
  originalTotalPriceRub,
  finalTotalPriceRub,
  quoteStatus,
  hasQuote,
  svcProgress,
  hasItems,
  onSendRequest,
  onCopyRequest,
}: {
  originalTotalPriceRub: number | null;
  finalTotalPriceRub: number;
  quoteStatus: SiteCartQuoteStatus;
  hasQuote: boolean;
  svcProgress: SiteCartQuoteProgress | null;
  hasItems: boolean;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  const showsSvcProgress = useSiteMediaQuery(SITE_CART_SVC_PROGRESS_MEDIA_QUERY);
  const hasDisplayQuote = hasQuote && quoteStatus !== "error";
  const quoteReady = quoteStatus === "ready";
  const isQuoting = quoteStatus === "loading";

  return (
    <div className="site-cart-summary-column">
      {showsSvcProgress ? <SiteCartSvcProgress progress={svcProgress} isLoading={isQuoting} /> : null}
      <aside className={hasItems ? "site-cart-summary" : "site-cart-summary site-cart-summary--empty"} aria-label="Итог и отправка запроса">
        {hasItems ? (
          <>
            <p className="site-cart-summary__total">
              <span>Итого:</span>
              {hasDisplayQuote && originalTotalPriceRub !== null && originalTotalPriceRub > finalTotalPriceRub ? (
                <SiteOldPrice className="site-cart-summary__original-total" valueRub={originalTotalPriceRub} />
              ) : null}
              <span>{formatSiteRubles(finalTotalPriceRub)} ₽</span>
            </p>
            {isQuoting ? <p className="site-cart-summary__quote-status">Пересчитываем стоимость…</p> : null}
            {quoteStatus === "error" ? <p className="site-cart-summary__quote-status">Не удалось пересчитать стоимость</p> : null}
            <p className="site-cart-summary__description">После нажатия кнопки «Отправить запрос» откроется чат в Telegram. Сообщение с выбранными товарами сформируется автоматически. Отправьте его в чат для оформления заказа. Если сообщение не появилось автоматически, нажмите кнопку:</p>
            <button type="button" className="site-cart-summary__copy" onClick={onCopyRequest} disabled={!quoteReady}>
              <CopyIcon />
              <span>Скопировать запрос вручную</span>
            </button>
            <button type="button" className="site-cart-summary__send" onClick={onSendRequest} disabled={!quoteReady}>
              ОТПРАВИТЬ ЗАПРОС
            </button>
          </>
        ) : (
          <>
            <p className="site-cart-summary__total">Итого: {formatSiteRubles(0)} ₽</p>
            <p className="site-cart-summary__description">Добавьте товары в корзину, чтобы сформировать запрос на заказ и отправить его в Telegram.</p>
            <button type="button" className="site-cart-summary__copy" onClick={onCopyRequest} disabled>
              <CopyIcon />
              <span>Скопировать запрос вручную</span>
            </button>
            <button type="button" className="site-cart-summary__send" onClick={onSendRequest} disabled>
              ОТПРАВИТЬ ЗАПРОС
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
