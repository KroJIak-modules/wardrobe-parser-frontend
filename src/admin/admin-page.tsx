import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import { useLiveData } from "../shared/live-data-context";
import { useToasts } from "../shared/use-toasts";
import { ADMIN_ACCESS_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from "./auth-fetch";
import {
  currencyOptions,
  normalizeAdminTab,
  tabs,
} from "./admin-constants";
import { formatCompactNumber, normalizeSupplierCategory } from "./admin-formatters";
import { formatDateTime, formatSyncStatusRu } from "./admin-sync-formatters";
import { useAdminProductsTable } from "./hooks/use-admin-products-table";
import { useAdminProductFilters } from "./hooks/use-admin-product-filters";
import { useAdminProductCreate } from "./hooks/use-admin-product-create";
import { useAdminCategories } from "./hooks/use-admin-categories";
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
import { useAdminSvcRules } from "./hooks/use-admin-svc-rules";
import { useAdminTabPreload } from "./hooks/use-admin-tab-preload";
import { useAdminPricingRuntime } from "./hooks/use-admin-pricing-runtime";
import { useAdminSvcValidationToast } from "./hooks/use-admin-svc-validation-toast";
import { useAdminSourceMap } from "./hooks/use-admin-source-map";
import { useAdminPageLifecycle } from "./hooks/use-admin-page-lifecycle";
import { useAdminErrorToast } from "./hooks/use-admin-error-toast";
import { useAdminTabContentProps } from "./hooks/use-admin-tab-content-props";
import { useAdminPricingLocalState } from "./hooks/use-admin-pricing-local-state";
import { AdminOverlays } from "./admin-overlays";
import type {
  AdminTab,
  SupplierCategory,
} from "./admin-types";

export function AdminPage() {
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const tab = normalizeAdminTab(tabParam);
  const { openProductCard } = useAdminProductNavigation();
  const onLogout = () => {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    navigate("/control/login", { replace: true });
  };

  useAdminPageLifecycle(navigate, tab, tabParam);

  const {
    products,
    sources,
    latestJob,
    loadingCategoriesTree,
    loadingCategoryCounts,
    error,
    ensurePricingLoaded,
    ensureWeightLoaded,
    ensureDedupLoaded,
    runSync,
    cancelSync,
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    uploadShowcaseImage,
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    dedupCandidates,
    loadingDedupCandidates,
    dedupDecisions,
    loadingDedupDecisions,
    mergeDedupPair,
    rejectDedupPair,
    combineDedupPair,
    undoDedupDecision,
    loading,
    toggleSourceEnabled,
    toggleSourceSyncEnabled,
    toggleSourceAutoHideProducts,
    weightRules,
    weightMissingProducts,
    pricingSettings,
    createWeightRule,
    updateWeightRule,
    deleteWeightRule,
    addWeightKeyword,
    removeWeightKeyword,
    updatePricingSettings,
    updatePricingSupplier,
    createPricingSupplier,
    deletePricingSupplier,
    exportSettings,
    importSettings,
    assignSourceSupplier,
    fetchPricingExampleProduct,
  } = useLiveData();

  const { toasts, pushToast, closeToast } = useToasts();
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
  } = useAdminSettingsTransfer({
    exportSettings,
    importSettings,
    pushToast,
  });
  const {
    openModal,
    setOpenModal,
    productUrl,
    setProductUrl,
    productTitle,
    setProductTitle,
    productVendor,
    setProductVendor,
    productCategory,
    setProductCategory,
    productPrice,
    setProductPrice,
    productCurrency,
    setProductCurrency,
    imagePreviews,
    zoomedImageUrl,
    setZoomedImageUrl,
    closeProductModal,
    onDropImage,
    onPickImage,
    removePreviewImage,
    onFetchPreview,
    onSaveProduct,
  } = useAdminProductCreate({
    previewProductByUrl,
    addProductByUrl,
    createManualProduct,
    uploadProductImage,
    pushToast,
  });

  const {
    dedupChoosingPairKey,
    setDedupChoosingPairKey,
    dedupBusyPairKeys,
    dedupView,
    setDedupView,
    onMergePair,
    onRejectPair,
    onCombinePair,
    onUndoDecision,
  } = useAdminDedupActions({
    mergeDedupPair,
    rejectDedupPair,
    combineDedupPair,
    undoDedupDecision,
    pushToast,
  });
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedCategoryIsLeaf,
    createFormOpen,
    setCreateFormOpen,
    newCategoryName,
    setNewCategoryName,
    newCategoryParentId,
    newCategoryParentName,
    newCategoryKeywords,
    setNewCategoryKeywords,
    renameCategoryName,
    setRenameCategoryName,
    keywordInput,
    setKeywordInput,
    titleKeywordInput,
    setTitleKeywordInput,
    manualSearchInput,
    setManualSearchInput,
    manualSearchLoading,
    manualSearchResults,
    manualAssignedLoading,
    manualAssignedProducts,
    onStartCategoryCreate,
    onCreateCategory,
    onDeleteCategory,
    onAddKeyword,
    onRemoveKeyword,
    onToggleCategoryEnabled,
    onToggleCategoryFavorite,
    onAddManualProduct,
    onRemoveManualProduct,
  } = useAdminCategories({
    adminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryKeyword,
    removeCategoryKeyword,
    getCategoryManualProducts,
    searchCategoryManualProducts,
    addCategoryManualProduct,
    removeCategoryManualProduct,
    pushToast,
  });

  const {
    productSearch,
    setProductSearch,
    productSourceFilter,
    setProductSourceFilter,
    productVendorFilter,
    setProductVendorFilter,
    productTypeFilter,
    setProductTypeFilter,
    productStatusFilter,
    setProductStatusFilter,
  } = useAdminProductFilters();

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
    ensureWeightLoaded,
    ensureDedupLoaded,
  });

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
    designersMinProductsDraft,
    setDesignersMinProductsDraft,
    updatePricingSettings,
    pushToast,
  });

  const {
    svcRuleDrafts,
    setSvcRuleDrafts,
    svcRulesValidationError,
    svcRuleFieldErrors,
    onAddSvcRule,
  } = useAdminSvcRules({
    pricingSettings,
    updatePricingSettings,
    pushToast,
  });

  const {
    pricingSuppliers,
    mainPricingSuppliers,
    altSuppliersByMainId,
    newSupplierName,
    setNewSupplierName,
    newAltByMainId,
    setNewAltByMainId,
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
    mainSupplierIdByAnySupplierId,
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
    pricingSettings,
    uploadShowcaseImage,
    updatePricingSettings,
    pushToast,
  });

  const {
    showBybitErrorPopup,
    setShowBybitErrorPopup,
    pricingExample,
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
    productVendors,
    productTypes,
  } = useAdminProductsTable({
    tab,
    search: productSearch,
    sourceId: productSourceFilter,
    vendor: productVendorFilter,
    productType: productTypeFilter,
    status: productStatusFilter,
    pushToast,
  });

  const sourceById = useAdminSourceMap(sources);

  useAdminSvcValidationToast(svcRulesValidationError, pushToast);

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
      productVendorFilter,
      setProductVendorFilter,
      productTypeFilter,
      setProductTypeFilter,
      productStatusFilter,
      setProductStatusFilter,
      sourceSelectOptions: sources,
      productVendors,
      productTypes,
      sourceById,
      tableLoadingMore,
      productsSentinelRef,
    },
    dedupTabProps: {
      dedupView,
      setDedupView,
      dedupCandidates,
      loadingDedupCandidates,
      dedupDecisions,
      loadingDedupDecisions,
      dedupBusyPairKeys,
      dedupChoosingPairKey,
      setDedupChoosingPairKey,
      openProductCard,
      onCombinePair,
      onMergePair,
      onRejectPair,
      onUndoDecision,
    },
    categoriesPropsTree: {
      adminCategories,
      selectedCategoryId,
      loadingCategoryCounts,
      setCreateFormOpen,
      setSelectedCategoryId,
      onStartCategoryCreate,
    },
    categoriesTabRest: {
      loadingCategoriesTree,
      loadingCategoryCounts,
      onStartCategoryCreate,
      createFormOpen,
      newCategoryParentId,
      newCategoryParentName,
      newCategoryName,
      setNewCategoryName,
      newCategoryKeywords,
      setNewCategoryKeywords,
      onCreateCategory,
      setCreateFormOpen,
      selectedCategory,
      renameCategoryName,
      setRenameCategoryName,
      onToggleCategoryEnabled,
      onToggleCategoryFavorite,
      onDeleteCategory,
      keywordInput,
      setKeywordInput,
      titleKeywordInput,
      setTitleKeywordInput,
      onRemoveKeyword,
      onAddKeyword,
      selectedCategoryIsLeaf,
      manualSearchInput,
      setManualSearchInput,
      manualSearchLoading,
      manualSearchResults,
      onAddManualProduct,
      manualAssignedLoading,
      manualAssignedProducts,
      onRemoveManualProduct,
    },
    sourcesTabProps: {
      sources,
      loading,
      formatDateTime,
      toggleSourceEnabled,
      toggleSourceSyncEnabled,
      toggleSourceAutoHideProducts,
      pushToast,
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
      pricingExampleLoading,
      markupRateDraft,
      setMarkupRateDraft,
      pricingDrafts,
      setPricingDrafts,
      finalRoundingModeDraft,
      setFinalRoundingModeDraft,
      thresholdDraft,
      setThresholdField,
      svcRuleDrafts,
      setSvcRuleDrafts,
      svcRuleFieldErrors,
      onAddSvcRule,
      mainPricingSuppliers,
      altSuppliersByMainId,
      newAltByMainId,
      setNewAltByMainId,
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
      mainSupplierIdByAnySupplierId,
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
    },
    settingsTabProps: {
      pricingTabLoading,
      pricingSettings,
      designersMinProductsDraft,
      setDesignersMinProductsDraft,
      updatePricingSettings,
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
            onOpenCreateProduct={() => setOpenModal(true)}
            formatDateTime={formatDateTime}
            formatSyncStatusRu={formatSyncStatusRu}
          />

          <AdminTabs tabs={tabs} activeTab={tab} onSelectTab={(nextTab) => navigate(`/control/${nextTab}`)} />
          <AdminTabContent {...tabContentProps} />
          <AdminOverlays
            openModal={openModal}
            closeProductModal={closeProductModal}
            productUrl={productUrl}
            setProductUrl={setProductUrl}
            onFetchPreview={onFetchPreview}
            productTitle={productTitle}
            setProductTitle={setProductTitle}
            productVendor={productVendor}
            setProductVendor={setProductVendor}
            productCategory={productCategory}
            setProductCategory={setProductCategory}
            productPrice={productPrice}
            setProductPrice={setProductPrice}
            productCurrency={productCurrency}
            setProductCurrency={setProductCurrency}
            currencyOptions={currencyOptions}
            onDropImage={onDropImage}
            onPickImage={onPickImage}
            imagePreviews={imagePreviews}
            setZoomedImageUrl={setZoomedImageUrl}
            removePreviewImage={removePreviewImage}
            onSaveProduct={onSaveProduct}
            toasts={toasts}
            closeToast={closeToast}
            zoomedImageUrl={zoomedImageUrl}
          />
        </section>
      </main>
    </div>
  );
}
