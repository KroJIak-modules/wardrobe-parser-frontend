import { useEffect, useState } from "react";

type WeightRule = {
  id: number;
  weight_grams: number;
};

type UseAdminWeightRulesParams = {
  weightRules: WeightRule[];
  createWeightRule: (weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  updateWeightRule: (ruleId: number, weightGrams: number) => Promise<{ ok: boolean; message: string }>;
  deleteWeightRule: (ruleId: number) => Promise<{ ok: boolean; message: string }>;
  addWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  removeWeightKeyword: (ruleId: number, keyword: string) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminWeightRules(params: UseAdminWeightRulesParams) {
  const { weightRules, createWeightRule, updateWeightRule, deleteWeightRule, addWeightKeyword, removeWeightKeyword, pushToast } = params;

  const [newWeightRuleGrams, setNewWeightRuleGrams] = useState<string>("700");
  const [weightRuleDrafts, setWeightRuleDrafts] = useState<Record<number, string>>({});
  const [weightKeywordInputs, setWeightKeywordInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    setWeightRuleDrafts((previous) => {
      const next: Record<number, string> = {};
      for (const rule of weightRules) {
        next[rule.id] = previous[rule.id] ?? String(rule.weight_grams);
      }
      return next;
    });
  }, [weightRules]);

  useEffect(() => {
    const timers: number[] = [];
    for (const rule of weightRules) {
      const raw = weightRuleDrafts[rule.id];
      if (raw === undefined) {
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        continue;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        continue;
      }
      const rounded = Math.round(parsed);
      if (rounded === rule.weight_grams) {
        continue;
      }

      const timer = window.setTimeout(async () => {
        const result = await updateWeightRule(rule.id, rounded);
        if (!result.ok) {
          pushToast(result.message);
        }
      }, 700);
      timers.push(timer);
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [weightRuleDrafts, weightRules, updateWeightRule, pushToast]);

  const onCreateWeightRule = async () => {
    const parsed = Number(newWeightRuleGrams);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      pushToast("Вес должен быть положительным числом");
      return;
    }
    const result = await createWeightRule(Math.round(parsed));
    pushToast(result.message);
  };

  const onDeleteWeightRule = async (ruleId: number) => {
    const result = await deleteWeightRule(ruleId);
    pushToast(result.message);
  };

  const onAddWeightKeyword = async (ruleId: number) => {
    const raw = (weightKeywordInputs[ruleId] || "").trim();
    if (!raw) {
      return;
    }
    const result = await addWeightKeyword(ruleId, raw);
    if (result.ok) {
      setWeightKeywordInputs((previous) => ({ ...previous, [ruleId]: "" }));
    }
    pushToast(result.message);
  };

  const onRemoveWeightKeyword = async (ruleId: number, keyword: string) => {
    const result = await removeWeightKeyword(ruleId, keyword);
    pushToast(result.message);
  };

  return {
    newWeightRuleGrams,
    setNewWeightRuleGrams,
    weightRuleDrafts,
    setWeightRuleDrafts,
    weightKeywordInputs,
    setWeightKeywordInputs,
    onCreateWeightRule,
    onDeleteWeightRule,
    onAddWeightKeyword,
    onRemoveWeightKeyword,
  };
}
