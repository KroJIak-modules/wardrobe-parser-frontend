import { useEffect, useRef } from "react";
import type { AdminTab } from "../admin-types";

type UseAdminTabPreloadParams = {
  tab: AdminTab;
  setPricingTabLoading: (value: boolean) => void;
  setWeightTabLoading: (value: boolean) => void;
  ensurePricingLoaded: (force?: boolean) => Promise<void>;
  ensureAdminUiLoaded: (force?: boolean) => Promise<void>;
  ensureWeightLoaded: () => Promise<void>;
  ensureDedupLoaded: () => Promise<void>;
  ensureCategoriesLoaded: (force?: boolean) => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
};

export function useAdminTabPreload({
  tab,
  setPricingTabLoading,
  setWeightTabLoading,
  ensurePricingLoaded,
  ensureAdminUiLoaded,
  ensureWeightLoaded,
  ensureDedupLoaded,
  ensureCategoriesLoaded,
  refreshSourcesOnly,
}: UseAdminTabPreloadParams) {
  const ensurePricingLoadedRef = useRef(ensurePricingLoaded);
  const ensureAdminUiLoadedRef = useRef(ensureAdminUiLoaded);
  const ensureWeightLoadedRef = useRef(ensureWeightLoaded);
  const ensureDedupLoadedRef = useRef(ensureDedupLoaded);
  const ensureCategoriesLoadedRef = useRef(ensureCategoriesLoaded);
  const refreshSourcesOnlyRef = useRef(refreshSourcesOnly);
  const setPricingTabLoadingRef = useRef(setPricingTabLoading);
  const setWeightTabLoadingRef = useRef(setWeightTabLoading);

  useEffect(() => {
    ensurePricingLoadedRef.current = ensurePricingLoaded;
    ensureAdminUiLoadedRef.current = ensureAdminUiLoaded;
    ensureWeightLoadedRef.current = ensureWeightLoaded;
    ensureDedupLoadedRef.current = ensureDedupLoaded;
    ensureCategoriesLoadedRef.current = ensureCategoriesLoaded;
    refreshSourcesOnlyRef.current = refreshSourcesOnly;
    setPricingTabLoadingRef.current = setPricingTabLoading;
    setWeightTabLoadingRef.current = setWeightTabLoading;
  }, [
    ensurePricingLoaded,
    ensureAdminUiLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureCategoriesLoaded,
    refreshSourcesOnly,
    setPricingTabLoading,
    setWeightTabLoading,
  ]);

  useEffect(() => {
    const run = async () => {
      if (tab === "pricing") {
        setPricingTabLoadingRef.current(true);
        try {
          await ensurePricingLoadedRef.current(true);
        } finally {
          setPricingTabLoadingRef.current(false);
        }
        return;
      }
      if (tab === "settings") {
        await ensureAdminUiLoadedRef.current(true);
        return;
      }
      if (tab === "weight") {
        setWeightTabLoadingRef.current(true);
        try {
          await ensureWeightLoadedRef.current();
        } finally {
          setWeightTabLoadingRef.current(false);
        }
        return;
      }
      if (tab === "dedup") {
        await ensureDedupLoadedRef.current();
        return;
      }
      if (tab === "showcase-structure") {
        await ensureCategoriesLoadedRef.current();
        return;
      }
      if (tab === "sources") {
        await Promise.all([
          refreshSourcesOnlyRef.current(),
          ensureAdminUiLoadedRef.current(true),
        ]);
        return;
      }
      if (tab === "products") {
        await refreshSourcesOnlyRef.current();
      }
    };
    void run();
  }, [tab]);
}
