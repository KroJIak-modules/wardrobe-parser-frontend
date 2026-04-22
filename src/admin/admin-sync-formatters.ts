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
