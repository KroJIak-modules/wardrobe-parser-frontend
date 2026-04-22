import { useEffect, useRef } from "react";

export function useAdminSvcValidationToast(validationMessage: string | null | undefined, pushToast: (message: string) => void) {
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    const message = (validationMessage || "").trim();
    if (!message) {
      shownRef.current = null;
      return;
    }
    if (shownRef.current === message) {
      return;
    }
    shownRef.current = message;
    pushToast(message);
  }, [validationMessage, pushToast]);
}
