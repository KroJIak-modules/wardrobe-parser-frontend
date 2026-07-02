import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SITE_LOGO_URL, resolveSitePublicAssetUrl } from "../../app/site-public-asset";
import type { SiteApiNavigation } from "../../runtime/site-public-api";
import { useSiteCart } from "../../runtime/use-site-cart";
import { useSitePageScrollLock } from "../shared/use-site-page-scroll-lock";
import { SiteMobileMenu } from "./site-mobile-menu";
import "./site-mobile-home-header.css";

export function SiteMobileHomeHeader({
  navigation,
  onLogoActivate,
}: {
  navigation: SiteApiNavigation | null;
  onLogoActivate?: () => void;
}) {
  const navigate = useNavigate();
  const { totalItems } = useSiteCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const cartCountLabel = totalItems >= 10 ? "9+" : `${totalItems}`;
  const hasCartCount = totalItems > 0;
  useSitePageScrollLock(isMenuOpen);

  const openMenu = () => {
    setIsMenuClosing(false);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    if (!isMenuOpen || isMenuClosing) {
      return;
    }

    setIsMenuClosing(true);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  return (
    <>
      {onLogoActivate ? (
        <button type="button" className="site-mobile-home-header__logo-shell" aria-label="Anton Shell" onClick={onLogoActivate}>
          <img className="site-mobile-home-header__logo-image" src={SITE_LOGO_URL} alt="" loading="eager" decoding="sync" />
        </button>
      ) : null}
      <header className="site-mobile-home-header" aria-label="Мобильная шапка">
        <button
          type="button"
          className="site-mobile-home-header__button site-mobile-home-header__button--burger"
          aria-label="Меню"
          aria-expanded={isMenuOpen && !isMenuClosing}
          onClick={toggleMenu}
        >
          <img
            aria-hidden="true"
            className="site-mobile-home-header__button-image"
            src={resolveSitePublicAssetUrl("/site-mock/mobile-header/burger.svg")}
            alt=""
          />
        </button>
        <button
          type="button"
          className="site-mobile-home-header__button site-mobile-home-header__button--cart"
          aria-label={hasCartCount ? `Корзина, ${cartCountLabel}` : "Корзина"}
          onClick={() => navigate("/cart")}
        >
          <img
            aria-hidden="true"
            className="site-mobile-home-header__button-image"
            src={resolveSitePublicAssetUrl("/site-mock/mobile-header/cart.svg")}
            alt=""
          />
          {hasCartCount ? (
            <span
              aria-hidden="true"
              className={
                cartCountLabel.length > 1
                  ? "site-mobile-home-header__cart-count site-mobile-home-header__cart-count--wide"
                  : "site-mobile-home-header__cart-count"
              }
            >
              {cartCountLabel}
            </span>
          ) : null}
        </button>
      </header>
      {isMenuOpen ? (
        <SiteMobileMenu
          navigation={navigation}
          isClosing={isMenuClosing}
          onClose={closeMenu}
          onCloseAnimationEnd={() => {
            setIsMenuOpen(false);
            setIsMenuClosing(false);
          }}
        />
      ) : null}
    </>
  );
}
