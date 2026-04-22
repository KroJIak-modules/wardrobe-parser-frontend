import { useEffect } from "react";

export function useAdminErrorToast(error: string | null | undefined, pushToast: (message: string) => void) {
  useEffect(() => {
    if (!error) {
      return;
    }
    pushToast(`Error: ${error}`);
  }, [error, pushToast]);
}
