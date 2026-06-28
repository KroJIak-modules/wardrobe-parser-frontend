import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logoutAdminSession } from "../shared/admin-auth";
import { SiteHeader } from "../shared/site-header";
import { AdminShowcaseNav } from "./admin-showcase-nav";

export function AdminShowcaseLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isProductDetailPage = location.pathname.startsWith("/product/");
  const isAdminOriginProduct = isProductDetailPage && searchParams.get("from") === "admin";

  const ctaTo = isAdminOriginProduct ? "/" : "/control/products";
  const ctaLabel = isAdminOriginProduct ? "Витрина" : "Панель управления";
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
      {isProductDetailPage ? null : <SiteHeader actions={actions} />}
      <main className={isProductDetailPage ? "container container--product-detail" : "container"}>
        {isProductDetailPage ? null : <AdminShowcaseNav />}
        <Outlet />
      </main>
    </div>
  );
}
