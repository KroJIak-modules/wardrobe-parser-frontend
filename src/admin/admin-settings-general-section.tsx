import type { PricingSettings } from "../shared/live-data-context";
import { HelpHint } from "./help-hint";

type Props = {
  pricingSettings: PricingSettings | null;
  designersMinProductsDraft: string;
  setDesignersMinProductsDraft: (value: string) => void;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function AdminSettingsGeneralSection({
  pricingSettings,
  designersMinProductsDraft,
  setDesignersMinProductsDraft,
  updatePricingSettings,
  pushToast,
}: Props) {
  return (
    <div className="pricing-settings-grid pricing-settings-grid--spaced">
      <label className="pricing-settings-field">
        <span className="muted with-help">
          <span className="pricing-field-label">
            <span>Минимум товаров у бренда для категории «Дизайнеры»</span>
          </span>
          <HelpHint text="Бренд попадет в ветку «Дизайнеры», только если у него не меньше этого количества товаров." />
        </span>
        <input
          className="pricing-settings-input--compact"
          type="number"
          min="1"
          step="1"
          value={designersMinProductsDraft}
          onChange={(event) => setDesignersMinProductsDraft(event.target.value)}
          disabled={!pricingSettings}
        />
      </label>

      <div className="pricing-settings-field">
        <span className="muted with-help">
          <HelpHint text="Если включено, из «Дизайнеров» убираются бренды, которые совпадают с именем/доменом самого источника." />
        </span>
        <label className="ui-switch ui-switch--compact">
          <input
            type="checkbox"
            checked={Boolean(pricingSettings?.designers_exclude_store_vendors)}
            disabled={!pricingSettings}
            onChange={(event) => {
              void (async () => {
                if (!pricingSettings) return;
                const result = await updatePricingSettings({ designers_exclude_store_vendors: Boolean(event.target.checked) });
                if (!result.ok) pushToast(result.message);
              })();
            }}
          />
          <span className="ui-switch-track">
            <span className="ui-switch-thumb" />
          </span>
          <span className="ui-switch-text">Исключать бренды-магазины</span>
        </label>
      </div>

    </div>
  );
}
