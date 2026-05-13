import { useEffect, useState } from "react";
import { AdminSourcesSkeleton } from "../shared/skeleton";
import { IconClose } from "../shared/mono-icons";

type SourceItem = {
  key: string;
  name: string;
  base_url: string;
  status_label: string | null;
  products_count: number;
  last_sync_duration_sec?: number | null;
  last_sync_at?: string | null;
  enabled: boolean;
  sync_enabled: boolean;
  hide_auto_added_products?: boolean;
};

type Props = {
  sources: SourceItem[];
  loading: boolean;
  toggleSourceEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceSyncEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceAutoHideProducts: (key: string, enabled: boolean) => Promise<{ message: string }>;
  pushToast: (message: string) => void;
};

export function AdminSourcesTab({
  sources,
  loading,
  toggleSourceEnabled,
  toggleSourceSyncEnabled,
  toggleSourceAutoHideProducts,
  pushToast,
}: Props) {
  const currencyOptions = ["USD", "EUR", "GBP", "JPY"] as const;
  const [sourceAttrVisibility, setSourceAttrVisibility] = useState<Record<string, { description: boolean; images: boolean }>>({});
  const [sourceCurrencyPriority, setSourceCurrencyPriority] = useState<Record<string, string[]>>({});
  const [currencyInputBySource, setCurrencyInputBySource] = useState<Record<string, string>>({});
  const [currencyOpenBySource, setCurrencyOpenBySource] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSourceAttrVisibility((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.key]) {
          next[source.key] = { description: true, images: true };
        }
      }
      return next;
    });
  }, [sources]);

  useEffect(() => {
    setSourceCurrencyPriority((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.key]) {
          next[source.key] = ["USD", "EUR", "GBP"];
        }
      }
      return next;
    });
  }, [sources]);

  return (
    <div className="card">
      <h2>Источники ({sources.length})</h2>
      {loading ? (
        <AdminSourcesSkeleton rows={5} />
      ) : (
        <div className="sources-grid">
          {sources.map((source) => {
            const href = /^https?:\/\//i.test(source.base_url) ? source.base_url : `https://${source.base_url}`;
            const label = source.base_url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
            return (
              <article key={source.key} className="list-row source-card">
                <div className="source-card-head">
                  <strong className="source-card-title">
                    {source.name}
                    {source.status_label ? ` · ${source.status_label}` : ""}
                  </strong>
                  <a className="source-card-link" href={href} target="_blank" rel="noreferrer">
                    {label}
                  </a>
                </div>
                <div className="source-card-foot">
                  <div className="source-card-meta">
                    <span className="source-pill">Товаров: {source.products_count}</span>
                    <span className="source-pill">Прогон: {source.last_sync_duration_sec ?? 0}с</span>
                  </div>
                  <div className="source-card-switches">
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Источник включен</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={source.sync_enabled}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceSyncEnabled(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Участие в синхронизацию</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={!Boolean(source.hide_auto_added_products)}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceAutoHideProducts(source.key, !event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">Показывать товары</span>
                    </label>
                    <details className="source-attrs">
                      <summary className="source-attrs__summary">Правила атрибутов</summary>
                      <div className="source-attrs__body">
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={sourceAttrVisibility[source.key]?.description ?? true}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setSourceAttrVisibility((prev) => ({
                                ...prev,
                                [source.key]: {
                                  description: checked,
                                  images: prev[source.key]?.images ?? true,
                                },
                              }));
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать описание</span>
                        </label>
                        <label className="ui-switch ui-switch--compact source-card-switch">
                          <input
                            type="checkbox"
                            checked={sourceAttrVisibility[source.key]?.images ?? true}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setSourceAttrVisibility((prev) => ({
                                ...prev,
                                [source.key]: {
                                  description: prev[source.key]?.description ?? true,
                                  images: checked,
                                },
                              }));
                            }}
                          />
                          <span className="ui-switch-track">
                            <span className="ui-switch-thumb" />
                          </span>
                          <span className="ui-switch-text">Показывать фотографии</span>
                        </label>
                      </div>
                    </details>
                    <div className="source-currency-priority" tabIndex={0} onBlur={() => setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: false }))}>
                      <label className="source-currency-priority__label">Приоритет валют</label>
                      <div className="source-currency-priority__field">
                        <div className="source-currency-priority__chips">
                          {(sourceCurrencyPriority[source.key] || []).map((currency) => (
                            <button
                              key={`${source.key}-${currency}`}
                              type="button"
                              className="source-currency-chip"
                              title="Клик: удалить"
                              onClick={(event) => {
                                setSourceCurrencyPriority((prev) => ({
                                  ...prev,
                                  [source.key]: (prev[source.key] || []).filter((item) => item !== currency),
                                }));
                              }}
                            >
                              <span>{currency}</span>
                              <IconClose className="icon-svg icon-svg--sm" />
                            </button>
                          ))}
                          <input
                            className="source-currency-priority__input"
                            value={currencyInputBySource[source.key] || ""}
                            placeholder="Добавить валюту"
                            onFocus={() => setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: true }))}
                            onChange={(event) => {
                              setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: event.target.value.toUpperCase() }));
                              setCurrencyOpenBySource((prev) => ({ ...prev, [source.key]: true }));
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") {
                                return;
                              }
                              event.preventDefault();
                              const value = String(currencyInputBySource[source.key] || "").trim().toUpperCase();
                              if (!currencyOptions.includes(value as (typeof currencyOptions)[number])) {
                                return;
                              }
                              setSourceCurrencyPriority((prev) => {
                                const list = prev[source.key] || [];
                                if (list.includes(value)) {
                                  return prev;
                                }
                                return { ...prev, [source.key]: [...list, value] };
                              });
                              setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: "" }));
                            }}
                          />
                        </div>
                        {currencyOpenBySource[source.key] ? (
                          <div className="source-currency-priority__menu">
                            {currencyOptions
                              .filter((item) => !(sourceCurrencyPriority[source.key] || []).includes(item))
                              .filter((item) => item.includes(String(currencyInputBySource[source.key] || "").trim().toUpperCase()))
                              .map((item) => (
                                <button
                                  key={`${source.key}-opt-${item}`}
                                  type="button"
                                  className="source-currency-priority__option"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setSourceCurrencyPriority((prev) => ({ ...prev, [source.key]: [...(prev[source.key] || []), item] }));
                                    setCurrencyInputBySource((prev) => ({ ...prev, [source.key]: "" }));
                                  }}
                                >
                                  {item}
                                </button>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
