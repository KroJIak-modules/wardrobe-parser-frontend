import type { ChangeEvent, RefObject } from "react";
import { AdminSiteAccessSection } from "./admin-site-access-section";
import { AdminSettingsAccountsSection } from "./admin-settings-accounts-section";
import { AdminSettingsTransferSection } from "./admin-settings-transfer-section";
import "./admin-settings-tab.css";

type Props = {
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
  pushToast: (message: string) => void;
};

export function AdminSettingsSecuritySection({
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
  pushToast,
}: Props) {
  return (
    <div className="admin-settings-pane">
      <AdminSiteAccessSection pushToast={pushToast} />

      <section className="card admin-settings-panel">
        <div className="admin-settings-panel__head">
          <div>
            <h2>Безопасность</h2>
          </div>
        </div>
        <AdminSettingsAccountsSection pushToast={pushToast} />
      </section>

      <section className="card admin-settings-panel admin-settings-panel--utility">
        <h3>Экспорт и импорт настроек</h3>
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
