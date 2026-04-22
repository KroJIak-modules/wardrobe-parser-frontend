import { AdminSourcesSkeleton } from "../shared/skeleton";

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
  formatDateTime: (value: string | null | undefined) => string;
  toggleSourceEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceSyncEnabled: (key: string, enabled: boolean) => Promise<{ message: string }>;
  toggleSourceAutoHideProducts: (key: string, enabled: boolean) => Promise<{ message: string }>;
  pushToast: (message: string) => void;
};

export function AdminSourcesTab({
  sources,
  loading,
  formatDateTime,
  toggleSourceEnabled,
  toggleSourceSyncEnabled,
  toggleSourceAutoHideProducts,
  pushToast,
}: Props) {
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
                    <span className="source-pill">Время: {source.last_sync_duration_sec ?? 0}с</span>
                    <span className="source-pill">Последняя: {source.last_sync_at ? formatDateTime(source.last_sync_at) : "—"}</span>
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
                      <span className="ui-switch-text">{source.enabled ? "Тип включен" : "Тип выключен"}</span>
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
                      <span className="ui-switch-text">{source.sync_enabled ? "Участвует в sync" : "Исключен из sync"}</span>
                    </label>
                    <label className="ui-switch ui-switch--compact source-card-switch">
                      <input
                        type="checkbox"
                        checked={Boolean(source.hide_auto_added_products)}
                        onChange={(event) => {
                          void (async () => {
                            const result = await toggleSourceAutoHideProducts(source.key, event.target.checked);
                            pushToast(result.message);
                          })();
                        }}
                      />
                      <span className="ui-switch-track">
                        <span className="ui-switch-thumb" />
                      </span>
                      <span className="ui-switch-text">
                        {Boolean(source.hide_auto_added_products) ? "Скрывать автотовары" : "Показывать автотовары"}
                      </span>
                    </label>
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
