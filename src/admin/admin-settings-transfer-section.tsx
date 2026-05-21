import type { ChangeEvent, RefObject } from "react";
import { AdminSectionSkeleton } from "../shared/skeleton";

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
};

export function AdminSettingsTransferSection({
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
    <>
      {settingsExportInProgress || settingsImportInProgress || settingsResetInProgress ? <AdminSectionSkeleton rows={2} /> : null}
      <p className="muted">
        Экспортируется конфигурация панели управления: ценообразование, поставщики, источники, правила веса, категории, дизайнеры и настройки витрины.
        Товары в файл не попадают.
      </p>
      <div className="settings-transfer-actions">
        <button type="button" onClick={() => void onExportSettings()} disabled={settingsExportInProgress}>
          {settingsExportInProgress ? "Экспорт..." : "Экспорт"}
        </button>
        <button type="button" onClick={onOpenImportDialog} disabled={settingsImportInProgress}>
          {settingsImportInProgress ? "Импорт..." : "Импорт"}
        </button>
        <button type="button" className="topbar-cta--danger" onClick={onRequestResetSettings} disabled={settingsResetInProgress}>
          {settingsResetInProgress ? "Сброс..." : "Сброс настроек"}
        </button>
        <input
          ref={settingsImportInputRef}
          type="file"
          accept="application/json,.json"
          className="input-hidden"
          onChange={(event) => void onImportSettingsFile(event)}
        />
      </div>
      {resetConfirmOpen ? (
        <div className="modal-backdrop" onClick={onCancelResetSettings}>
          <div className="modal modal--danger-confirm" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Сброс настроек</h3>
            </div>
            <p className="muted">
              Вы точно хотите сбросить все настройки в этих вкладках? Это действие необратимо, восстановить данные не получится.
            </p>
            <div className="settings-transfer-actions">
              <button type="button" onClick={onCancelResetSettings} disabled={settingsResetInProgress}>Отменить</button>
              <button type="button" className="topbar-cta--danger" onClick={() => void onConfirmResetSettings()} disabled={settingsResetInProgress}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
