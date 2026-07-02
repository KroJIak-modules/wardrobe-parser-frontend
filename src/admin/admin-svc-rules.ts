import { formatCompactNumber, parseNonNegativeNumber } from "./admin-formatters";
import type { SvcRuleDraft, SvcRuleFieldError, SvcRulePayload } from "./admin-types";

function buildSvcDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `svc-${crypto.randomUUID()}`;
  }
  return `svc-${Date.now()}`;
}

export function parseSvcRuleDraft(rule: SvcRuleDraft): SvcRulePayload | null {
  const minRub = parseNonNegativeNumber(rule.min_rub || "");
  const maxRaw = (rule.max_rub || "").trim();
  const maxRub = maxRaw ? parseNonNegativeNumber(maxRaw) : null;
  const value = parseNonNegativeNumber(rule.value || "");
  if (minRub === null) {
    return null;
  }
  if (maxRub !== null && maxRub <= minRub) {
    return null;
  }
  if (value === null) {
    return null;
  }
  return {
    min_rub: Number(minRub.toFixed(6)),
    max_rub: maxRub === null ? null : Number(maxRub.toFixed(6)),
    mode: rule.mode === "percent" ? "percent" : "fixed_rub",
    value: Number(value.toFixed(6)),
  };
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
      return {
        id: `svc-${index}-${minRub}-${maxRub ?? "inf"}`,
        min_rub: formatCompactNumber(minRub, 6),
        max_rub: maxRub === null ? "" : formatCompactNumber(maxRub, 6),
        mode: String(raw.mode || "fixed_rub").toLowerCase() === "percent" ? "percent" : "fixed_rub",
        value: formatCompactNumber(value, 6),
      } satisfies SvcRuleDraft;
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
    const previousMax = parsed[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
    if (parsed[i].min_rub < previousMax) {
      return "SVC: диапазоны пересекаются";
    }
  }
  return null;
}

export function getSvcRuleFieldErrors(drafts: SvcRuleDraft[]): Record<string, SvcRuleFieldError> {
  const errors: Record<string, SvcRuleFieldError> = {};
  const sortableRows: Array<{ id: string; min_rub: number; max_rub: number | null }> = [];
  for (const rule of drafts) {
    const minRub = parseNonNegativeNumber(rule.min_rub || "");
    const maxRaw = (rule.max_rub || "").trim();
    const maxRub = maxRaw ? parseNonNegativeNumber(maxRaw) : null;
    const value = parseNonNegativeNumber(rule.value || "");
    const rowError: SvcRuleFieldError = {
      min: minRub === null,
      max: maxRub !== null && (minRub === null || maxRub <= minRub),
      value: value === null,
    };
    errors[rule.id] = rowError;
    if (minRub !== null && (maxRub === null || Number.isFinite(maxRub))) {
      sortableRows.push({ id: rule.id, min_rub: minRub, max_rub: maxRub });
    }
  }
  sortableRows.sort((a, b) => (a.min_rub - b.min_rub) || ((a.max_rub ?? Number.POSITIVE_INFINITY) - (b.max_rub ?? Number.POSITIVE_INFINITY)));
  for (let i = 1; i < sortableRows.length; i += 1) {
    const previousMax = sortableRows[i - 1].max_rub ?? Number.POSITIVE_INFINITY;
    if (sortableRows[i].min_rub < previousMax) {
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
  const nextMin = last ? Number((last.max_rub ?? last.min_rub).toFixed(2)) : 0;
  const nextMax = Number((nextMin + 10000).toFixed(2));
  return {
    id: buildSvcDraftId(),
    min_rub: formatCompactNumber(nextMin, 6),
    max_rub: formatCompactNumber(nextMax, 6),
    mode: "fixed_rub",
    value: "0",
  };
}
