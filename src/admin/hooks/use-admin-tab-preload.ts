import { useEffect } from "react";
import type { AdminTab } from "../admin-types";

type UseAdminTabPreloadParams = {
  tab: AdminTab;
  setPricingTabLoading: (value: boolean) => void;
  setWeightTabLoading: (value: boolean) => void;
  ensurePricingLoaded: (force?: boolean) => Promise<void>;
  ensureWeightLoaded: () => Promise<void>;
  ensureDedupLoaded: () => Promise<void>;
};

export function useAdminTabPreload({
  tab,
  setPricingTabLoading,
  setWeightTabLoading,
  ensurePricingLoaded,
  ensureWeightLoaded,
  ensureDedupLoaded,
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
      }
    };
    void run();
  }, [tab, ensurePricingLoaded, ensureWeightLoaded, ensureDedupLoaded, setPricingTabLoading, setWeightTabLoading]);
}
