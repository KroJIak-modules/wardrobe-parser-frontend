import { Component, type ErrorInfo, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LiveDataProvider } from "./shared/live-data-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";
import { DEFAULT_ADMIN_TAB } from "./admin/admin-constants";
import { ToastStack } from "./shared/toast-stack";
import { useToasts } from "./shared/use-toasts";
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  ADMIN_AUTH_EXPIRED_FLAG,
  API_BASE,
  checkAdminSessionSilently,
  clearAdminSessionHints,
} from "./shared/admin-auth";

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
              <p className="muted">Произошла ошибка интерфейса. Обнови страницу, чтобы продолжить работу.</p>
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
    if (location.pathname.startsWith(MANAGEMENT_PATH)) {
      document.title = "Панель управления | Anton Shell";
      return;
    }
    document.title = "Anton Shell";
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
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ok = await checkAdminSessionSilently();
      if (!alive) {
        return;
      }
      setSessionOk(ok);
      if (!ok) {
        const reason = String(searchParams.get("reason") || "");
        const expired = window.sessionStorage.getItem(ADMIN_AUTH_EXPIRED_FLAG) === "1";
        if (expired && reason === "expired") {
          pushToast("Ваша сессия истекла. Войдите снова.");
          window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
        } else {
          window.sessionStorage.removeItem(ADMIN_AUTH_EXPIRED_FLAG);
        }
      }
      setCheckingSession(false);
    })();
    return () => {
      alive = false;
    };
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
          // keep fallback text
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

  if (checkingSession) {
    return null;
  }

  if (sessionOk) {
    return <Navigate to={`${MANAGEMENT_PATH}/${DEFAULT_ADMIN_TAB}`} replace />;
  }

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
  return (
    <AdminErrorBoundary>
      <AdminPage />
    </AdminErrorBoundary>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthRoute = location.pathname === LOGIN_PATH;
  const [authChecking, setAuthChecking] = useState(true);
  const [authOk, setAuthOk] = useState(false);

  useEffect(() => {
    if (isAuthRoute) {
      setAuthChecking(false);
      return;
    }
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
  }, [isAuthRoute]);

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

  if (!authOk && !isAuthRoute) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  const appRoutes = (
    <Routes>
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductPage />} />
      </Route>
      <Route path={MANAGEMENT_PATH} element={<Navigate to={`${MANAGEMENT_PATH}/${DEFAULT_ADMIN_TAB}`} replace />} />
      <Route path={LOGIN_PATH} element={<AdminLoginRoute />} />
      <Route
        path={`${MANAGEMENT_PATH}/:tab`}
        element={<AdminProtectedRoute />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAuthRoute) {
    return (
      <>
        <RouteTitleSync />
        <RouteTransitionIndicator />
        {appRoutes}
      </>
    );
  }

  return (
    <LiveDataProvider routePath={location.pathname}>
      <RouteTitleSync />
      <RouteTransitionIndicator />
      {appRoutes}
    </LiveDataProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
