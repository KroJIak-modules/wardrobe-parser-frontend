import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import type { AdminUiSettings } from "./admin-types";
import { AdminSettingsSkeleton } from "../shared/skeleton";
import { AdminSettingsGeneralSection } from "./admin-settings-general-section";
import { AdminShowcaseMediaSection } from "./admin-showcase-media-section";
import { AdminSettingsTransferSection } from "./admin-settings-transfer-section";

type CarouselItem = { id: number };

type Props = {
  pricingTabLoading: boolean;
  adminUiSettings: AdminUiSettings | null;
  designersMinProductsDraft: string;
  setDesignersMinProductsDraft: (value: string) => void;
  updateAdminUiSettings: (payload: Partial<AdminUiSettings>) => Promise<{ ok: boolean; message: string }>;
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
  settingsResetInProgress: boolean;
  resetConfirmOpen: boolean;
  onExportSettings: () => Promise<void>;
  onOpenImportDialog: () => void;
  settingsImportInputRef: RefObject<HTMLInputElement | null>;
  onImportSettingsFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRequestResetSettings: () => void;
  onCancelResetSettings: () => void;
  onConfirmResetSettings: () => Promise<void>;
};

export function AdminSettingsTab({
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
  setDraggingCarouselId,
  onReorderCarouselImage,
  onRemoveCarouselImage,
  carouselInputRef,
  onPickCarouselImages,
  settingsExportInProgress,
  settingsImportInProgress,
  settingsResetInProgress,
  resetConfirmOpen,
  onExportSettings,
  onOpenImportDialog,
  settingsImportInputRef,
  onImportSettingsFile,
  onRequestResetSettings,
  onCancelResetSettings,
  onConfirmResetSettings,
}: Props) {
  return (
    <div className="admin-settings-layout">
      <section className="card admin-settings-section">
        <h2>Параметры витрины</h2>
        {pricingTabLoading && !adminUiSettings ? <AdminSettingsSkeleton /> : null}
        <AdminSettingsGeneralSection
          adminUiSettings={adminUiSettings}
          designersMinProductsDraft={designersMinProductsDraft}
          setDesignersMinProductsDraft={setDesignersMinProductsDraft}
          updateAdminUiSettings={updateAdminUiSettings}
          pushToast={pushToast}
        />
      </section>

      <section className="card admin-settings-section">
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
      </section>

      <section className="card admin-settings-section">
        <h2>Экспорт и импорт настроек</h2>
        <AdminSettingsTransferSection
          settingsExportInProgress={settingsExportInProgress}
          settingsImportInProgress={settingsImportInProgress}
          settingsResetInProgress={settingsResetInProgress}
          resetConfirmOpen={resetConfirmOpen}
          onExportSettings={onExportSettings}
          onOpenImportDialog={onOpenImportDialog}
          settingsImportInputRef={settingsImportInputRef}
          onImportSettingsFile={onImportSettingsFile}
          onRequestResetSettings={onRequestResetSettings}
          onCancelResetSettings={onCancelResetSettings}
          onConfirmResetSettings={onConfirmResetSettings}
        />
      </section>
    </div>
  );
}
