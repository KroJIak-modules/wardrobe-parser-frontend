export type ProductStatusBadge = {
  label: string;
  cls: string;
};

export function getAdminProductStatusBadge(status: string): ProductStatusBadge {
  if (status === "available") {
    return { label: "В наличии", cls: "status-pill status-pill--ok" };
  }
  if (status === "out_of_stock") {
    return { label: "Нет в наличии", cls: "status-pill status-pill--warn" };
  }
  if (status === "unavailable") {
    return { label: "Недоступен", cls: "status-pill status-pill--bad" };
  }
  return { label: "Скрыт", cls: "status-pill status-pill--muted" };
}
