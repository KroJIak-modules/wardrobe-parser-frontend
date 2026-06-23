import { useEffect } from "react";
import type { SiteHomeNotificationPayload } from "../../runtime/site-home-notification-mock";
import "./site-home-notification.css";

export function SiteHomeNotification({
  payload,
  onDismiss,
}: {
  payload: SiteHomeNotificationPayload;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div className="site-home-notification" role="presentation" onClick={onDismiss}>
      <div
        className="site-home-notification__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-home-notification-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="site-home-notification__window">
          <img
            src="/site-mock/product-detail/sources-modal/window-shell.svg"
            alt=""
            aria-hidden="true"
            className="site-home-notification__shell"
          />
          <div className="site-home-notification__titlebar">
            <img
              src="/site-mock/cart-window-bar.png"
              alt=""
              aria-hidden="true"
              className="site-home-notification__titlebar-image"
            />
            <p className="site-home-notification__window-label">{payload.windowLabel}</p>
            <button
              type="button"
              className="site-home-notification__close"
              aria-label="Закрыть уведомление"
              onClick={onDismiss}
            >
              <img
                src="/site-mock/product-detail/sources-modal/close-icon.svg"
                alt=""
                aria-hidden="true"
                className="site-home-notification__close-icon"
              />
            </button>
          </div>

          <div className="site-home-notification__body">
            <div className="site-home-notification__image-shell">
              <img src={payload.imageSrc} alt={payload.imageAlt} className="site-home-notification__image" />
            </div>

            <div className="site-home-notification__content">
              <h2 id="site-home-notification-title" className="site-home-notification__title">
                {payload.title}
              </h2>
              <p className="site-home-notification__description">{payload.description}</p>
            </div>

            <button
              type="button"
              className="site-home-notification__cta"
              onClick={() => {
                onDismiss();
                window.open(payload.ctaHref, "_blank", "noopener,noreferrer");
              }}
            >
              {payload.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
