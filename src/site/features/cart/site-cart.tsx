import type { SiteCartItem, SiteCartQuote, SiteCartQuoteProgress, SiteCartQuoteStatus } from "../../runtime/use-site-cart";
import { SiteCartCard } from "./site-cart-card";
import { SiteCartSummary } from "./site-cart-summary";
import "./site-cart.css";

export function SiteCartView({
  items,
  quoteItems,
  originalTotalPriceRub,
  finalTotalPriceRub,
  quoteStatus,
  hasQuote,
  svcProgress,
  hasItems,
  onIncrement,
  onDecrement,
  onRemove,
  onSendRequest,
  onCopyRequest,
}: {
  items: readonly SiteCartItem[];
  quoteItems: SiteCartQuote["items"];
  originalTotalPriceRub: number | null;
  finalTotalPriceRub: number;
  quoteStatus: SiteCartQuoteStatus;
  hasQuote: boolean;
  svcProgress: SiteCartQuoteProgress | null;
  hasItems: boolean;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  const quoteItemByVariantId = new Map(quoteItems.map((item) => [item.variant_id, item]));

  return (
    <section className="site-cart" aria-labelledby="site-cart-title">
      <h1 id="site-cart-title" className="site-cart__title">КОРЗИНА</h1>
      <div className="site-cart__layout">
        <div className="site-cart__items" aria-label="Товары в корзине">
          {hasItems ? items.map((item) => (
            <SiteCartCard
              key={item.id}
              item={item}
              quotedLinePriceRub={quoteItemByVariantId.get(item.variantId)?.final_line_total_rub ?? null}
              oldLinePriceRub={quoteItemByVariantId.get(item.variantId)?.old_line_total_rub ?? null}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          )) : <div className="site-cart__empty">Пока здесь пусто</div>}
        </div>
        <SiteCartSummary
          originalTotalPriceRub={originalTotalPriceRub}
          finalTotalPriceRub={finalTotalPriceRub}
          quoteStatus={quoteStatus}
          hasQuote={hasQuote}
          svcProgress={svcProgress}
          hasItems={hasItems}
          onSendRequest={onSendRequest}
          onCopyRequest={onCopyRequest}
        />
      </div>
    </section>
  );
}
