import { useMemo, useState } from "react";
import { Button, Card, Loader, Text, ThemeProvider } from "@gravity-ui/uikit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10510";

type Site = {
  id: number;
  key: string;
  name: string;
  base_url: string | null;
  is_active: boolean;
  last_status: string | null;
  last_status_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
};

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function App() {
  const [sites, setSites] = useState<ApiState<Site[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const statusLabel = useMemo(() => {
    if (sites.loading) {
      return { tone: "info", text: "Loading" } as const;
    }
    if (sites.error) {
      return { tone: "danger", text: "Error" } as const;
    }
    if (sites.data) {
      return { tone: "success", text: "Ready" } as const;
    }
    return { tone: "muted", text: "Idle" } as const;
  }, [sites]);

  const handleLoadSites = async () => {
    setSites({ data: null, loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/v1/sites/`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const payload = (await response.json()) as Site[];
      setSites({ data: payload, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSites({ data: null, loading: false, error: message });
    }
  };

  return (
    <ThemeProvider theme="light">
      <div className="app">
        <header className="hero">
          <div className="hero__glow" />
          <div className="hero__content">
            <Text variant="header-2" className="hero__title">
              Wardrobe Parser
            </Text>
            <Text variant="body-2" className="hero__subtitle">
              Minimal panel for parser status and site catalog snapshots.
            </Text>
            <div className="hero__meta">
              <span className={`status-pill status-pill--${statusLabel.tone}`}>
                {statusLabel.text}
              </span>
              <Text variant="body-1" color="secondary">
                API: {API_URL}
              </Text>
            </div>
            <Button size="l" view="action" onClick={handleLoadSites}>
              Load sites
            </Button>
          </div>
        </header>

        <main className="content">
          <Card className="panel">
            <div className="panel__header">
              <Text variant="subheader-2">Sites</Text>
              {sites.loading ? <Loader size="s" /> : null}
            </div>
            {sites.error ? (
              <Text variant="body-2" color="danger">
                {sites.error}
              </Text>
            ) : null}
            {sites.data ? (
              <div className="sites">
                {sites.data.length === 0 ? (
                  <Text variant="body-2">No sites yet.</Text>
                ) : (
                  sites.data.map((site) => (
                    <Card key={site.id} className="site-card">
                      <div className="site-card__header">
                        <Text variant="subheader-2">{site.name}</Text>
                        <span
                          className={`status-pill status-pill--${
                            site.is_active ? "success" : "warning"
                          }`}
                        >
                          {site.is_active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <Text variant="body-2" color="secondary">
                        Key: {site.key}
                      </Text>
                      <Text variant="body-2" color="secondary">
                        URL: {site.base_url || "-"}
                      </Text>
                      <Text variant="body-2" color="secondary">
                        Last status: {site.last_status || "-"}
                      </Text>
                      {site.last_error ? (
                        <Text variant="body-2" color="danger">
                          Error: {site.last_error}
                        </Text>
                      ) : null}
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Text variant="body-2" color="secondary">
                Click "Load sites" to fetch data from the backend.
              </Text>
            )}
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
}
