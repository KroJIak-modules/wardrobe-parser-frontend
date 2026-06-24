import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { SiteHomeNotificationPayload } from "../../runtime/site-home-notification-mock";
import { SiteWindowShell } from "../window-shell/site-window-shell";
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
  const [dialogScale, setDialogScale] = useState(1);
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

  useEffect(() => {
    const updateDialogScale = () => {
      const nextScale = Math.min(1, Math.max(0.72, (window.innerWidth - 24) / 389));
      setDialogScale(nextScale);
    };

    updateDialogScale();
    window.addEventListener("resize", updateDialogScale);
    return () => {
      window.removeEventListener("resize", updateDialogScale);
    };
  }, []);

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
        style={{ "--site-home-notification-scale": dialogScale } as CSSProperties}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <SiteWindowShell className="site-home-notification__window" frameClassName="site-home-notification__frame">
          <div className="site-home-notification__titlebar">
            <p id="site-home-notification-title" className="site-home-notification__window-label">
              {payload.windowLabel}
            </p>
            <button
              type="button"
              className="site-home-notification__close"
              aria-label="Закрыть уведомление"
              onClick={beginDismiss}
            >
              <img
                src="/site-mock/home-notification/close-icon-figma.svg"
                alt=""
                aria-hidden="true"
                className="site-home-notification__close-icon"
              />
            </button>
          </div>

          <div className="site-home-notification__image-shell">
            <img src={payload.imageSrc} alt={payload.imageAlt} className="site-home-notification__image" />
          </div>

          <div className="site-home-notification__content">
            <p className="site-home-notification__title">{payload.title}</p>
            <p className="site-home-notification__description">{payload.description}</p>
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
