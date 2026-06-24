import { useCallback, useEffect, useMemo, useState } from "react";
import { siteHomeNotificationMockPayload } from "./site-home-notification-mock";

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
  const payload = useMemo(() => siteHomeNotificationMockPayload, []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
  }, [isEnabled, payload]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    payload,
    isOpen,
    dismiss,
  };
}
