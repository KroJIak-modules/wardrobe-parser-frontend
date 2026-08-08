import { useRef, useState, type ChangeEvent } from "react";
import type { SettingsTransferPayload } from "../../shared/live-data-context";

type UseAdminSettingsTransferParams = {
  exportSettings: () => Promise<{ ok: boolean; message: string; payload?: SettingsTransferPayload }>;
  importSettings: (payload: SettingsTransferPayload) => Promise<{ ok: boolean; message: string }>;
  resetSettings: () => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminSettingsTransfer(params: UseAdminSettingsTransferParams) {
  const { exportSettings, importSettings, resetSettings, pushToast } = params;

  const settingsImportInputRef = useRef<HTMLInputElement | null>(null);
  const [settingsExportInProgress, setSettingsExportInProgress] = useState<boolean>(false);
  const [settingsImportInProgress, setSettingsImportInProgress] = useState<boolean>(false);
  const [settingsResetInProgress, setSettingsResetInProgress] = useState<boolean>(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [pendingImport, setPendingImport] = useState<SettingsTransferPayload | null>(null);

  const isTransferBusy = settingsExportInProgress || settingsImportInProgress || settingsResetInProgress;

  const onExportSettings = async () => {
    if (isTransferBusy) {
      return;
    }
    setSettingsExportInProgress(true);
    try {
      const result = await exportSettings();
      if (!result.ok || !result.payload) {
        pushToast(result.message);
        return;
      }
      const now = new Date();
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const fileName = `settings-export-${stamp}.json`;
      const json = JSON.stringify(result.payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      pushToast("Файл настроек выгружен");
    } finally {
      setSettingsExportInProgress(false);
    }
  };

  const onOpenImportDialog = () => {
    if (isTransferBusy) {
      return;
    }
    settingsImportInputRef.current?.click();
  };

  const onImportSettingsFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setSettingsImportInProgress(true);
    try {
      const text = await file.text();
      let payload: SettingsTransferPayload;
      try {
        payload = JSON.parse(text) as SettingsTransferPayload;
      } catch {
        pushToast("Файл не похож на валидный JSON");
        return;
      }
      setPendingImport(payload);
    } catch {
      pushToast("Не удалось прочитать файл настроек");
    } finally {
      setSettingsImportInProgress(false);
    }
  };

  const onCancelImportSettings = () => {
    if (!settingsImportInProgress) {
      setPendingImport(null);
    }
  };

  const onConfirmImportSettings = async () => {
    if (!pendingImport || isTransferBusy) {
      return;
    }
    setSettingsImportInProgress(true);
    try {
      const result = await importSettings(pendingImport);
      pushToast(result.message);
      if (result.ok) {
        setPendingImport(null);
      }
    } finally {
      setSettingsImportInProgress(false);
    }
  };

  const onRequestResetSettings = () => {
    if (isTransferBusy || pendingImport) {
      return;
    }
    setResetConfirmOpen(true);
  };

  const onCancelResetSettings = () => {
    if (settingsResetInProgress) {
      return;
    }
    setResetConfirmOpen(false);
  };

  const onConfirmResetSettings = async () => {
    if (isTransferBusy) {
      return;
    }
    setSettingsResetInProgress(true);
    try {
      const result = await resetSettings();
      pushToast(result.message);
      if (result.ok) {
        setResetConfirmOpen(false);
      }
    } finally {
      setSettingsResetInProgress(false);
    }
  };

  return {
    settingsImportInputRef,
    settingsExportInProgress,
    settingsImportInProgress,
    settingsResetInProgress,
    resetConfirmOpen,
    pendingImport,
    onExportSettings,
    onOpenImportDialog,
    onImportSettingsFile,
    onCancelImportSettings,
    onConfirmImportSettings,
    onRequestResetSettings,
    onCancelResetSettings,
    onConfirmResetSettings,
  };
}
