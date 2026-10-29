import type { Payment } from "./payments-api";

export const PAYMENT_LINK_LIFETIME_SECONDS = 15 * 60;

export function getPaymentLinkRemainingSeconds(payment: Pick<Payment, "created_at" | "payment_url" | "status">, now = Date.now()): number | null {
  if (!payment.payment_url || payment.status.toLowerCase() !== "pending") {
    return null;
  }
  const createdAt = Date.parse(payment.created_at);
  if (!Number.isFinite(createdAt)) {
    return null;
  }
  return Math.max(0, PAYMENT_LINK_LIFETIME_SECONDS - Math.floor((now - createdAt) / 1000));
}

export function formatPaymentLinkLifetime(remainingSeconds: number | null): string {
  if (remainingSeconds === null) {
    return "—";
  }
  if (remainingSeconds === 0) {
    return "Истекла";
  }
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
