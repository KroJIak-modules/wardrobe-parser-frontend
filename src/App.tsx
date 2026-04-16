import { Component, type ErrorInfo, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiveDataProvider } from "./shared/live-data-context";
import { SiteLayout } from "./site/layout";
import { HomePage } from "./site/home-page";
import { CategoryPage } from "./site/category-page";
import { ProductPage } from "./site/product-page";
import { AdminPage } from "./admin/admin-page";

const MANAGEMENT_PATH = "/control";
const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

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
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccessToken = Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (!response.ok) {
        throw new Error("Неверный логин или пароль");
      }
      const payload = (await response.json()) as { access_token: string; refresh_token: string };
      window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token || "");
      window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token || "");
      window.location.replace(`${MANAGEMENT_PATH}/products`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка входа");
    } finally {
      setSubmitting(false);
    }
  };

  if (hasAccessToken) {
    return <Navigate to={`${MANAGEMENT_PATH}/products`} replace />;
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
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={submitting || !login.trim() || !password.trim()}>
          {submitting ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

function AdminProtectedRoute() {
  const hasAccessToken = Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
  if (!hasAccessToken) {
    return <Navigate to={`${MANAGEMENT_PATH}/login`} replace />;
  }
  return (
    <AdminErrorBoundary>
      <AdminPage />
    </AdminErrorBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <LiveDataProvider routePath={location.pathname}>
      <RouteTitleSync />
      <RouteTransitionIndicator />
      <Routes>
        <Route path="/" element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="product/:id" element={<ProductPage />} />
        </Route>
        <Route path={MANAGEMENT_PATH} element={<Navigate to={`${MANAGEMENT_PATH}/products`} replace />} />
        <Route path={`${MANAGEMENT_PATH}/login`} element={<AdminLoginRoute />} />
        <Route
          path={`${MANAGEMENT_PATH}/:tab`}
          element={<AdminProtectedRoute />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
