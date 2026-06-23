import { useEffect, useMemo, useRef, useState } from "react";
import type { PricingExampleProduct, PricingExampleFetchResult, PricingSettings } from "../../shared/live-data-context";
import { buildBybitWorkerInfo, buildPricingExampleView, isPricingBlockedByInitialBybit } from "../admin-pricing-view-model";
import type { BybitWorkerInfo, PricingExampleView } from "../admin-types";

type UseAdminPricingRuntimeParams = {
  tab: string;
  pricingSettings: PricingSettings | null;
  fetchPricingExampleProduct: () => Promise<PricingExampleFetchResult>;
  pushToast: (message: string) => void;
};

export function useAdminPricingRuntime({
  tab,
  pricingSettings,
  fetchPricingExampleProduct,
  pushToast,
}: UseAdminPricingRuntimeParams) {
  const [showBybitErrorPopup, setShowBybitErrorPopup] = useState<boolean>(false);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [pricingExampleProduct, setPricingExampleProduct] = useState<PricingExampleProduct | null>(null);
  const [pricingExampleError, setPricingExampleError] = useState<string | null>(null);
  const [pricingExampleLoading, setPricingExampleLoading] = useState<boolean>(false);
  const bybitWarnToastShownRef = useRef<string | null>(null);
  const pricingBlockedToastShownRef = useRef<boolean>(false);

  useEffect(() => {
    const warning = pricingSettings?.bybit_rate_warning?.trim();
    if (!warning) {
      bybitWarnToastShownRef.current = null;
      return;
    }
    if (bybitWarnToastShownRef.current === warning) {
      return;
    }
    bybitWarnToastShownRef.current = warning;
    pushToast(warning);
  }, [pricingSettings?.bybit_rate_warning, pushToast]);

  useEffect(() => {
    if (!pricingSettings?.bybit_last_error) {
      setShowBybitErrorPopup(false);
    }
  }, [pricingSettings?.bybit_last_error]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTickMs(Date.now());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const bybitWorkerInfo: BybitWorkerInfo = useMemo(
    () => buildBybitWorkerInfo(pricingSettings, nowTickMs),
    [pricingSettings, nowTickMs]
  );

  const pricingBlockedByInitialBybit = useMemo(
    () => isPricingBlockedByInitialBybit(pricingSettings),
    [pricingSettings]
  );

  useEffect(() => {
    if (!pricingBlockedByInitialBybit) {
      pricingBlockedToastShownRef.current = false;
      return;
    }
    if (pricingBlockedToastShownRef.current) {
      return;
    }
    pricingBlockedToastShownRef.current = true;
    pushToast("Ценообразование временно недоступно: ждем первый успешный курс Bybit после запуска системы.");
  }, [pricingBlockedByInitialBybit, pushToast]);

  useEffect(() => {
    if (tab !== "pricing" || !pricingSettings || pricingBlockedByInitialBybit) {
      setPricingExampleProduct(null);
      setPricingExampleError(null);
      setPricingExampleLoading(false);
      return;
    }
    let aborted = false;
    setPricingExampleLoading(true);
    void fetchPricingExampleProduct()
      .then((result) => {
        if (!aborted) {
          setPricingExampleProduct(result.product);
          setPricingExampleError(result.errorMessage);
        }
      })
      .finally(() => {
        if (!aborted) {
          setPricingExampleLoading(false);
        }
      });
    return () => {
      aborted = true;
    };
  }, [tab, pricingSettings, pricingBlockedByInitialBybit, fetchPricingExampleProduct]);

  const pricingExample: PricingExampleView | null = useMemo(
    () => buildPricingExampleView(pricingExampleProduct, pricingSettings),
    [pricingExampleProduct, pricingSettings]
  );

  return {
    showBybitErrorPopup,
    setShowBybitErrorPopup,
    pricingExample,
    pricingExampleError,
    pricingExampleLoading,
    bybitWorkerInfo,
    pricingBlockedByInitialBybit,
  };
}
