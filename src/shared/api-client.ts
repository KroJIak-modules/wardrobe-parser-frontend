import { authFetch } from "./admin-auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          const maybeItem = item as { msg?: unknown; message?: unknown; loc?: unknown };
          if (typeof maybeItem.msg === "string" && maybeItem.msg.trim()) {
            return maybeItem.msg;
          }
          if (typeof maybeItem.message === "string" && maybeItem.message.trim()) {
            return maybeItem.message;
          }
          if (Array.isArray(maybeItem.loc)) {
            return maybeItem.loc.map((entry) => String(entry)).join(".");
          }
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.join("; ");
    }
  }
  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return `Ошибка: ${res.status}`;
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(url, init);
  if (!res.ok) {
    throw new ApiError(await extractErrorMessage(res), res.status);
  }
  return (await res.json()) as T;
}

export async function apiNoContent(url: string, init?: RequestInit): Promise<void> {
  const res = await authFetch(url, init);
  if (!res.ok) {
    throw new ApiError(await extractErrorMessage(res), res.status);
  }
}
