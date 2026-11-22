import { useEffect, useRef, useState } from "react";
import type { SiteDesignersDirectoryEntry } from "./site-designers";
import { siteApiJson, type SiteApiDesignersResponse } from "./site-public-api";

export function useSiteDesignersDirectory(selectedDesignerIds: readonly string[] = []) {
  const [alphabet, setAlphabet] = useState<string[]>([]);
  const [entries, setEntries] = useState<SiteDesignersDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Slug'и, которые уже есть в полученном списке: повторно просим только тех
  // выбранных, которых в каталоге нет.
  const knownSlugsRef = useRef<Set<string>>(new Set());
  const requestedKeyRef = useRef<string | null>(null);
  const selectedKey = selectedDesignerIds.join(",");

  useEffect(() => {
    const missing = selectedDesignerIds.filter((slug) => !knownSlugsRef.current.has(slug));
    const queryKey = missing.join(",");
    if (requestedKeyRef.current === queryKey) {
      return;
    }

    requestedKeyRef.current = queryKey;
    let isDisposed = false;
    setLoading(true);
    setErrorMessage(null);

    // Выбранных дизайнеров просим и с сервера: бренд без публичных товаров
    // в каталоге не показывается, но на странице дизайнеров он должен быть
    // виден и подчёркнут.
    const query = queryKey ? `?designer=${encodeURIComponent(queryKey)}` : "";

    siteApiJson<SiteApiDesignersResponse>(`/site/designers${query}`)
      .then((payload) => {
        if (isDisposed) {
          return;
        }
        const nextEntries = payload.entries.map((item) => ({ id: item.slug, label: item.label, letter: item.letter }));
        knownSlugsRef.current = new Set(nextEntries.map((item) => item.id));
        setAlphabet(payload.alphabet);
        setEntries(nextEntries);
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
  }, [selectedKey]);

  return {
    alphabet,
    entries,
    loading,
    errorMessage,
  };
}
