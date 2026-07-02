import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toExternalHttpUrl } from "../shared/external-links";
import { EmptyState } from "../shared/empty-state";
import { AdminWeightSkeleton } from "../shared/skeleton";
import { TagRemoveButton } from "../shared/tag-remove-button";
import type { WeightMissingProduct, WeightRecalcStatus, WeightRule } from "../shared/live-data-types";

type Props = {
  weightTabLoading: boolean;
  newWeightRuleGrams: string;
  setNewWeightRuleGrams: (value: string) => void;
  onCreateWeightRule: () => Promise<void>;
  weightRules: WeightRule[];
  weightRuleDrafts: Record<number, string>;
  setWeightRuleDrafts: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  onDeleteWeightRule: (ruleId: number) => Promise<void>;
  weightKeywordInputs: Record<number, string>;
  setWeightKeywordInputs: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  onRemoveWeightKeyword: (ruleId: number, keyword: string) => Promise<void>;
  onAddWeightKeyword: (ruleId: number) => Promise<void>;
  onStartWeightRecalculation: () => Promise<void>;
  weightRecalcStatus: WeightRecalcStatus;
  weightMissingProducts: WeightMissingProduct[];
  hasMoreWeightMissing: boolean;
  loadingMoreWeightMissing: boolean;
  onLoadMoreWeightMissing: () => Promise<void>;
};

export function AdminWeightTab({
  weightTabLoading,
  newWeightRuleGrams,
  setNewWeightRuleGrams,
  onCreateWeightRule,
  weightRules,
  weightRuleDrafts,
  setWeightRuleDrafts,
  onDeleteWeightRule,
  weightKeywordInputs,
  setWeightKeywordInputs,
  onRemoveWeightKeyword,
  onAddWeightKeyword,
  onStartWeightRecalculation,
  weightRecalcStatus,
  weightMissingProducts,
  hasMoreWeightMissing,
  loadingMoreWeightMissing,
  onLoadMoreWeightMissing,
}: Props) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMoreWeightMissing) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first?.isIntersecting || loadingMoreWeightMissing) return;
      void onLoadMoreWeightMissing();
    }, { root: null, rootMargin: "320px 0px 320px 0px", threshold: 0.01 });
    io.observe(node);
    return () => io.disconnect();
  }, [hasMoreWeightMissing, loadingMoreWeightMissing, onLoadMoreWeightMissing]);

  useEffect(() => {
    if (!hasMoreWeightMissing) return;
    const onScroll = () => {
      if (loadingMoreWeightMissing) return;
      const scrolled = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 520;
      if (scrolled >= threshold) {
        void onLoadMoreWeightMissing();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMoreWeightMissing, loadingMoreWeightMissing, onLoadMoreWeightMissing]);

  return (
    <div className="card">
      {weightTabLoading ? (
        <AdminWeightSkeleton />
      ) : (
        <div className="weight-layout">
          <section>
            <h2>Настройки веса</h2>
            <div className="weight-rule-create-row">
              <input
                type="number"
                min={1}
                value={newWeightRuleGrams}
                onChange={(event) => setNewWeightRuleGrams(event.target.value)}
                placeholder="Вес, г"
              />
              <button type="button" onClick={() => void onCreateWeightRule()}>
                Добавить правило
              </button>
              <button
                type="button"
                disabled={weightRecalcStatus.is_running}
                onClick={() => void onStartWeightRecalculation()}
              >
                {weightRecalcStatus.is_running ? "Пересчет..." : "Пересчитать товары"}
              </button>
            </div>

            <div className="weight-rules-list">
              {weightRules.map((rule) => (
                <div key={rule.id} className="weight-rule-row">
                  <div className="weight-rule-left">
                    <label className="muted">Вес (г)</label>
                    <input
                      type="number"
                      min={1}
                      value={weightRuleDrafts[rule.id] ?? String(rule.weight_grams)}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setWeightRuleDrafts((prev) => ({ ...prev, [rule.id]: nextValue }));
                      }}
                    />
                    <div className="weight-rule-actions">
                      <button type="button" onClick={() => void onDeleteWeightRule(rule.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="weight-rule-right">
                    <div className="chip-list">
                      {rule.keywords.map((keyword) => (
                        <span key={`${rule.id}-${keyword}`} className="tag tag--with-action">
                          <span>{keyword}</span>
                          <TagRemoveButton onClick={() => void onRemoveWeightKeyword(rule.id, keyword)} />
                        </span>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={weightKeywordInputs[rule.id] || ""}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setWeightKeywordInputs((prev) => ({ ...prev, [rule.id]: nextValue }));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void onAddWeightKeyword(rule.id);
                        }
                      }}
                      placeholder="Введите keyword на английском и нажмите Enter"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2>Товары без определенного веса</h2>
            {weightMissingProducts.length === 0 ? (
              <EmptyState compact title="Все товары имеют вес (из источника или по ключевым словам)." />
            ) : (
              <div className="table-wrap table-wrap--spaced">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Сайт</th>
                      <th>Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightMissingProducts.map((item) => {
                      const sourceHref = toExternalHttpUrl(item.url);
                      return (
                        <tr key={item.id}>
                          <td>
                            <Link className="btn-link" to={`/product/${item.id}?from=admin`}>
                              {item.title}
                            </Link>
                          </td>
                          <td>{item.source_name}</td>
                          <td>
                            {sourceHref ? (
                              <a className="btn-link" href={sourceHref} target="_blank" rel="noreferrer">
                                Открыть товар
                              </a>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {hasMoreWeightMissing ? (
                  <div ref={loadMoreRef} className="weight-missing-loadmore muted">
                    {loadingMoreWeightMissing ? "Загрузка..." : ""}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
