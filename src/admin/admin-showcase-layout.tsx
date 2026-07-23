import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logoutAdminSession } from "../shared/admin-auth";
import { SiteHeader } from "../shared/site-header";
import { AdminShowcaseNav } from "./admin-showcase-nav";
import { AdminShowcaseSearch } from "./admin-showcase-search";
import "./admin-showcase-search.css";

export type ShowcaseProductNavigationState = {
  openEditMode?: boolean;
  adminReturnHref?: string;
  /** True when opened from control panel product list / admin tools. */
  fromControlPanel?: boolean;
};

function isShowcaseProductPath(pathname: string) {
  return pathname.startsWith("/product/");
}

function isFromControlPanelNavigation(state: ShowcaseProductNavigationState | null) {
  if (!state) {
    return false;
  }
  if (state.fromControlPanel) {
    return true;
  }
  // Legacy links used query ?from=admin from control panel.
  return Boolean(state.adminReturnHref);
}

export function AdminShowcaseLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProductDetailPage = isShowcaseProductPath(location.pathname);
  const productNavState = (location.state as ShowcaseProductNavigationState | null) ?? null;
  const fromControlPanel = isProductDetailPage && isFromControlPanelNavigation(productNavState);

  // Control panel → product: top CTA stays "Витрина".
  // Showcase → product: top CTA stays "Панель управления".
  const ctaTo = fromControlPanel ? "/" : "/control/products";
  const ctaLabel = fromControlPanel ? "Витрина" : "Панель управления";
  const actions = [
    { label: ctaLabel, to: ctaTo, variant: "primary" as const },
    {
      ariaLabel: "Выйти",
      icon: <LogOut size={16} />,
      variant: "default" as const,
      onClick: () => {
        void (async () => {
          await logoutAdminSession();
          navigate("/login", { replace: true });
        })();
      },
    },
  ];

  return (
    <div className="shell">
      <SiteHeader actions={actions} belowActions={isProductDetailPage ? undefined : <AdminShowcaseSearch />} />
      <main className={isProductDetailPage ? "container container--product-detail" : "container"}>
        {isProductDetailPage ? null : (
          <div className="showcase-nav-row">
            <AdminShowcaseNav />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
