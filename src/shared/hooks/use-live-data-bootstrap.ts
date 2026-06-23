import { useEffect, useRef } from "react";

type RouteKind = "admin" | "site";

type Params = {
  routePath?: string;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  refreshAdminCoreOnly: () => Promise<void>;
  refreshSourcesOnly: () => Promise<void>;
};

export function useLiveDataBootstrap({
  routePath,
  setError,
  setLoading,
  refreshAdminCoreOnly,
  refreshSourcesOnly,
}: Params) {
  const lastRouteKindRef = useRef<RouteKind | null>(null);

  useEffect(() => {
    let aborted = false;
    const currentPath = routePath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const isManagementRoute = currentPath.startsWith("/control");
    const isProductRoute = /^\/product\/\d+/.test(currentPath);
    const routeKind: RouteKind = isManagementRoute ? "admin" : "site";
    const shouldBootstrap = lastRouteKindRef.current !== routeKind;
    if (!shouldBootstrap) {
      return undefined;
    }
    lastRouteKindRef.current = routeKind;

    const run = async () => {
      setError(null);
      try {
        if (routeKind === "admin") {
          setLoading(true);
          await refreshAdminCoreOnly();
          if (!aborted) {
            setLoading(false);
          }
          return;
        }
        if (isProductRoute) {
          // Product page loads a single product by id and does not need global sources bootstrap.
          setLoading(false);
          return;
        }
        setLoading(true);
        await refreshSourcesOnly();
        if (!aborted) {
          setLoading(false);
        }
      } catch (e) {
        if (!aborted) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setLoading(false);
        }
      }
    };
    void run();

    return () => {
      aborted = true;
    };
  }, [refreshAdminCoreOnly, refreshSourcesOnly, routePath, setError, setLoading]);
}
