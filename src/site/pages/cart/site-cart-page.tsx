import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { heroHomeState } from "../../app/site-home-entry";
import { SiteCartView } from "../../features/cart/site-cart";
import { SiteHeader } from "../../features/header/site-header";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems, useSiteCart } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteNavigation } from "../../runtime/use-site-navigation";
import "./site-cart-page.css";

const SITE_CART_MOBILE_MEDIA_QUERY = "(max-width: 640px)";
const SITE_CART_TABLET_HEADER_MEDIA_QUERY = "(max-width: 1100px)";

function formatTelegramRubles(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value).replace(/\s/g, ".")}₽`;
}

function buildTelegramMessage(items: ReturnType<typeof useSiteCart>["items"], quote: NonNullable<ReturnType<typeof useSiteCart>["quote"]>) {
  const quoteLineTotalByVariantId = new Map(quote.items.map((item) => [item.variant_id, item.final_line_total_rub]));
  const itemBlocks = items.map(({ snapshot, variantId, quantity }) =>
    [
      `${snapshot.brand} ${snapshot.name} (${snapshot.productUrl})`,
      `Источник - ${snapshot.sourceUrl}`,
      `Размер - ${snapshot.size}`,
      `Количество - ${quantity}`,
      `Стоимость - ${formatTelegramRubles(quoteLineTotalByVariantId.get(variantId) ?? 0)}`,
    ].join("\n")
  );

  return `Привет! Хочу приобрести:\n\n${itemBlocks.join("\n\n")}\n\nИтого - ${formatTelegramRubles(quote.finalTotalRub)}`;
}

function buildTelegramHref(message: string) {
  return `https://t.me/shellogorder?text=${encodeURIComponent(message)}`;
}

export function SiteCartPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { items, quote, quoteStatus, hasItems, updateQuantity, removeItem } = useSiteCart();
  const { payload: navigation, menuItems, dropdownMenus } = useSiteNavigation();
  const [searchValue, setSearchValue] = useState("");
  const isMobileLayout = useSiteMediaQuery(SITE_CART_MOBILE_MEDIA_QUERY);
  const usesTabletHeader = useSiteMediaQuery(SITE_CART_TABLET_HEADER_MEDIA_QUERY);
  // The quote is the sole source of payable cart prices. Until it arrives, price UI is withheld rather than using stale local snapshots.
  const quotedOriginalPriceRub = quote?.originalTotalRub ?? null;
  const quotedTotalPriceRub = quote?.finalTotalRub ?? 0;
  const telegramMessage = useMemo(() => (quote ? buildTelegramMessage(items, quote) : ""), [items, quote]);

  useEffect(() => {
    document.title = "Anton Shell — Корзина";
    window.scrollTo(0, 0);
  }, []);

  const handleSendRequest = useCallback(() => {
    if (!hasItems || !quote) {
      return;
    }

    const telegramHref = buildTelegramHref(telegramMessage);
    window.open(telegramHref, "_blank", "noopener,noreferrer");
  }, [hasItems, quote, telegramMessage]);

  const handleCopyRequest = useCallback(async () => {
    if (!hasItems || !quote) {
      return;
    }

    try {
      await navigator.clipboard.writeText(telegramMessage);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = telegramMessage;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }, [hasItems, quote, telegramMessage]);

  return (
    <main className={`site-cart-page${isMobileLayout ? " site-cart-page--mobile" : ""}`}>
      {usesTabletHeader ? (
        <SiteMobileHomeHeader
          navigation={navigation}
          layout={isMobileLayout ? "mobile" : "tablet"}
          onLogoActivate={() => {
            navigate("/", { state: heroHomeState() });
          }}
        />
      ) : (
        <SiteHeader
          theme="light"
          menuItems={menuItems}
          dropdownMenus={dropdownMenus}
          actionItems={actionItems}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          onSearchSubmit={(value) => {
            const params = new URLSearchParams();
            if (value !== "") {
              params.set("q", value);
            }

            navigate({
              pathname: "/catalog",
              search: params.toString() ? `?${params.toString()}` : "",
            });
          }}
        />
      )}

      <SiteCartView
        items={items}
        quoteItems={quote?.items ?? []}
        originalTotalPriceRub={quotedOriginalPriceRub}
        finalTotalPriceRub={quotedTotalPriceRub}
        quoteStatus={quoteStatus}
        hasQuote={quote !== null}
        svcProgress={quote?.svcProgress ?? null}
        hasItems={hasItems}
        onIncrement={(itemId) => {
          const item = items.find((entry) => entry.id === itemId);
          if (!item) {
            return;
          }

          updateQuantity(itemId, item.quantity + 1);
        }}
        onDecrement={(itemId) => {
          const item = items.find((entry) => entry.id === itemId);
          if (!item) {
            return;
          }

          updateQuantity(itemId, item.quantity - 1);
        }}
        onRemove={removeItem}
        onSendRequest={handleSendRequest}
        onCopyRequest={handleCopyRequest}
      />

      <SiteFooterSection layout={isMobileLayout ? "mobile" : "desktop"} />
    </main>
  );
}
