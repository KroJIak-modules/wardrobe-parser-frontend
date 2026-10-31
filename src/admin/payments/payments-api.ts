import { API_BASE, authFetch } from "../../shared/admin-auth";
import { apiJson } from "../../shared/api-client";

export type PaymentDraft = {
  title: string;
  amount: number;
  description: string;
  email: string;
  phone: string;
  customer_name: string;
  address: string;
};

export type Payment = PaymentDraft & {
  id: number | string;
  order_number: string;
  status: string;
  payment_url: string | null;
  created_at: string;
};

export type PaymentList = { items: Payment[]; total: number };
export type PaymentReadiness = { configured: boolean; callback_configured: boolean };
export const PAYMENT_PAGE_SIZE = 30;

export function getPaymentReadiness(): Promise<PaymentReadiness> {
  return apiJson(`${API_BASE}/admin/payments/readiness`);
}

export function listPayments(offset: number): Promise<PaymentList> {
  return apiJson(`${API_BASE}/admin/payments?limit=${PAYMENT_PAGE_SIZE}&offset=${offset}`);
}

export function createPayment(draft: PaymentDraft, idempotencyKey: string): Promise<Payment> {
  return apiJson(`${API_BASE}/admin/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(draft),
  });
}

export function refreshPayment(id: Payment["id"]): Promise<Payment> {
  return apiJson(`${API_BASE}/admin/payments/${encodeURIComponent(String(id))}/refresh`, { method: "POST" });
}
