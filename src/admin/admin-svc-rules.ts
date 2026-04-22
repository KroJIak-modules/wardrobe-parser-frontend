import { formatCompactNumber, parseSvcRuleDraft } from "./admin-formatters";
import type { SvcRuleDraft, SvcRuleFieldError, SvcRulePayload } from "./admin-types";

function buildSvcDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `svc-new-${crypto.randomUUID()}`;
  }
  return `svc-new-${Date.now()}`;
}

export function buildSvcRuleDraftsFromSettings(sourceRules: unknown[]): SvcRuleDraft[] {
  return sourceRules
    .map((row, index) => {
      const raw = row as Record<string, unknown>;
      const minRub = Number(raw.min_rub);
      const maxRaw = raw.max_rub;
      const maxRub = maxRaw === null || maxRaw === undefined || String(maxRaw).trim() === "" ? null : Number(maxRaw);
      const value = Number(raw.value);
      if (!Number.isFinite(minRub) || !Number.isFinite(value)) {
        return null;
      }
      if (maxRub !== null && !Number.isFinite(maxRub)) {
        return null;
      }
      if (minRub < 0 || (maxRub !== null && maxRub <= minRub) || value < 0) {
        return null;
      }
      const mode = String(raw.mode || "fixed_rub").toLowerCase() === "percent" ? "percent" : "fixed_rub";
      return {
        id: `svc-${index}-${minRub}-${maxRub ?? "inf"}`,
        min_rub: formatCompactNumber(minRub, 6),
        max_rub: maxRub === null ? "" : formatCompactNumber(maxRub, 6),
        mode,
        value: formatCompactNumber(value, 6),
      } as SvcRuleDraft;
    })
    .filter(Boolean) as SvcRuleDraft[];
}

export function getSvcRulesValidationError(drafts: SvcRuleDraft[]): string | null {
  const parsed = drafts.map(parseSvcRuleDraft).filter(Boolean) as SvcRulePayload[];
  if (parsed.length !== drafts.length) {
    return "SVC: заполни начало, конец и значение корректными числами";
  }
  for (const row of parsed) {
    if (row.max_rub !== null && row.max_rub <= row.min_rub) {
      return "SVC: конец диапазона должен быть больше начала";
    }
  }
  parsed.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
  for (let i = 1; i < parsed.length; i += 1) {
    const prevMax = parsed[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
    if (parsed[i].min_rub < prevMax) {
      return "SVC: диапазоны пересекаются";
    }
  }
  return null;
}

export function getSvcRuleFieldErrors(drafts: SvcRuleDraft[]): Record<string, SvcRuleFieldError> {
  const errors: Record<string, SvcRuleFieldError> = {};
  const sortableRows: Array<{ id: string; min_rub: number; max_rub: number | null }> = [];
  for (const rule of drafts) {
    const minRub = Number((rule.min_rub || "").trim());
    const maxRaw = (rule.max_rub || "").trim();
    const maxRub = maxRaw ? Number(maxRaw) : null;
    const value = Number((rule.value || "").trim());
    const rowError: SvcRuleFieldError = {
      min: !Number.isFinite(minRub) || minRub < 0,
      max: maxRub !== null && !Number.isFinite(maxRub),
      value: !Number.isFinite(value) || value < 0,
    };
    if (!rowError.min && !rowError.max && maxRub !== null && maxRub <= minRub) {
      rowError.max = true;
    }
    errors[rule.id] = rowError;
    if (Number.isFinite(minRub) && (maxRub === null || Number.isFinite(maxRub)) && minRub >= 0) {
      sortableRows.push({ id: rule.id, min_rub: minRub, max_rub: maxRub });
    }
  }
  sortableRows.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
  for (let i = 1; i < sortableRows.length; i += 1) {
    const prevMax = sortableRows[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
    if (sortableRows[i].min_rub < prevMax) {
      errors[sortableRows[i - 1].id].max = true;
      errors[sortableRows[i].id].min = true;
    }
  }
  return errors;
}

export function createNextSvcRuleDraft(drafts: SvcRuleDraft[]): SvcRuleDraft {
  const normalized = drafts.map(parseSvcRuleDraft).filter(Boolean) as SvcRulePayload[];
  normalized.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
  const last = normalized.length > 0 ? normalized[normalized.length - 1] : null;
  const nextMin = last ? Number(((last.max_rub ?? last.min_rub)).toFixed(2)) : 0;
  const nextMax = Number((nextMin + 10000).toFixed(2));
  return {
    id: buildSvcDraftId(),
    min_rub: formatCompactNumber(nextMin, 6),
    max_rub: formatCompactNumber(nextMax, 6),
    mode: "fixed_rub",
    value: "0",
  };
}
