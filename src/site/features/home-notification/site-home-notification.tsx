import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteHomeNotificationPayload } from "../../runtime/site-home-notification-mock";
import { SiteImage } from "../image/site-image";
import { SiteWindowCloseButton, SiteWindowShell, SiteWindowTitlebar } from "../window-shell/site-window-shell";
import "./site-home-notification.css";

const SITE_HOME_NOTIFICATION_TRANSITION_MS = 240;

export function SiteHomeNotification({
  payload,
  onDismiss,
}: {
  payload: SiteHomeNotificationPayload;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimeoutRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);

  const beginDismiss = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsVisible(false);
    dismissTimeoutRef.current = window.setTimeout(() => {
      onDismiss();
    }, SITE_HOME_NOTIFICATION_TRANSITION_MS);
  }, [onDismiss]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const showTimeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 16);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        beginDismiss();
      }
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(showTimeoutId);
      if (dismissTimeoutRef.current !== null) {
        window.clearTimeout(dismissTimeoutRef.current);
      }
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [beginDismiss]);

  return (
    <div
      className={`site-home-notification${isVisible ? " site-home-notification--visible" : ""}`}
      role="presentation"
      onClick={beginDismiss}
    >
      <div className="site-home-notification__backdrop" aria-hidden="true" />
      <div
        className="site-home-notification__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-home-notification-title"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <SiteWindowShell className="site-home-notification__window" frameClassName="site-home-notification__frame">
          <SiteWindowTitlebar
            title={payload.windowLabel}
            titleId="site-home-notification-title"
            className="site-home-notification__titlebar"
            titleClassName="site-home-notification__window-label"
            closeButton={
              <SiteWindowCloseButton
                className="site-home-notification__close"
                ariaLabel="Закрыть уведомление"
                onClick={beginDismiss}
              />
            }
          />

          <div className="site-home-notification__image-shell">
            <SiteImage src={payload.imageSrc} alt={payload.imageAlt} className="site-home-notification__image" fillContainer />
          </div>

          <div className="site-home-notification__content">
            <div className="site-home-notification__copy">
              <p className="site-home-notification__title">{payload.title}</p>
              <p className="site-home-notification__description">{payload.description}</p>
            </div>
            <button
              type="button"
              className="site-home-notification__cta"
              onClick={() => {
                window.open(payload.ctaHref, "_blank", "noopener,noreferrer");
                beginDismiss();
              }}
            >
              <span className="site-home-notification__cta-label">{payload.ctaLabel}</span>
            </button>
          </div>
        </SiteWindowShell>
      </div>
    </div>
  );
}
