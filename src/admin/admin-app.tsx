import { Component, type ErrorInfo, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LiveDataProvider } from "../shared/live-data-context";
import { getAdminMeCached, type AdminMePayload } from "../shared/admin-auth";
import { ToastStack } from "../shared/toast-stack";
import { useToasts } from "../shared/use-toasts";
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  ADMIN_AUTH_EXPIRED_FLAG,
  API_BASE,
  checkAdminSessionSilently,
  clearAdminSessionHints,
} from "../shared/admin-auth";
import { DEFAULT_ADMIN_TAB } from "./admin-constants";
import { AdminShowcaseCatalogPage } from "./admin-showcase-catalog-page";
import { AdminShowcaseDesignersPage } from "./admin-showcase-designers-page";
import { AdminPage } from "./admin-page";
import { AdminShowcaseLayout } from "./admin-showcase-layout";
import { ShowcaseProductPage } from "./showcase-product-page";
import { AdminRouteScroll } from "./admin-route-scroll";
import { clearShowcaseCatalogCache } from "./showcase-catalog-cache";
import { hasAnyAdminPermission } from "../shared/admin-permissions";
import { tabs } from "./admin-constants";

const MANAGEMENT_PATH = "/control";
const LOGIN_PATH = "/login";

class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin route render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container container--admin">
          <section className="section admin">
            <div className="card">
              <h2>Не удалось загрузить панель управления</h2>
              <p className="muted">Произошла ошибка интерфейса. Обновите страницу, чтобы продолжить работу.</p>
            </div>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteTitleSync() {
  const location = useLocation();

  useEffect(() => {
    document.title = location.pathname === LOGIN_PATH ? "Вход | Anton Shell Admin" : "Anton Shell Admin";
  }, [location.pathname]);

  return null;
}

function RouteTransitionIndicator() {
  const location = useLocation();
  const mountedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return <div className={visible ? "route-progress route-progress--visible" : "route-progress"} aria-hidden="true" />;
}

function AdminLoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, pushToast, closeToast, pauseToast, resumeToast } = useToasts();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reason = String(searchParams.get("reason") || "");
    const expired = window.sessionStorage.getItem(ADMIN_AUTH_EXPIRED_FLAG) === "1";
    if (expired && reason === "expired") {
      pushToast("Ваша сессия истекла. Войдите снова.");
      window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
      return;
    }
    window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
  }, [pushToast, searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!response.ok) {
        let message = "Неверный логин или пароль";
        try {
          const payload = await response.json();
          if (payload && typeof payload.detail === "string" && payload.detail.trim()) {
            message = payload.detail.trim();
          }
        } catch {
          // Keep fallback text when the backend does not return JSON.
        }
        throw new Error(message);
      }
      clearAdminSessionHints();
      navigate(`${MANAGEMENT_PATH}/${DEFAULT_ADMIN_TAB}`, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка входа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="card admin-login-card" onSubmit={handleSubmit}>
        <h2>Вход в панель управления</h2>
        <label className="field">
          <span className="field__label">Логин</span>
          <input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required />
        </label>
        <label className="field">
          <span className="field__label">Пароль</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        {error ? (
          <div className="login-error-alert" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
        <button type="submit" disabled={submitting || !login.trim() || !password.trim()}>
          {submitting ? "Входим..." : "Войти"}
        </button>
      </form>
      <ToastStack toasts={toasts} onClose={closeToast} onPause={pauseToast} onResume={resumeToast} />
    </div>
  );
}

function AdminProtectedRoute() {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [adminMe, setAdminMe] = useState<AdminMePayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void getAdminMeCached().then((payload) => {
      if (active) {
        setAdminMe(payload);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const visibleTabs = tabs.filter((item) => {
    if (!loaded) return false;
    const allowed = (...permissions: string[]) => hasAnyAdminPermission(adminMe, ...permissions);
    switch (item.key) {
      case "products": return allowed("control.products.read");
      case "dedup": return allowed("control.dedup.read");
      case "showcase-structure": return allowed("control.categories.read");
      case "designers": return allowed("control.designers.read");
      case "sources": return allowed("control.sources.read");
      case "pricing": return allowed("control.pricing.read");
      case "payments": return allowed("control.payments.read", "control.settings.read");
      case "weight": return allowed("control.weight.read");
      case "content": return allowed("control.content.read", "showcase.read");
      case "security":
        return Boolean(adminMe?.is_superuser)
          || allowed("control.site_access.read", "control.settings.read")
          || allowed("control.settings_transfer.read", "control.settings.read");
      default: return false;
    }
  });

  useEffect(() => {
    if (loaded && visibleTabs.length > 0 && !visibleTabs.some((item) => item.key === tabParam)) {
      navigate(`/control/${visibleTabs[0].key}`, { replace: true });
    }
  }, [loaded, navigate, tabParam, visibleTabs]);

  if (!loaded || visibleTabs.length === 0 || !visibleTabs.some((item) => item.key === tabParam)) {
    return null;
  }

  return (
    <AdminErrorBoundary>
      <AdminPage />
    </AdminErrorBoundary>
  );
}

function AdminShowcaseRoute() {
  return (
    <AdminErrorBoundary>
      <AdminShowcaseLayout />
    </AdminErrorBoundary>
  );
}

function AdminRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginRoute = location.pathname === LOGIN_PATH;
  const [authChecking, setAuthChecking] = useState(true);
  const [authOk, setAuthOk] = useState(false);
  const defaultAdminPath = `${MANAGEMENT_PATH}/${DEFAULT_ADMIN_TAB}`;

  useEffect(() => {
    if (isLoginRoute) clearShowcaseCatalogCache();
    setAuthChecking(true);
    let alive = true;
    void (async () => {
      const ok = await checkAdminSessionSilently();
      if (!alive) {
        return;
      }
      setAuthOk(ok);
      setAuthChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [isLoginRoute]);

  useEffect(() => {
    const onExpired = () => {
      if (location.pathname !== LOGIN_PATH) {
        navigate(`${LOGIN_PATH}?reason=expired`, { replace: true });
      }
    };
    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, onExpired);
  }, [location.pathname, navigate]);

  if (authChecking) {
    return null;
  }

  if (!authOk && !isLoginRoute) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  if (authOk && isLoginRoute) {
    return <Navigate to={defaultAdminPath} replace />;
  }

  const routes = (
    <Routes>
      <Route path="/" element={<AdminShowcaseRoute />}>
        <Route index element={<Navigate to="/catalog" replace />} />
        <Route path="catalog" element={<AdminShowcaseCatalogPage key={location.key} viewKey="default" />} />
        <Route path="catalog/designers" element={<AdminShowcaseCatalogPage key={location.key} viewKey="designers" />} />
        <Route path="catalog/sale" element={<Navigate to="/sale" replace />} />
        <Route path="sale" element={<AdminShowcaseCatalogPage key={location.key} viewKey="sale" />} />
        <Route path="designers" element={<AdminShowcaseDesignersPage />} />
        <Route path="product/:id" element={<ShowcaseProductPage />} />
      </Route>
      <Route path={LOGIN_PATH} element={<AdminLoginRoute />} />
      <Route path={MANAGEMENT_PATH} element={<Navigate to={defaultAdminPath} replace />} />
      <Route path={`${MANAGEMENT_PATH}/:tab`} element={<AdminProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isLoginRoute) {
    return (
      <>
        <RouteTitleSync />
        <RouteTransitionIndicator />
        {routes}
      </>
    );
  }

  return (
    <LiveDataProvider routePath={location.pathname}>
      <RouteTitleSync />
      <RouteTransitionIndicator />
      {routes}
      <AdminRouteScroll />
    </LiveDataProvider>
  );
}

export function AdminApp() {
  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  );
}
