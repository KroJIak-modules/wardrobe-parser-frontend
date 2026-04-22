import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import type { PricingSettings } from "../shared/live-data-context";
import { AdminSettingsSkeleton } from "../shared/skeleton";
import { AdminSettingsGeneralSection } from "./admin-settings-general-section";
import { AdminShowcaseMediaSection } from "./admin-showcase-media-section";
import { AdminSettingsTransferSection } from "./admin-settings-transfer-section";

type CarouselItem = { id: number };

type Props = {
  pricingTabLoading: boolean;
  pricingSettings: PricingSettings | null;
  designersMinProductsDraft: string;
  setDesignersMinProductsDraft: (value: string) => void;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
  showcaseHeroImageId: number | null;
  heroInputRef: RefObject<HTMLInputElement | null>;
  showcaseSaving: boolean;
  onRemoveHeroImage: (event: MouseEvent<HTMLButtonElement>) => Promise<void>;
  onPickHeroImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  showcaseCarousel: CarouselItem[];
  setDraggingCarouselId: (id: number | null) => void;
  onReorderCarouselImage: (targetId: number) => Promise<void>;
  onRemoveCarouselImage: (imageId: number) => Promise<void>;
  carouselInputRef: RefObject<HTMLInputElement | null>;
  onPickCarouselImages: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  settingsExportInProgress: boolean;
  settingsImportInProgress: boolean;
  onExportSettings: () => Promise<void>;
  onOpenImportDialog: () => void;
  settingsImportInputRef: RefObject<HTMLInputElement | null>;
  onImportSettingsFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function AdminSettingsTab({
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
  setDraggingCarouselId,
  onReorderCarouselImage,
  onRemoveCarouselImage,
  carouselInputRef,
  onPickCarouselImages,
  settingsExportInProgress,
  settingsImportInProgress,
  onExportSettings,
  onOpenImportDialog,
  settingsImportInputRef,
  onImportSettingsFile,
}: Props) {
  return (
    <div className="card">
      <h2>Параметры витрины</h2>
      {pricingTabLoading && !pricingSettings ? <AdminSettingsSkeleton /> : null}
      <AdminSettingsGeneralSection
        pricingSettings={pricingSettings}
        designersMinProductsDraft={designersMinProductsDraft}
        setDesignersMinProductsDraft={setDesignersMinProductsDraft}
        updatePricingSettings={updatePricingSettings}
        pushToast={pushToast}
      />

      <h2>Медиа витрины</h2>
      <AdminShowcaseMediaSection
        showcaseHeroImageId={showcaseHeroImageId}
        heroInputRef={heroInputRef}
        showcaseSaving={showcaseSaving}
        onRemoveHeroImage={onRemoveHeroImage}
        onPickHeroImage={onPickHeroImage}
        showcaseCarousel={showcaseCarousel}
        setDraggingCarouselId={setDraggingCarouselId}
        onReorderCarouselImage={onReorderCarouselImage}
        onRemoveCarouselImage={onRemoveCarouselImage}
        carouselInputRef={carouselInputRef}
        onPickCarouselImages={onPickCarouselImages}
      />

      <h2>Экспорт и импорт настроек</h2>
      <AdminSettingsTransferSection
        settingsExportInProgress={settingsExportInProgress}
        settingsImportInProgress={settingsImportInProgress}
        onExportSettings={onExportSettings}
        onOpenImportDialog={onOpenImportDialog}
        settingsImportInputRef={settingsImportInputRef}
        onImportSettingsFile={onImportSettingsFile}
      />
    </div>
  );
}
