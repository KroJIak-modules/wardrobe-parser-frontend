export const paymentStatusLabels: Record<string, string> = {
  pending: "Ожидает оплаты",
  creating: "Создаётся",
  create_unknown: "Результат создания неизвестен",
  create_failed: "Ошибка создания",
  create_rejected: "Отклонён провайдером",
  paid: "Оплачен",
  success: "Оплачен",
  succeeded: "Оплачен",
  fail: "Ошибка",
  failed: "Ошибка",
  expired: "Истёк",
  chargeback: "Оспорен",
  reversed: "Возвращён",
};

export function getPaymentStatusLabel(status: string): string {
  return paymentStatusLabels[status.toLowerCase()] ?? status;
}
