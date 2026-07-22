import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storefrontHomeState } from "../../app/site-home-entry";
import { SiteCartView } from "../../features/cart/site-cart";
import { SiteHeader } from "../../features/header/site-header";
import { SiteMobileHomeHeader } from "../../features/header/site-mobile-home-header";
import { SiteFooterSection } from "../../features/storefront/site-storefront-sections";
import { useSiteActionItems, useSiteCart } from "../../runtime/use-site-cart";
import { useSiteMediaQuery } from "../../runtime/use-site-media-query";
import { useSiteNavigation } from "../../runtime/use-site-navigation";
import "./site-cart-page.css";

const SITE_CART_MOBILE_MEDIA_QUERY = "(max-width: 640px)";

function formatTelegramRubles(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value).replace(/\s/g, ".")}₽`;
}

function buildTelegramMessage(items: ReturnType<typeof useSiteCart>["items"], totalPriceRub: number) {
  const itemBlocks = items.map((item) =>
    [
      `${item.brand} ${item.name} (${item.productUrl})`,
      `Источник - ${item.sourceUrl}`,
      `Размер - ${item.size}`,
      `Количество - ${item.quantity}`,
      `Стоимость - ${formatTelegramRubles(item.priceRub * item.quantity)}`,
    ].join("\n")
  );

  return `Привет! Хочу приобрести:\n\n${itemBlocks.join("\n\n")}\n\nИтого - ${formatTelegramRubles(totalPriceRub)}`;
}

function buildTelegramHref(message: string) {
  return `https://t.me/shellogorder?text=${encodeURIComponent(message)}`;
}

export function SiteCartPage() {
  const navigate = useNavigate();
  const actionItems = useSiteActionItems();
  const { items, totalPriceRub, hasItems, updateQuantity, removeItem } = useSiteCart();
  const { payload: navigation, menuItems, dropdownMenus } = useSiteNavigation();
  const [searchValue, setSearchValue] = useState("");
  const isMobileLayout = useSiteMediaQuery(SITE_CART_MOBILE_MEDIA_QUERY);
  const telegramMessage = useMemo(() => buildTelegramMessage(items, totalPriceRub), [items, totalPriceRub]);

  useEffect(() => {
    document.title = "Anton Shell — Корзина";
    window.scrollTo(0, 0);
  }, []);

  const handleSendRequest = useCallback(() => {
    if (!hasItems) {
      return;
    }

    const telegramHref = buildTelegramHref(telegramMessage);
    window.open(telegramHref, "_blank", "noopener,noreferrer");
  }, [hasItems, telegramMessage]);

  const handleCopyRequest = useCallback(async () => {
    if (!hasItems) {
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
  }, [hasItems, telegramMessage]);

  return (
    <main className={`site-cart-page${isMobileLayout ? " site-cart-page--mobile" : ""}`}>
      {isMobileLayout ? (
        <SiteMobileHomeHeader
          navigation={navigation}
          onLogoActivate={() => {
            navigate("/", { state: storefrontHomeState() });
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
        totalPriceRub={totalPriceRub}
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
