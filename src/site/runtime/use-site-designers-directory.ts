import { useEffect, useState } from "react";
import type { SiteDesignersDirectoryEntry } from "./site-designers";
import { siteApiJson, type SiteApiDesignersResponse } from "./site-public-api";

export function useSiteDesignersDirectory() {
  const [alphabet, setAlphabet] = useState<string[]>([]);
  const [entries, setEntries] = useState<SiteDesignersDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;
    setLoading(true);
    setErrorMessage(null);

    siteApiJson<SiteApiDesignersResponse>("/site/designers")
      .then((payload) => {
        if (isDisposed) {
          return;
        }
        setAlphabet(payload.alphabet);
        setEntries(payload.entries.map((item) => ({ id: item.slug, label: item.label, letter: item.letter })));
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }
        setAlphabet([]);
        setEntries([]);
        setErrorMessage(error instanceof Error ? error.message : "Не удалось загрузить дизайнеров");
        setLoading(false);
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  return {
    alphabet,
    entries,
    loading,
    errorMessage,
  };
}
