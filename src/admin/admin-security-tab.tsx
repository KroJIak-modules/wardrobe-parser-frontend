import type { ChangeEvent, RefObject } from "react";
import { AdminSettingsSecuritySection } from "./admin-settings-security-section";

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

export function AdminSecurityTab(props: Props) {
  return <AdminSettingsSecuritySection {...props} />;
}
