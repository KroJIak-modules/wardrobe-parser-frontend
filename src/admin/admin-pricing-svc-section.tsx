import type { Dispatch, SetStateAction } from "react";
import { HelpHint } from "./help-hint";
import type { SvcRuleDraft, SvcRuleFieldError } from "./admin-types";

type Props = {
  svcRuleDrafts: SvcRuleDraft[];
  setSvcRuleDrafts: Dispatch<SetStateAction<SvcRuleDraft[]>>;
  svcRuleFieldErrors: Record<string, SvcRuleFieldError>;
  onAddSvcRule: () => void;
};

export function AdminPricingSvcSection({ svcRuleDrafts, setSvcRuleDrafts, svcRuleFieldErrors, onAddSvcRule }: Props) {
  return (
    <>
      <h3 className="with-help">
        Надбавка SVC
        <HelpHint text="SVC — это ваша надбавка по диапазонам BUY. Диапазоны не должны пересекаться и касаться границ друг друга." />
      </h3>
      <div className="pricing-svc-list">
        <div className="pricing-svc-head">
          <span>Начало BUY (RUB)</span>
          <span>Конец BUY (RUB)</span>
          <span>Режим</span>
          <span>Значение</span>
          <span></span>
        </div>
        {svcRuleDrafts.map((rule) => {
          const rowError = svcRuleFieldErrors[rule.id] ?? { min: false, max: false, value: false };
          return (
            <div key={rule.id} className="pricing-svc-row">
              <input
                className={rowError.min ? "input-error" : undefined}
                type="number"
                min="0"
                step="0.01"
                value={rule.min_rub}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, min_rub: nextValue } : item)));
                }}
              />
              <input
                className={rowError.max ? "input-error" : undefined}
                type="number"
                min="0"
                step="0.01"
                placeholder=""
                value={rule.max_rub}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, max_rub: nextValue } : item)));
                }}
              />
              <select
                value={rule.mode}
                onChange={(event) => {
                  const nextMode = event.target.value === "percent" ? "percent" : "fixed_rub";
                  setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, mode: nextMode } : item)));
                }}
              >
                <option value="fixed_rub">Ручная сумма (RUB)</option>
                <option value="percent">Процент от BUY</option>
              </select>
              <input
                className={rowError.value ? "input-error" : undefined}
                type="number"
                min="0"
                step={rule.mode === "percent" ? "0.0001" : "0.01"}
                value={rule.value}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, value: nextValue } : item)));
                }}
              />
              <button type="button" onClick={() => setSvcRuleDrafts((prev) => prev.filter((item) => item.id !== rule.id))}>
                Удалить
              </button>
            </div>
          );
        })}
        <div className="pricing-svc-actions">
          <button type="button" onClick={onAddSvcRule}>
            Добавить надбавку
          </button>
        </div>
      </div>
    </>
  );
}
