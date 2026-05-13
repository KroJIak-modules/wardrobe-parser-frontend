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
  show_description?: boolean;
  show_images?: boolean;
  currency_priority?: string[];
};

type Props = {
  sources: SourceItem[];
  loading: boolean;
  toggleSourceEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceSyncEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceAutoHideProducts: (key: string, enabled: boolean) => Promise<{ message: string }>;
  updateSourceAttributeVisibility: (key: string, payload: { show_description?: boolean; show_images?: boolean }) => Promise<{ message: string }>;
  updateSourceCurrencyPriority: (key: string, currencyPriority: string[]) => Promise<{ message: string }>;
  autoSyncPeriodMinutes: number;
  updateAdminUiSettings: (payload: { auto_sync_period_minutes?: number }) => Promise<{ ok: boolean; message: string }>;
  latestJob: {
    job_id?: string;
    status?: string;
    current_source_name?: string | null;
    can_cancel?: boolean;
  } | null;
  runSyncForSource: (sourceKey: string) => Promise<{ ok: boolean; message: string }>;
  cancelSync: (jobId: string) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function AdminSourcesTab({
  sources,
  loading,
  toggleSourceEnabled,
  toggleSourceSyncEnabled,
  toggleSourceAutoHideProducts,
  updateSourceAttributeVisibility,
  updateSourceCurrencyPriority,
  autoSyncPeriodMinutes,
  updateAdminUiSettings,
  latestJob,
  runSyncForSource,
  cancelSync,
  pushToast,
}: Props) {
  const currencyOptions = ["USD", "EUR", "GBP", "JPY"] as const;
  const [sourceAttrVisibility, setSourceAttrVisibility] = useState<Record<string, { description: boolean; images: boolean }>>({});
  const [sourceCurrencyPriority, setSourceCurrencyPriority] = useState<Record<string, string[]>>({});
  const [currencyInputBySource, setCurrencyInputBySource] = useState<Record<string, string>>({});
  const [currencyOpenBySource, setCurrencyOpenBySource] = useState<Record<string, boolean>>({});
  const [dragCurrencyBySource, setDragCurrencyBySource] = useState<Record<string, string | null>>({});
  const [autoSyncDraft, setAutoSyncDraft] = useState<string>(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));

  useEffect(() => {
    setAutoSyncDraft(String(Math.max(60, Number(autoSyncPeriodMinutes || 60))));
  }, [autoSyncPeriodMinutes]);

  useEffect(() => {
    setSourceAttrVisibility((prev) => {
      const next = { ...prev };
      for (const source of sources) {
        if (!next[source.key]) {
          next[source.key] = {
            description: source.show_description ?? true,
            images: source.show_images ?? true,
          };
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
          next[source.key] = Array.isArray(source.currency_priority) && source.currency_priority.length > 0
            ? source.currency_priority.map((x) => String(x).toUpperCase())
            : ["USD", "EUR", "GBP"];
        }
      }
      return next;
    });
  }, [sources]);

  const isAnySyncRunning = Boolean(latestJob && ["pending", "in_progress"].includes(String(latestJob.status || "")));
  const activeSourceKey = String(latestJob?.current_source_name || "").trim().toLowerCase();

  return (
    <div className="card">
      <div className="admin-sources-sync-period">
        <h3>Автоматическая синхронизация</h3>
        <label className="admin-settings-field">
          <span className="muted">Период автосинхронизации (минуты, минимум 60)</span>
          <div className="admin-settings-inline-row">
            <input
              type="number"
              min={60}
              step={1}
              className="input"
              value={autoSyncDraft}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === "") {
                  setAutoSyncDraft("60");
                  return;
                }
                const parsed = Math.trunc(Number(raw));
                if (!Number.isFinite(parsed)) {
                  return;
                }
                setAutoSyncDraft(String(Math.max(60, parsed)));
              }}
              onBlur={() => {
                const parsed = Math.trunc(Number(autoSyncDraft || "60"));
                setAutoSyncDraft(String(Number.isFinite(parsed) ? Math.max(60, parsed) : 60));
              }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                void (async () => {
                  const raw = Math.trunc(Number(autoSyncDraft || "0"));
                  const next = Number.isFinite(raw) ? Math.max(60, raw) : 60;
                  setAutoSyncDraft(String(next));
                  const result = await updateAdminUiSettings({ auto_sync_period_minutes: next });
                  pushToast(result.message);
                })();
              }}
            >
              Сохранить
            </button>
          </div>
        </label>
      </div>
      <h2>Источники ({sources.length})</h2>
      {loading ? (
        <AdminSourcesSkeleton rows={5} />
      ) : (
        <div className="sources-grid">
          {sources.map((source) => {
            const href = /^https?:\/\//i.test(source.base_url) ? source.base_url : `https://${source.base_url}`;
            const label = source.base_url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
            const thisSourceActive = isAnySyncRunning && activeSourceKey === source.key.trim().toLowerCase();
            const thisSourceDisabled = isAnySyncRunning && !thisSourceActive;
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
                  <div className="source-card-actions">
                    {thisSourceActive ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={!latestJob?.job_id || !latestJob?.can_cancel}
                        onClick={() => {
                          if (!latestJob?.job_id) return;
                          void (async () => {
                            const result = await cancelSync(latestJob.job_id as string);
                            pushToast(result.message);
                          })();
                        }}
                      >
                        Отменить синхронизацию
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={thisSourceDisabled}
                        onClick={() => {
                          void (async () => {
                            const result = await runSyncForSource(source.key);
                            pushToast(result.message);
                          })();
                        }}
                      >
                        Синхронизовать
                      </button>
                    )}
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
                              void (async () => {
                                const result = await updateSourceAttributeVisibility(source.key, { show_description: checked });
                                pushToast(result.message);
                              })();
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
                              void (async () => {
                                const result = await updateSourceAttributeVisibility(source.key, { show_images: checked });
                                pushToast(result.message);
                              })();
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
                              draggable
                              onDragStart={() => {
                                setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: currency }));
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                const dragging = dragCurrencyBySource[source.key];
                                if (!dragging || dragging === currency) {
                                  return;
                                }
                                setSourceCurrencyPriority((prev) => {
                                  const list = [...(prev[source.key] || [])];
                                  const from = list.indexOf(dragging);
                                  const to = list.indexOf(currency);
                                  if (from < 0 || to < 0 || from === to) {
                                    return prev;
                                  }
                                  const [moved] = list.splice(from, 1);
                                  list.splice(to, 0, moved);
                                  void (async () => {
                                    const result = await updateSourceCurrencyPriority(source.key, list);
                                    pushToast(result.message);
                                  })();
                                  return { ...prev, [source.key]: list };
                                });
                                setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: null }));
                              }}
                              onDragEnd={() => {
                                setDragCurrencyBySource((prev) => ({ ...prev, [source.key]: null }));
                              }}
                              onClick={(event) => {
                                setSourceCurrencyPriority((prev) => {
                                  const next = (prev[source.key] || []).filter((item) => item !== currency);
                                  void (async () => {
                                    const result = await updateSourceCurrencyPriority(source.key, next);
                                    pushToast(result.message);
                                  })();
                                  return { ...prev, [source.key]: next };
                                });
                              }}
                            >
                              <span>{currency}</span>
                              <IconClose className="icon-svg icon-svg--sm" />
                            </button>
                          ))}
                        </div>
                        <div className="source-currency-priority__input-wrap">
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
                                const next = [...list, value];
                                void (async () => {
                                  const result = await updateSourceCurrencyPriority(source.key, next);
                                  pushToast(result.message);
                                })();
                                return { ...prev, [source.key]: next };
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
                                    setSourceCurrencyPriority((prev) => {
                                      const next = [...(prev[source.key] || []), item];
                                      void (async () => {
                                        const result = await updateSourceCurrencyPriority(source.key, next);
                                        pushToast(result.message);
                                      })();
                                      return { ...prev, [source.key]: next };
                                    });
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
