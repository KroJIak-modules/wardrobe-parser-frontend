import { useCallback, useEffect, useMemo, useState } from "react";
import { siteHomeNotificationEmptyPayload } from "./site-home-notification-static";
import { siteApiJson, type SiteApiHomeNotificationResponse } from "./site-public-api";

const SITE_HOME_NOTIFICATION_STORAGE_PREFIX = "site-home-notification-seen";

function buildStorageKey(id: string) {
  return `${SITE_HOME_NOTIFICATION_STORAGE_PREFIX}:${id}`;
}

function readSeenVersion(id: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(buildStorageKey(id));
  } catch {
    return null;
  }
}

function writeSeenVersion(id: string, version: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(buildStorageKey(id), version);
  } catch {
    // Ignore storage write failures to avoid blocking storefront rendering.
  }
}

export function useSiteHomeNotification(isEnabled: boolean) {
  const [apiPayload, setApiPayload] = useState<SiteApiHomeNotificationResponse | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const payload = useMemo(
    () => (
      apiPayload
        ? {
            id: apiPayload.id,
            version: apiPayload.version,
            enabled: apiPayload.enabled,
            delayMs: apiPayload.delay_ms,
            windowLabel: "УВЕДОМЛЕНИЕ",
            title: apiPayload.title,
            description: apiPayload.description,
            imageSrc: apiPayload.image_src,
            imageAlt: "",
            ctaLabel: apiPayload.cta_label,
            ctaHref: apiPayload.cta_href,
          }
        : siteHomeNotificationEmptyPayload
    ),
    [apiPayload],
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isDisposed = false;
    siteApiJson<SiteApiHomeNotificationResponse>("/site/home/notification")
      .then((nextPayload) => {
        if (!isDisposed) {
          setApiPayload(nextPayload);
          setApiLoaded(true);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setApiPayload(null);
          setApiLoaded(true);
        }
      });
    return () => {
      isDisposed = true;
    };
  }, []);

  useEffect(() => {
    if (!apiLoaded) {
      setIsOpen(false);
      return undefined;
    }

    if (!isEnabled || !payload.enabled) {
      setIsOpen(false);
      return undefined;
    }

    const seenVersion = readSeenVersion(payload.id);
    if (seenVersion === payload.version) {
      setIsOpen(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      writeSeenVersion(payload.id, payload.version);
      setIsOpen(true);
    }, Math.max(0, payload.delayMs));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [apiLoaded, isEnabled, payload]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    payload,
    isOpen,
    dismiss,
  };
}
