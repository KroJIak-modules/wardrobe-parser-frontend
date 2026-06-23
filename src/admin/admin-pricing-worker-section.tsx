import type { Dispatch, SetStateAction } from "react";
import type { PricingSettings } from "../shared/live-data-context";
import { formatCompactNumber } from "./admin-formatters";
import { HelpHint } from "./help-hint";
import type { BybitWorkerInfo } from "./admin-types";

type Props = {
  pricingSettings: PricingSettings;
  bybitWorkerInfo: BybitWorkerInfo;
  showBybitErrorPopup: boolean;
  setShowBybitErrorPopup: Dispatch<SetStateAction<boolean>>;
  formatDateTime: (value: string | null | undefined) => string;
};

export function AdminPricingWorkerSection({
  pricingSettings,
  bybitWorkerInfo,
  showBybitErrorPopup,
  setShowBybitErrorPopup,
  formatDateTime,
}: Props) {
  return (
    <div className="pricing-worker-box">
      <h3 className="with-help">
        Состояние воркера Bybit
        <HelpHint text="Здесь видно, как работает фоновый процесс обновления курса Bybit, и можно быстро проверить расчет для нужной суммы." />
      </h3>
      <div className="pricing-worker-grid">
        <div className="pricing-worker-item">
          <span className="muted">Состояние</span>
          {bybitWorkerInfo.errorMessage ? (
            <div className="pricing-worker-error-wrap">
              <button type="button" className={bybitWorkerInfo.stateClass} onClick={() => setShowBybitErrorPopup((prev) => !prev)}>
                {bybitWorkerInfo.stateLabel}
              </button>
              {showBybitErrorPopup ? (
                <div className="pricing-worker-error-popup">
                  <strong>Лог ошибки</strong>
                  <pre>{bybitWorkerInfo.errorMessage}</pre>
                </div>
              ) : null}
            </div>
          ) : (
            <span className={bybitWorkerInfo.stateClass}>{bybitWorkerInfo.stateLabel}</span>
          )}
        </div>
        <div className="pricing-worker-item">
          <span className="muted">Интервал</span>
          <strong>{bybitWorkerInfo.intervalLabel}</strong>
        </div>
        <div className="pricing-worker-item">
          <span className="muted">Последнее обновление</span>
          <strong>{formatDateTime(pricingSettings.bybit_last_updated_at)}</strong>
          <span className="muted">{bybitWorkerInfo.ageLabel}</span>
        </div>
        <div className="pricing-worker-item">
          <span className="muted">Выбранный курс</span>
          <strong>{formatCompactNumber(pricingSettings.usdt_to_rub_rate, 4)} RUB/USDT</strong>
          <span className="muted">BFX: {formatCompactNumber(pricingSettings.usdt_to_rub_rate + pricingSettings.usdt_extra_rub, 4)} RUB/USDT</span>
        </div>
      </div>
    </div>
  );
}
