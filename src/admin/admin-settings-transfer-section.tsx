import type { ChangeEvent, RefObject } from "react";
import { AdminSectionSkeleton } from "../shared/skeleton";

type Props = {
  settingsExportInProgress: boolean;
  settingsImportInProgress: boolean;
  onExportSettings: () => Promise<void>;
  onOpenImportDialog: () => void;
  settingsImportInputRef: RefObject<HTMLInputElement | null>;
  onImportSettingsFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function AdminSettingsTransferSection({
  settingsExportInProgress,
  settingsImportInProgress,
  onExportSettings,
  onOpenImportDialog,
  settingsImportInputRef,
  onImportSettingsFile,
}: Props) {
  return (
    <>
      {settingsExportInProgress || settingsImportInProgress ? <AdminSectionSkeleton rows={2} /> : null}
      <p className="muted">
        Экспортируется конфигурация панели управления: ценообразование, поставщики, источники, правила веса и категории.
        Товары в файл не попадают.
      </p>
      <div className="settings-transfer-actions">
        <button type="button" onClick={() => void onExportSettings()} disabled={settingsExportInProgress}>
          {settingsExportInProgress ? "Экспорт..." : "Экспорт"}
        </button>
        <button type="button" onClick={onOpenImportDialog} disabled={settingsImportInProgress}>
          {settingsImportInProgress ? "Импорт..." : "Импорт"}
        </button>
        <input
          ref={settingsImportInputRef}
          type="file"
          accept="application/json,.json"
          className="input-hidden"
          onChange={(event) => void onImportSettingsFile(event)}
        />
      </div>
    </>
  );
}
