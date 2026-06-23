import type { AdminUiSettings } from "./admin-types";
import { HelpHint } from "./help-hint";
import { useEffect } from "react";

type Props = {
  adminUiSettings: AdminUiSettings | null;
  designersMinProductsDraft: string;
  setDesignersMinProductsDraft: (value: string) => void;
  updateAdminUiSettings: (payload: Partial<AdminUiSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function AdminSettingsGeneralSection({
  adminUiSettings,
  designersMinProductsDraft,
  setDesignersMinProductsDraft,
  updateAdminUiSettings,
  pushToast,
}: Props) {
  useEffect(() => {
    if (!adminUiSettings) return;
    const parsed = Number((designersMinProductsDraft || "").trim());
    if (!Number.isFinite(parsed) || parsed < 1) return;
    const nextValue = Math.max(1, Math.trunc(parsed));
    const currentValue = Math.max(1, Math.trunc(Number(adminUiSettings.designers_min_products || 1)));
    if (nextValue === currentValue) return;
    const timer = window.setTimeout(async () => {
      const result = await updateAdminUiSettings({ designers_min_products: nextValue });
      if (!result.ok) pushToast(result.message);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [designersMinProductsDraft, adminUiSettings, updateAdminUiSettings, pushToast]);

  return (
    <div className="pricing-settings-grid pricing-settings-grid--spaced">
      <div className="pricing-settings-field pricing-settings-field--stacked">
        <label className="pricing-settings-field">
          <span className="with-help">
            <span className="pricing-field-title">Порог дизайнера для категории «Дизайнеры»</span>
            <HelpHint text="Дизайнер попадет в ветку «Дизайнеры», только если у него не меньше этого количества товаров." />
          </span>
          <input
            className="pricing-settings-input--compact"
            type="number"
            min="1"
            step="1"
            value={designersMinProductsDraft}
            onChange={(event) => setDesignersMinProductsDraft(event.target.value)}
            disabled={!adminUiSettings}
          />
        </label>
        <label className="ui-switch ui-switch--compact">
          <input
            type="checkbox"
            checked={Boolean(adminUiSettings?.designers_exclude_store_names)}
            disabled={!adminUiSettings}
            onChange={(event) => {
              void (async () => {
                if (!adminUiSettings) return;
                const result = await updateAdminUiSettings({ designers_exclude_store_names: Boolean(event.target.checked) });
                if (!result.ok) pushToast(result.message);
              })();
            }}
          />
          <span className="ui-switch-track">
            <span className="ui-switch-thumb" />
          </span>
          <span className="ui-switch-text">Исключать названия магазинов</span>
          <span className="settings-inline-hint">
            <HelpHint text="Если включено, из «Дизайнеров» убираются названия, которые совпадают с именем или доменом самого источника." />
          </span>
        </label>
      </div>

    </div>
  );
}
