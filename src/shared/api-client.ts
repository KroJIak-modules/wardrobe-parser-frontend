import { authFetch } from "./admin-auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => null)) as { detail?: string } | null;
  return payload?.detail || `Ошибка: ${res.status}`;
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
