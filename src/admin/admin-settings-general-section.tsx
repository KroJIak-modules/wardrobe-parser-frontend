import type { PricingSettings } from "../shared/live-data-context";
import { HelpHint } from "./help-hint";

type Props = {
  pricingSettings: PricingSettings | null;
  designersMinProductsDraft: string;
  setDesignersMinProductsDraft: (value: string) => void;
  updatePricingSettings: (payload: Partial<PricingSettings>) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

function ToggleField({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => Promise<void>;
}) {
  return (
    <div className="pricing-settings-field">
      <span className="muted with-help">
        <span className="pricing-field-label">
          <span>{label}</span>
        </span>
        <HelpHint text={hint} />
      </span>
      <label className="ui-switch ui-switch--compact">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => {
            void onChange(Boolean(event.target.checked));
          }}
        />
        <span className="ui-switch-track">
          <span className="ui-switch-thumb" />
        </span>
        <span className="ui-switch-text">{checked ? "Включено" : "Выключено"}</span>
      </label>
    </div>
  );
}

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
            <span>Минимум товаров у бренда для «Дизайнеров»</span>
          </span>
          <HelpHint text="Бренд попадет в ветку «Дизайнеры», только если у него не меньше этого количества товаров." />
        </span>
        <input
          type="number"
          min="1"
          step="1"
          value={designersMinProductsDraft}
          onChange={(event) => setDesignersMinProductsDraft(event.target.value)}
          disabled={!pricingSettings}
        />
      </label>

      <ToggleField
        label="Исключать бренды-магазины"
        hint="Если включено, из «Дизайнеров» убираются бренды, которые совпадают с именем/доменом самого источника."
        checked={Boolean(pricingSettings?.designers_exclude_store_vendors)}
        disabled={!pricingSettings}
        onChange={async (checked) => {
          if (!pricingSettings) return;
          const result = await updatePricingSettings({ designers_exclude_store_vendors: checked });
          if (!result.ok) pushToast(result.message);
        }}
      />

      <ToggleField
        label="Показывать только доступные товары в дедубликации"
        hint="Если включено, кандидаты в дедубликации формируются только из товаров со статусом «В наличии»."
        checked={Boolean(pricingSettings?.dedup_only_available_products)}
        disabled={!pricingSettings}
        onChange={async (checked) => {
          if (!pricingSettings) return;
          const result = await updatePricingSettings({ dedup_only_available_products: checked });
          if (!result.ok) pushToast(result.message);
        }}
      />
    </div>
  );
}
