import type { Dispatch, SetStateAction } from "react";
import { HelpHint } from "./help-hint";
import type { SvcRuleDraft, SvcRuleFieldError } from "./admin-types";

type Props = {
  svcRuleDrafts: SvcRuleDraft[];
  setSvcRuleDrafts: Dispatch<SetStateAction<SvcRuleDraft[]>>;
  svcRuleFieldErrors: Record<string, SvcRuleFieldError>;
  svcRulesValidationError: string | null;
  onAddSvcRule: () => void;
};

export function AdminPricingSvcSection({
  svcRuleDrafts,
  setSvcRuleDrafts,
  svcRuleFieldErrors,
  svcRulesValidationError,
  onAddSvcRule,
}: Props) {
  return (
    <>
      <h3 className="with-help">
        Тарифная сетка SVC
        <HelpHint text="Это твоя собственная надбавка по диапазонам BUY. Для каждого диапазона можно задать либо фикс в рублях, либо процент от BUY." />
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
                type="text"
                inputMode="decimal"
                value={rule.min_rub}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSvcRuleDrafts((prev) => prev.map((item) => (item.id === rule.id ? { ...item, min_rub: nextValue } : item)));
                }}
              />
              <input
                className={rowError.max ? "input-error" : undefined}
                type="text"
                inputMode="decimal"
                placeholder="Без верхней границы"
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
                <option value="fixed_rub">Фикс в RUB</option>
                <option value="percent">% от BUY</option>
              </select>
              <input
                className={rowError.value ? "input-error" : undefined}
                type="text"
                inputMode="decimal"
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
            Добавить диапазон
          </button>
        </div>
        {svcRulesValidationError ? <p className="form-error-text">{svcRulesValidationError}</p> : null}
      </div>
    </>
  );
}
