import type { Dispatch, SetStateAction } from "react";
import type { PricingSettings, PricingSupplier } from "../shared/live-data-context";
import { AdminPricingSkeleton } from "../shared/skeleton";
import { AdminPricingCoreFieldsSection } from "./admin-pricing-core-fields-section";
import { AdminPricingFormulaSection } from "./admin-pricing-formula-section";
import { AdminPricingTariffsSection } from "./admin-pricing-tariffs-section";
import { AdminPricingThresholdSection } from "./admin-pricing-threshold-section";
import { AdminPricingSvcSection } from "./admin-pricing-svc-section";
import { AdminPricingWorkerSection } from "./admin-pricing-worker-section";
import { AdminPricingSourcesSection } from "./admin-pricing-sources-section";
import type { BybitWorkerInfo, FinalRoundingMode, PricingExampleView, PricingFieldKey, SvcRuleDraft, SvcRuleFieldError, TriCurrencyAmountKey, TriCurrencyDraft } from "./admin-types";

type SourceItem = {
  key: string;
  name: string;
  supplier_id: number | null;
  promo_factor: number;
  promo_only_no_discount: boolean;
};

type SourcePricingDraft = {
  supplierId: string;
  promoPercent: string;
  promoOnlyNoDiscount: boolean;
  buyout: TriCurrencyDraft;
};

type Props = {
  pricingTabLoading: boolean;
  pricingSettings: PricingSettings | null;
  pricingBlockedByInitialBybit: boolean;
  bybitWorkerInfo: BybitWorkerInfo;
  showBybitErrorPopup: boolean;
  setShowBybitErrorPopup: Dispatch<SetStateAction<boolean>>;
  formatDateTime: (value: string | null | undefined) => string;
  pricingFormulaHtml: string;
  pricingExample: PricingExampleView | null;
  pricingExampleLoading: boolean;
  pricingExampleError: string | null;
  markupRateDraft: string;
  setMarkupRateDraft: Dispatch<SetStateAction<string>>;
  pricingDrafts: Record<PricingFieldKey, string>;
  setPricingDrafts: Dispatch<SetStateAction<Record<PricingFieldKey, string>>>;
  finalRoundingModeDraft: FinalRoundingMode;
  setFinalRoundingModeDraft: Dispatch<SetStateAction<FinalRoundingMode>>;
  thresholdDraft: TriCurrencyDraft | null;
  setThresholdField: (field: TriCurrencyAmountKey, raw: string) => void;
  svcRuleDrafts: SvcRuleDraft[];
  setSvcRuleDrafts: Dispatch<SetStateAction<SvcRuleDraft[]>>;
  svcRuleFieldErrors: Record<string, SvcRuleFieldError>;
  onAddSvcRule: () => void;
  mainPricingSuppliers: PricingSupplier[];
  altSuppliersByMainId: Map<number, PricingSupplier[]>;
  newAltByMainId: Record<number, { name: string }>;
  setNewAltByMainId: Dispatch<SetStateAction<Record<number, { name: string }>>>;
  tariffRangesDrafts: Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>>;
  setTariffRangesDrafts: Dispatch<SetStateAction<Record<number, Array<{ id: string; min_kg: string; max_kg: string; rub: string }>>>>;
  tariffNameDrafts: Record<number, string>;
  setTariffNameDrafts: Dispatch<SetStateAction<Record<number, string>>>;
  onDeleteSupplier: (supplierId: number) => Promise<void>;
  onRemoveTariffRange: (supplierId: number, rowId: string) => void;
  onAddTariffRange: (supplierId: number) => void;
  onCreateAltSupplier: (mainSupplierId: number) => Promise<void>;
  newSupplierName: string;
  setNewSupplierName: Dispatch<SetStateAction<string>>;
  onCreateMainSupplier: () => Promise<void>;
  sources: SourceItem[];
  sourcePricingDrafts: Record<string, SourcePricingDraft>;
  setSourcePricingDrafts: Dispatch<SetStateAction<Record<string, SourcePricingDraft>>>;
  mainSupplierIdByAnySupplierId: Map<number, number>;
  setSourceBuyoutField: (sourceKey: string, field: TriCurrencyAmountKey, raw: string) => void;
};

export function AdminPricingTab({
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
  pricingExampleError,
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
}: Props) {
  return (
    <div className="card">
      <h2>Настройки ценообразования</h2>
      {(pricingTabLoading && !pricingSettings) || !pricingSettings || pricingBlockedByInitialBybit ? (
        <AdminPricingSkeleton />
      ) : (
        <>
          <AdminPricingWorkerSection
            pricingSettings={pricingSettings}
            bybitWorkerInfo={bybitWorkerInfo}
            showBybitErrorPopup={showBybitErrorPopup}
            setShowBybitErrorPopup={setShowBybitErrorPopup}
            formatDateTime={formatDateTime}
          />

          <AdminPricingFormulaSection
            pricingSettings={pricingSettings}
            pricingFormulaHtml={pricingFormulaHtml}
            pricingExample={pricingExample}
            pricingExampleLoading={pricingExampleLoading}
            pricingExampleError={pricingExampleError}
          />

          <AdminPricingCoreFieldsSection
            pricingSettings={pricingSettings}
            markupRateDraft={markupRateDraft}
            setMarkupRateDraft={setMarkupRateDraft}
            pricingDrafts={pricingDrafts}
            setPricingDrafts={setPricingDrafts}
            finalRoundingModeDraft={finalRoundingModeDraft}
            setFinalRoundingModeDraft={setFinalRoundingModeDraft}
          />

          <AdminPricingThresholdSection thresholdDraft={thresholdDraft} setThresholdField={setThresholdField} />

          <AdminPricingSvcSection
            svcRuleDrafts={svcRuleDrafts}
            setSvcRuleDrafts={setSvcRuleDrafts}
            svcRuleFieldErrors={svcRuleFieldErrors}
            onAddSvcRule={onAddSvcRule}
          />

          <AdminPricingTariffsSection
            mainPricingSuppliers={mainPricingSuppliers}
            altSuppliersByMainId={altSuppliersByMainId}
            newAltByMainId={newAltByMainId}
            setNewAltByMainId={setNewAltByMainId}
            tariffRangesDrafts={tariffRangesDrafts}
            setTariffRangesDrafts={setTariffRangesDrafts}
            tariffNameDrafts={tariffNameDrafts}
            setTariffNameDrafts={setTariffNameDrafts}
            onDeleteSupplier={onDeleteSupplier}
            onRemoveTariffRange={onRemoveTariffRange}
            onAddTariffRange={onAddTariffRange}
            onCreateAltSupplier={onCreateAltSupplier}
            newSupplierName={newSupplierName}
            setNewSupplierName={setNewSupplierName}
            onCreateMainSupplier={onCreateMainSupplier}
          />

          <AdminPricingSourcesSection
            sources={sources}
            sourcePricingDrafts={sourcePricingDrafts}
            setSourcePricingDrafts={setSourcePricingDrafts}
            mainSupplierIdByAnySupplierId={mainSupplierIdByAnySupplierId}
            mainPricingSuppliers={mainPricingSuppliers}
            setSourceBuyoutField={setSourceBuyoutField}
          />
        </>
      )}
    </div>
  );
}
