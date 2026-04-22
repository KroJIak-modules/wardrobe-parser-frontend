import { useEffect } from "react";
import type { AdminTab } from "../admin-types";

type UseAdminTabPreloadParams = {
  tab: AdminTab;
  setPricingTabLoading: (value: boolean) => void;
  setWeightTabLoading: (value: boolean) => void;
  ensurePricingLoaded: (force?: boolean) => Promise<void>;
  ensureWeightLoaded: () => Promise<void>;
  ensureDedupLoaded: () => Promise<void>;
  ensureCategoriesLoaded: (force?: boolean) => Promise<void>;
};

export function useAdminTabPreload({
  tab,
  setPricingTabLoading,
  setWeightTabLoading,
  ensurePricingLoaded,
  ensureWeightLoaded,
  ensureDedupLoaded,
  ensureCategoriesLoaded,
}: UseAdminTabPreloadParams) {
  useEffect(() => {
    const run = async () => {
      if (tab === "pricing" || tab === "settings") {
        setPricingTabLoading(true);
        try {
          await ensurePricingLoaded(true);
        } finally {
          setPricingTabLoading(false);
        }
        return;
      }
      if (tab === "weight") {
        setWeightTabLoading(true);
        try {
          await ensureWeightLoaded();
        } finally {
          setWeightTabLoading(false);
        }
        return;
      }
      if (tab === "dedup") {
        await ensureDedupLoaded();
        return;
      }
      if (tab === "categories") {
        await ensureCategoriesLoaded();
      }
    };
    void run();
  }, [
    tab,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureCategoriesLoaded,
    setPricingTabLoading,
    setWeightTabLoading,
  ]);
}
