import { useEffect, useMemo, useRef, useState } from "react";
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

type Product = {
  id: number;
  name: string;
  category: string | null;
  price: number | null;
  currency: string | null;
  product_url: string;
  image_url: string | null;
  description: string | null;
};

type ProductCard = Product & { isNew: boolean };

type ProductsBySite = Record<string, ProductCard[]>;

const REFRESH_MS = 10000;

export function App() {
  const [sites, setSites] = useState<ApiState<Site[]>>({
    data: null,
    loading: false,
    error: null,
  });
  const [products, setProducts] = useState<ApiState<ProductsBySite>>({
    data: null,
    loading: false,
    error: null,
  });
  const seenIdsRef = useRef<Record<string, Set<number>>>({});

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

  const loadSites = async (): Promise<Site[]> => {
    const response = await fetch(`${API_URL}/api/v1/sites/`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return (await response.json()) as Site[];
  };

  const loadProducts = async (siteKey: string): Promise<Product[]> => {
    const response = await fetch(
      `${API_URL}/api/v1/products?site_key=${encodeURIComponent(siteKey)}&limit=100`
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const payload = (await response.json()) as { items: Product[] };
    return payload.items ?? [];
  };

  const refreshData = async () => {
    setSites((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const siteList = await loadSites();
      setSites({ data: siteList, loading: false, error: null });

      setProducts((prev) => ({ ...prev, loading: true, error: null }));
      const results = await Promise.all(
        siteList.map(async (site) => ({
          key: site.key,
          items: await loadProducts(site.key),
        }))
      );

      const nextProducts: ProductsBySite = {};
      results.forEach(({ key, items }) => {
        if (!seenIdsRef.current[key]) {
          seenIdsRef.current[key] = new Set();
        }
        const seen = seenIdsRef.current[key];
        nextProducts[key] = items.map((item) => {
          const isNew = !seen.has(item.id);
          seen.add(item.id);
          return { ...item, isNew };
        });
      });

      setProducts({ data: nextProducts, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSites((prev) => ({ ...prev, loading: false, error: message }));
      setProducts((prev) => ({ ...prev, loading: false, error: message }));
    }
  };

  useEffect(() => {
    refreshData();
    const interval = window.setInterval(refreshData, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);

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
            <Text variant="body-2" color="secondary">
              Auto-refresh every {Math.round(REFRESH_MS / 1000)}s.
            </Text>
          </div>
        </header>

        <main className="content">
          <Card className="panel">
            <div className="panel__header">
              <Text variant="subheader-2">Sites</Text>
              {sites.loading || products.loading ? <Loader size="s" /> : null}
            </div>
            {sites.error || products.error ? (
              <Text variant="body-2" color="danger">
                {sites.error || products.error}
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
                      <div className="site-products">
                        {(products.data?.[site.key] ?? []).length === 0 ? (
                          <Text variant="body-2" color="secondary">
                            No products yet.
                          </Text>
                        ) : (
                          <div className="product-grid">
                            {(products.data?.[site.key] ?? []).map((product) => (
                              <div key={product.id} className="product-card">
                                <div className="product-card__header">
                                  <Text variant="subheader-1">{product.name}</Text>
                                  {product.isNew ? (
                                    <span className="status-pill status-pill--info">
                                      New
                                    </span>
                                  ) : null}
                                </div>
                                <Text variant="body-2" color="secondary">
                                  {product.category || "Uncategorized"}
                                </Text>
                                <Text variant="body-2" color="secondary">
                                  {product.price !== null
                                    ? `${product.price} ${product.currency ?? ""}`
                                    : "Price not set"}
                                </Text>
                                {product.image_url ? (
                                  <img
                                    className="product-card__image"
                                    src={product.image_url}
                                    alt={product.name}
                                  />
                                ) : null}
                                <a className="product-card__link" href={product.product_url}>
                                  Open product
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                Waiting for backend data...
              </Text>
            )}
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
}
