import { useCallback, useEffect, useMemo, useState } from "react";
import { siteHomeNotificationMockPayload } from "./site-home-notification-mock";

const SITE_HOME_NOTIFICATION_STORAGE_PREFIX = "site-home-notification-dismissed";

function buildStorageKey(id: string) {
  return `${SITE_HOME_NOTIFICATION_STORAGE_PREFIX}:${id}`;
}

function readDismissedVersion(id: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(buildStorageKey(id));
  } catch {
    return null;
  }
}

function writeDismissedVersion(id: string, version: string) {
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
  const payload = useMemo(() => siteHomeNotificationMockPayload, []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isEnabled || !payload.enabled) {
      setIsOpen(false);
      return undefined;
    }

    const dismissedVersion = readDismissedVersion(payload.id);
    if (dismissedVersion === payload.version) {
      setIsOpen(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsOpen(true);
    }, Math.max(0, payload.delayMs));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isEnabled, payload]);

  const dismiss = useCallback(() => {
    writeDismissedVersion(payload.id, payload.version);
    setIsOpen(false);
  }, [payload.id, payload.version]);

  return {
    payload,
    isOpen,
    dismiss,
  };
}
