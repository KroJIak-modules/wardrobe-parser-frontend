import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import { useLiveData } from "../shared/live-data-context";
import { useToasts } from "../shared/use-toasts";
import { logoutAdminSession } from "../shared/admin-auth";
import {
  normalizeAdminTab,
  tabs,
} from "./admin-constants";
import { formatCompactNumber, normalizeSupplierCategory } from "./admin-formatters";
import { formatDateTime, formatSyncStatusRu } from "./admin-sync-formatters";
import { useAdminProductsTable } from "./hooks/use-admin-products-table";
import { useAdminProductFilters } from "./hooks/use-admin-product-filters";
import { readProductsQuery } from "./products-query";
import { useAdminDedupActions } from "./hooks/use-admin-dedup-actions";
import { useAdminPricingSettingsSync } from "./hooks/use-admin-pricing-settings-sync";
import { useAdminPricingSuppliers } from "./hooks/use-admin-pricing-suppliers";
import { useAdminSourcePricing } from "./hooks/use-admin-source-pricing";
import { useAdminShowcase } from "./hooks/use-admin-showcase";
import { useAdminSettingsTransfer } from "./hooks/use-admin-settings-transfer";
import { useAdminSyncControls } from "./hooks/use-admin-sync-controls";
import { useAdminWeightRules } from "./hooks/use-admin-weight-rules";
import { useAdminProductNavigation } from "./hooks/use-admin-product-navigation";
import { AdminTopbar } from "./admin-topbar";
import { AdminHead } from "./admin-head";
import { AdminTabs } from "./admin-tabs";
import { AdminTabContent } from "./admin-tab-content";
import { useAdminTabPreload } from "./hooks/use-admin-tab-preload";
import { useAdminPricingRuntime } from "./hooks/use-admin-pricing-runtime";
import { useAdminSourceMap } from "./hooks/use-admin-source-map";
import { useAdminDesignerMappings } from "./hooks/use-admin-designer-mappings";
import { useAdminPageLifecycle } from "./hooks/use-admin-page-lifecycle";
import { useAdminErrorToast } from "./hooks/use-admin-error-toast";
import { useAdminTabContentProps } from "./hooks/use-admin-tab-content-props";
import { useAdminPricingLocalState } from "./hooks/use-admin-pricing-local-state";
import { AdminOverlays } from "./admin-overlays";
import { useAdminProductCreate } from "./hooks/use-admin-product-create";
import type {
  AdminTab,
  SupplierCategory,
} from "./admin-types";

export function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const tab = normalizeAdminTab(tabParam);
  const { openProductCard } = useAdminProductNavigation();
  const onLogout = () => {
    void (async () => {
      await logoutAdminSession();
      navigate("/login", { replace: true });
    })();
  };

  useAdminPageLifecycle(navigate, tab, tabParam);

  const {
    products,
    sources,
    latestJob,
    error,
    ensurePricingLoaded,
    ensureAdminUiLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    refreshDedupStatusOnly,
    refreshDedupDecisionCountOnly,
    ensureDedupDecisionsLoaded,
    ensureCategoriesLoaded,
    refreshSourcesOnly,
    runSync,
    runSyncForSource,
    cancelSync,
    uploadShowcaseHeroImage,
    uploadShowcaseCarouselImage,
    dedupCandidates,
    dedupCandidatesTotal,
    loadingDedupCandidates,
    dedupScanStatus,
    dedupCandidatesHasMore,
    loadingMoreDedupCandidates,
    dedupDecisions,
    dedupDecisionsTotal,
    loadingDedupDecisions,
    dedupDecisionsLoaded,
    dedupDecisionsHasMore,
    loadingMoreDedupDecisions,
    runDedupScan,
    mergeDedupProducts,
    rejectDedupProducts,
    undoDedupDecision,
    loading,
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceDedupEnabled,
    toggleSourceAutoHideProducts,
    updateSourceAttributeVisibility,
    weightRules,
    weightMissingProducts,
    hasMoreWeightMissing,
    loadingMoreWeightMissing,
    loadMoreWeightMissingProducts,
    loadMoreDedupCandidates,
    loadMoreDedupDecisions,
    pricingSettings,
    adminUiSettings,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updateAdminUiSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
    resetSettings,
    assignSourceSupplier,
    fetchPricingExampleProduct,
    updateShowcaseMediaSettings,
    previewProductByUrl,
    probeProductByUrl,
    createManualProduct,
    updateManualProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    getProductById,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
    getStarredCategoryOptions,
  } = useLiveData();

  const { toasts, pushToast, closeToast, pauseToast, resumeToast } = useToasts();
  const {
    isSyncInProgress,
    canRunSync,
    canCancelSync,
    onRunSync,
    onCancelSync,
  } = useAdminSyncControls({
    latestJob,
    runSync,
    cancelSync,
    pushToast,
  });
  const {
    settingsImportInputRef,
    settingsExportInProgress,
    settingsImportInProgress,
    onExportSettings,
    onOpenImportDialog,
    onImportSettingsFile,
    settingsResetInProgress,
    resetConfirmOpen,
    onRequestResetSettings,
    onCancelResetSettings,
    onConfirmResetSettings,
  } = useAdminSettingsTransfer({
    exportSettings,
    importSettings,
    resetSettings,
    pushToast,
  });
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const {
    isOpen: productCreateOpen,
    setIsOpen: setProductCreateOpen,
    draft: productCreateDraft,
    setDraftField: setProductCreateField,
    lookup: productCreateLookup,
    sourceDomainError: productCreateSourceError,
    matchedSourceDomain: productCreateMatchedDomain,
    canRunLookup: productCreateCanRunLookup,
    isHydrating: productCreateHydrating,
    isCreating: productCreateCreating,
    hiddenProductIds: productCreateHiddenIds,
    knownDesignerOptions: productCreateKnownDesigners,
    favoriteCategoryOptions: productCreateFavoriteOptions,
    favoriteCategorySlugs: productCreateFavoriteSlugs,
    setFavoriteCategorySlugs: setProductCreateFavoriteSlugs,
    boundFromSourceLookup: productCreateBoundFromSourceLookup,
    hydrateFromSourceUrl,
    hydrateFromExistingProduct,
    hideExistingProduct,
    addManualImage: addProductCreateImage,
    removeImage: removeProductCreateImage,
    onCancel: onCloseProductCreate,
    onCreateDraft: onCreateProductDraft,
  } = useAdminProductCreate({
    sources,
    products,
    onToast: (message, type = "success") => pushToast(message, type),
    previewProductByUrl,
    probeProductByUrl,
    createManualProduct,
    updateManualProduct,
    uploadProductImage,
    uploadProductImageByUrl,
    getProductById,
    setProductStatus,
    getProductStarredCategories,
    setProductStarredCategories,
    getStarredCategoryOptions,
  });

  const {
    dedupChoosingPairKey,
    setDedupChoosingPairKey,
    dedupBusyPairKeys,
    dedupView,
    setDedupView,
    onMergeProducts,
    onRejectProducts,
    onUndoDecision,
  } = useAdminDedupActions({
    mergeDedupProducts,
    rejectDedupProducts,
    undoDedupDecision,
    pushToast,
  });

  useEffect(() => {
    if (tab !== "dedup" || dedupView !== "decisions") {
      return;
    }
    void ensureDedupDecisionsLoaded();
  }, [tab, dedupView, ensureDedupDecisionsLoaded]);

  useEffect(() => {
    if (tab !== "dedup") {
      return;
    }
    void refreshDedupDecisionCountOnly();
  }, [tab, refreshDedupDecisionCountOnly]);

  useEffect(() => {
    if (tab !== "dedup") {
      return;
    }
    void refreshDedupStatusOnly();
    if (!dedupScanStatus.is_running) {
      return;
    }
    const timer = window.setInterval(() => {
      void refreshDedupStatusOnly();
      void ensureDedupLoaded(true);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [tab, dedupScanStatus.is_running, refreshDedupStatusOnly, ensureDedupLoaded]);

  const {
    productSearch,
    setProductSearch,
    productSourceFilter,
    setProductSourceFilter,
    productSourceModeFilter,
    setProductSourceModeFilter,
    productDesignerFilter,
    setProductDesignerFilter,
    productCatalogFilter,
    setProductCatalogFilter,
    productSectionFilter,
    setProductSectionFilter,
    productGenderFilter,
    setProductGenderFilter,
    productVisibilityFilter,
    setProductVisibilityFilter,
    productAvailabilityModeFilter,
    setProductAvailabilityModeFilter,
    productOrderabilityFilter,
    setProductOrderabilityFilter,
  } = useAdminProductFilters();
  const productsQuery = useMemo(
    () => readProductsQuery(searchParams),
    [searchParams.toString()]
  );

  const {
    pricingDrafts,
    setPricingDrafts,
    markupRateDraft,
    setMarkupRateDraft,
    finalRoundingModeDraft,
    setFinalRoundingModeDraft,
    designersMinProductsDraft,
    setDesignersMinProductsDraft,
    pricingFormulaHtml,
  } = useAdminPricingLocalState({ pricingSettings });
  useEffect(() => {
    if (!adminUiSettings) return;
    const nextValue = Math.max(1, Math.trunc(Number(adminUiSettings.designers_min_products || 1)));
    setDesignersMinProductsDraft(String(nextValue));
  }, [adminUiSettings?.designers_min_products, setDesignersMinProductsDraft]);
  const [pricingTabLoading, setPricingTabLoading] = useState<boolean>(false);
  const [weightTabLoading, setWeightTabLoading] = useState<boolean>(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const carouselInputRef = useRef<HTMLInputElement | null>(null);

  useAdminErrorToast(error, pushToast);

  useAdminTabPreload({
    tab,
    setPricingTabLoading,
    setWeightTabLoading,
    ensurePricingLoaded,
    ensureAdminUiLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    ensureCategoriesLoaded,
    refreshSourcesOnly,
  });

  useEffect(() => {
    if (tab !== "pricing") {
      return undefined;
    }
    let aborted = false;
    const timer = window.setInterval(() => {
      if (!aborted) {
        void ensurePricingLoaded(true).catch(() => {
          // keep silent: next tick will retry
        });
      }
    }, 30000);
    return () => {
      aborted = true;
      window.clearInterval(timer);
    };
  }, [tab, ensurePricingLoaded, pricingSettings]);

  const {
    newWeightRuleGrams,
    setNewWeightRuleGrams,
    weightRuleDrafts,
    setWeightRuleDrafts,
    weightKeywordInputs,
    setWeightKeywordInputs,
    onCreateWeightRule,
    onDeleteWeightRule,
    onAddWeightKeyword,
    onRemoveWeightKeyword,
  } = useAdminWeightRules({
    weightRules,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    pushToast,
  });

  useAdminPricingSettingsSync({
    pricingSettings,
    pricingDrafts,
    setPricingDrafts,
    markupRateDraft,
    setMarkupRateDraft,
    finalRoundingModeDraft,
    setFinalRoundingModeDraft,
    updatePricingSettings,
    pushToast,
  });

  const {
    pricingSuppliers,
    mainPricingSuppliers,
    altSuppliersByMainId,
    newSupplierName,
    setNewSupplierName,
    tariffRangesDrafts,
    setTariffRangesDrafts,
    tariffNameDrafts,
    setTariffNameDrafts,
    onCreateMainSupplier,
    onCreateAltSupplier,
    onDeleteSupplier,
    onAddTariffRange,
    onRemoveTariffRange,
  } = useAdminPricingSuppliers({
    pricingSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    pushToast,
  });
  const {
    pricingRates,
    thresholdDraft,
    setThresholdField,
    sourcePricingDrafts,
    setSourcePricingDrafts,
    setSourceBuyoutField,
  } = useAdminSourcePricing({
    pricingSettings,
    pricingDrafts,
    sources,
    assignSourceSupplier,
    updatePricingSettings,
    pushToast,
  });
  const {
    showcaseHeroImageId,
    showcaseCarousel,
    showcaseSaving,
    onPickHeroImage,
    onRemoveHeroImage,
    onPickCarouselImages,
    onRemoveCarouselImage,
    onDropCarouselReorder,
    onStartCarouselDrag,
    onEndCarouselDrag,
  } = useAdminShowcase({
    enabled: tab === "settings",
    uploadShowcaseHeroImage,
    uploadShowcaseCarouselImage,
    updateShowcaseMediaSettings,
    pushToast,
  });

  const {
    showBybitErrorPopup,
    setShowBybitErrorPopup,
    pricingExample,
    pricingExampleError,
    pricingExampleLoading,
    bybitWorkerInfo,
    pricingBlockedByInitialBybit,
  } = useAdminPricingRuntime({
    tab,
    pricingSettings,
    fetchPricingExampleProduct,
    pushToast,
  });
  const {
    productsSentinelRef,
    tableProducts,
    tableTotal,
    tableOverallTotal,
    tableLoading,
    tableLoadingMore,
    productSources,
    productDesigners,
    productCatalogs,
    productSections,
    productGenders,
  } = useAdminProductsTable({
    tab,
    latestJobStatus: latestJob?.status ?? null,
    query: productsQuery,
    pushToast,
  });

  const sourceById = useAdminSourceMap(sources);
  const {
    loading: designersLoading,
    rows: designersRows,
    designers: finalDesigners,
    onChangeDesignerName,
    onToggleIncludeInDesigners: onToggleDesignerIncludeInDesigners,
    onChangeFinalDesignerName,
    onChangeFinalDesignerDescription,
    onUploadDesignerLogo,
    onClearDesignerLogo,
    onCreateDesigner,
    onDeleteDesigner,
  } = useAdminDesignerMappings(tab, pushToast);
  const tabContentProps = useAdminTabContentProps({
    tab,
    productsTabProps: {
      tableLoading,
      tableProducts,
      tableTotal,
      tableOverallTotal,
      productSearch,
      setProductSearch,
      productSourceFilter,
      setProductSourceFilter,
      productSourceModeFilter,
      setProductSourceModeFilter,
      productDesignerFilter,
      setProductDesignerFilter,
      productCatalogFilter,
      setProductCatalogFilter,
      productSectionFilter,
      setProductSectionFilter,
      productGenderFilter,
      setProductGenderFilter,
      productVisibilityFilter,
      setProductVisibilityFilter,
      productAvailabilityModeFilter,
      setProductAvailabilityModeFilter,
      productOrderabilityFilter,
      setProductOrderabilityFilter,
      sourceFacetOptions: productSources,
      productDesigners,
      productCatalogs,
      productSections,
      productGenders,
      sourceById,
      tableLoadingMore,
      productsSentinelRef,
    },
    dedupTabProps: {
      dedupView,
      setDedupView,
      dedupScanStatus,
      dedupCandidates,
      dedupCandidatesTotal,
      loadingDedupCandidates,
      dedupCandidatesHasMore,
      loadingMoreDedupCandidates,
      dedupDecisions,
      dedupDecisionsTotal,
      loadingDedupDecisions,
      dedupDecisionsLoaded,
      dedupDecisionsHasMore,
      loadingMoreDedupDecisions,
      dedupBusyPairKeys,
      dedupChoosingPairKey,
      setDedupChoosingPairKey,
      openProductCard,
      onRunDedupScan: runDedupScan,
      onMergeProducts,
      onRejectProducts,
      onUndoDecision,
      onLoadMoreCandidates: loadMoreDedupCandidates,
      onLoadMoreDecisions: loadMoreDedupDecisions,
    },
    filtersCategoriesTabProps: {},
    designersTabProps: {
      loading: designersLoading,
      rows: designersRows,
      designers: finalDesigners,
      onChangeDesignerName,
      onToggleIncludeInDesigners: onToggleDesignerIncludeInDesigners,
      onChangeFinalDesignerName,
      onChangeFinalDesignerDescription,
      onUploadDesignerLogo,
      onClearDesignerLogo,
      onCreateDesigner,
      onDeleteDesigner,
    },
    sourcesTabProps: {
      sources,
      loading,
      latestJob,
      runSyncForSource,
      cancelSync,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceDedupEnabled,
      toggleSourceAutoHideProducts,
      updateSourceAttributeVisibility,
      autoSyncPeriodMinutes: Math.max(60, Number(adminUiSettings?.auto_sync_period_minutes || 60)),
      autoSyncNextRunAt: adminUiSettings?.auto_sync_next_run_at || null,
      autoSyncLastStatus: adminUiSettings?.auto_sync_last_status || null,
      autoSyncLastError: adminUiSettings?.auto_sync_last_error || null,
      updateAdminUiSettings,
      pushToast,
      onZoomImage: (url: string) => setZoomedImageUrl(url),
    },
    pricingTabProps: {
      pricingTabLoading,
      pricingSettings,
      pricingBlockedByInitialBybit,
      bybitWorkerInfo,
      showBybitErrorPopup,
      setShowBybitErrorPopup,
      formatDateTime,
      pricingFormulaHtml,
      pricingExample,
      pricingExampleError,
      pricingExampleLoading,
      markupRateDraft,
      setMarkupRateDraft,
      pricingDrafts,
      setPricingDrafts,
      finalRoundingModeDraft,
      setFinalRoundingModeDraft,
      thresholdDraft,
      setThresholdField,
      mainPricingSuppliers,
      altSuppliersByMainId,
      tariffRangesDrafts,
      setTariffRangesDrafts,
      tariffNameDrafts,
      setTariffNameDrafts,
      onDeleteSupplier,
      onRemoveTariffRange,
      onAddTariffRange,
      onCreateAltSupplier,
      newSupplierName,
      setNewSupplierName,
      onCreateMainSupplier,
      sources,
      sourcePricingDrafts,
      setSourcePricingDrafts,
      sourcePricingSuppliers: mainPricingSuppliers,
      setSourceBuyoutField,
    },
    weightTabProps: {
      weightTabLoading,
      newWeightRuleGrams,
      setNewWeightRuleGrams,
      onCreateWeightRule,
      weightRules,
      weightRuleDrafts,
      setWeightRuleDrafts,
      onDeleteWeightRule,
      weightKeywordInputs,
      setWeightKeywordInputs,
      onRemoveWeightKeyword,
      onAddWeightKeyword,
      weightMissingProducts,
      hasMoreWeightMissing,
      loadingMoreWeightMissing,
      onLoadMoreWeightMissing: loadMoreWeightMissingProducts,
    },
    settingsTabProps: {
      pricingTabLoading,
      adminUiSettings,
      designersMinProductsDraft,
      setDesignersMinProductsDraft,
      updateAdminUiSettings,
      pushToast,
      showcaseHeroImageId,
      heroInputRef,
      showcaseSaving,
      onRemoveHeroImage,
      onPickHeroImage,
      showcaseCarousel,
      setDraggingCarouselId: (id) => {
        if (id === null) {
          onEndCarouselDrag();
          return;
        }
        onStartCarouselDrag(id);
      },
      onReorderCarouselImage: onDropCarouselReorder,
      onRemoveCarouselImage,
      carouselInputRef,
      onPickCarouselImages,
      settingsExportInProgress,
      settingsImportInProgress,
      onExportSettings,
      onOpenImportDialog,
      settingsImportInputRef,
      onImportSettingsFile,
      settingsResetInProgress,
      resetConfirmOpen,
      onRequestResetSettings,
      onCancelResetSettings,
      onConfirmResetSettings,
    },
  });

  return (
    <div className="shell">
      <AdminTopbar onLogout={onLogout} />
      <main className="container container--admin">
        <section className="section admin">
          <AdminHead
            isSyncInProgress={isSyncInProgress}
            canRunSync={canRunSync}
            canCancelSync={canCancelSync}
            latestJob={latestJob}
            onRunSync={onRunSync}
            onCancelSync={onCancelSync}
            onOpenCreateProduct={() => setProductCreateOpen(true)}
            formatDateTime={formatDateTime}
            formatSyncStatusRu={formatSyncStatusRu}
          />

          <AdminTabs tabs={tabs} activeTab={tab} onSelectTab={(nextTab) => navigate(`/control/${nextTab}`)} />
          <AdminTabContent {...tabContentProps} />
          <AdminOverlays
            setZoomedImageUrl={setZoomedImageUrl}
            toasts={toasts}
            closeToast={closeToast}
            pauseToast={pauseToast}
            resumeToast={resumeToast}
            zoomedImageUrl={zoomedImageUrl}
            productCreateOpen={productCreateOpen}
            productCreateDraft={productCreateDraft}
            productCreateLookup={productCreateLookup}
            productCreateSourceError={productCreateSourceError}
            productCreateMatchedDomain={productCreateMatchedDomain}
            productCreateCanRunLookup={productCreateCanRunLookup}
            productCreateHydrating={productCreateHydrating}
            productCreateCreating={productCreateCreating}
            productCreateHiddenIds={productCreateHiddenIds}
            productCreateKnownDesigners={productCreateKnownDesigners}
            productCreateFavoriteOptions={productCreateFavoriteOptions}
            productCreateFavoriteSlugs={productCreateFavoriteSlugs}
            productCreateBoundFromSourceLookup={productCreateBoundFromSourceLookup}
            onSetProductCreateFavoriteSlugs={setProductCreateFavoriteSlugs}
            onCloseProductCreate={onCloseProductCreate}
            onSetProductCreateField={setProductCreateField}
            onHydrateFromSourceUrl={hydrateFromSourceUrl}
            onHydrateFromExisting={hydrateFromExistingProduct}
            onToggleHideExisting={hideExistingProduct}
            onAddProductImage={addProductCreateImage}
            onRemoveProductImage={removeProductCreateImage}
            onCreateProductDraft={onCreateProductDraft}
            onZoomProductImage={(url) => setZoomedImageUrl(url)}
          />
        </section>
      </main>
    </div>
  );
}
