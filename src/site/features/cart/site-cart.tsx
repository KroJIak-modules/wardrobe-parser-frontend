import type { SiteCartItem, SiteCartQuoteProgress, SiteCartQuoteStatus } from "../../runtime/use-site-cart";
import { SiteCartCard } from "./site-cart-card";
import { SiteCartSummary } from "./site-cart-summary";
import "./site-cart.css";

export function SiteCartView({
  items,
  originalTotalPriceRub,
  finalTotalPriceRub,
  quoteStatus,
  svcProgress,
  hasItems,
  onIncrement,
  onDecrement,
  onRemove,
  onSendRequest,
  onCopyRequest,
}: {
  items: readonly SiteCartItem[];
  originalTotalPriceRub: number;
  finalTotalPriceRub: number;
  quoteStatus: SiteCartQuoteStatus;
  svcProgress: SiteCartQuoteProgress | null;
  hasItems: boolean;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onSendRequest: () => void;
  onCopyRequest: () => void;
}) {
  return (
    <section className="site-cart" aria-labelledby="site-cart-title">
      <h1 id="site-cart-title" className="site-cart__title">КОРЗИНА</h1>
      <div className="site-cart__layout">
        <div className="site-cart__items" aria-label="Товары в корзине">
          {hasItems ? items.map((item) => (
            <SiteCartCard key={item.id} item={item} onIncrement={() => onIncrement(item.id)} onDecrement={() => onDecrement(item.id)} onRemove={() => onRemove(item.id)} />
          )) : <div className="site-cart__empty">Пока здесь пусто</div>}
        </div>
        <SiteCartSummary
          originalTotalPriceRub={originalTotalPriceRub}
          finalTotalPriceRub={finalTotalPriceRub}
          quoteStatus={quoteStatus}
          svcProgress={svcProgress}
          hasItems={hasItems}
          onSendRequest={onSendRequest}
          onCopyRequest={onCopyRequest}
        />
      </div>
    </section>
  );
}
