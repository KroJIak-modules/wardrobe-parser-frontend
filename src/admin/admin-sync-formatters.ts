import { parseApiDate } from "./admin-formatters";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "--.--.----, --:--:--";
  }
  const date = parseApiDate(value);
  if (!date) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatSyncStatusRu(status: string | null | undefined): string {
  const value = String(status || "").trim().toLowerCase();
  if (value === "pending") {
    return "В очереди";
  }
  if (value === "in_progress") {
    return "Выполняется";
  }
  if (value === "completed" || value === "success") {
    return "Завершено";
  }
  if (value === "partial") {
    return "Частично";
  }
  if (value === "cancelled") {
    return "Отменено";
  }
  if (value === "failed") {
    return "Ошибка";
  }
  return "Неизвестно";
}

export function formatSyncStageRu(stage: string | null | undefined): string {
  const value = String(stage || "").trim().toLowerCase();
  if (!value) {
    return "—";
  }
  if (value === "discovering_urls") {
    return "Поиск ссылок";
  }
  if (value === "syncing_products") {
    return "Синхронизация товаров";
  }
  if (value === "source_finished") {
    return "Источник завершен";
  }
  if (value === "fallback_discovering_urls") {
    return "Fallback: поиск ссылок";
  }
  if (value === "fallback_sampling_products_js") {
    return "Fallback: проверка products.js";
  }
  if (value === "fallback_exporting_previews") {
    return "Fallback: выгрузка товаров";
  }
  return stage || "—";
}
