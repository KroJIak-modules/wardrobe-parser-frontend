import type { ChangeEvent, RefObject } from "react";
import { AdminSectionSkeleton } from "../shared/skeleton";

type Props = {
  settingsExportInProgress: boolean;
  settingsImportInProgress: boolean;
  settingsResetInProgress: boolean;
  resetConfirmOpen: boolean;
  pendingImport: unknown | null;
  onExportSettings: () => Promise<void>;
  onOpenImportDialog: () => void;
  settingsImportInputRef: RefObject<HTMLInputElement | null>;
  onImportSettingsFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCancelImportSettings: () => void;
  onConfirmImportSettings: () => Promise<void>;
  onRequestResetSettings: () => void;
  onCancelResetSettings: () => void;
  onConfirmResetSettings: () => Promise<void>;
};

export function AdminSettingsTransferSection({
  settingsExportInProgress,
  settingsImportInProgress,
  settingsResetInProgress,
  resetConfirmOpen,
  pendingImport,
  onExportSettings,
  onOpenImportDialog,
  settingsImportInputRef,
  onImportSettingsFile,
  onCancelImportSettings,
  onConfirmImportSettings,
  onRequestResetSettings,
  onCancelResetSettings,
  onConfirmResetSettings,
}: Props) {
  return (
    <>
      {settingsExportInProgress || settingsImportInProgress || settingsResetInProgress ? <AdminSectionSkeleton rows={2} /> : null}
      <p className="muted">
        Экспортируются все переносимые настройки: роли и права, контент сайта и пароль доступа, ценообразование, поставщики, источники и их конфигурация, правила веса, дизайнеры, структура каталога и медиа витрины.
        Товары, пользователи, пароли администраторов, история синхронизаций и ручные привязки товаров не переносятся.
      </p>
      <div className="settings-transfer-actions">
        <button type="button" onClick={() => void onExportSettings()} disabled={settingsExportInProgress || settingsImportInProgress || settingsResetInProgress}>
          {settingsExportInProgress ? "Экспорт..." : "Экспорт"}
        </button>
        <button type="button" onClick={onOpenImportDialog} disabled={settingsExportInProgress || settingsImportInProgress || settingsResetInProgress}>
          {settingsImportInProgress ? "Импорт..." : "Импорт"}
        </button>
        <button type="button" className="topbar-cta--danger" onClick={onRequestResetSettings} disabled={settingsExportInProgress || settingsImportInProgress || settingsResetInProgress || Boolean(pendingImport)}>
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
      {pendingImport ? (
        <div className="modal-backdrop" onClick={onCancelImportSettings}>
          <div className="modal modal--danger-confirm" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Импорт настроек</h3>
            </div>
            <p className="muted">
              Импорт заменит настройки на сервере: источники, тарифы, правила веса, структуру каталога, контент и медиа. Отсутствующие в файле источники, тарифы и неиспользуемые дизайнеры будут удалены. Файл содержит пароль доступа к сайту в открытом виде.
            </p>
            <div className="settings-transfer-actions">
              <button type="button" onClick={onCancelImportSettings} disabled={settingsImportInProgress}>Отменить</button>
              <button type="button" className="topbar-cta--danger" onClick={() => void onConfirmImportSettings()} disabled={settingsImportInProgress}>
                {settingsImportInProgress ? "Импорт..." : "Импортировать"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {resetConfirmOpen ? (
        <div className="modal-backdrop" onClick={onCancelResetSettings}>
          <div className="modal modal--danger-confirm" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Сброс настроек</h3>
            </div>
            <p className="muted">
              Сброс заменит цены, тарифы, настройки источников, правила веса, маппинги дизайнеров, пароль сайта, текст «Обо мне» и FAQ значениями по умолчанию. Это действие необратимо.
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
