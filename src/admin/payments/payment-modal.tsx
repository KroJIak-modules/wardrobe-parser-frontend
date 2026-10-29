import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAdminBodyScrollLock } from "../hooks/use-admin-body-scroll-lock";
import { IconClose } from "../../shared/mono-icons";
import type { Payment, PaymentDraft } from "./payments-api";
import { formatPaymentLinkLifetime, getPaymentLinkRemainingSeconds } from "./payment-lifetime";
import { getPaymentStatusLabel } from "./payment-status";

const DESCRIPTION_TEMPLATE = "Anton Shell — магазин качественных вещей из разных источников. Помогаем находить и заказывать одежду, обувь и аксессуары от интересных брендов со всего мира.";
type Props = {
  payment: Payment | null;
  userId: number | null;
  busy: boolean;
  onClose: () => void;
  onCreate: (draft: PaymentDraft, key: string) => Promise<void>;
};

export function PaymentModal({ payment, userId, busy, onClose, onCreate }: Props) {
  useAdminBodyScrollLock(true);
  const initial = payment;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [description, setDescription] = useState(initial?.description ?? DESCRIPTION_TEMPLATE);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const readOnly = Boolean(payment);

  useEffect(() => {
    if (!payment) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payment]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !busy) { event.preventDefault(); onClose(); return; }
    if (event.key !== "Tab") return;
    const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])') ?? []);
    if (!elements.length) { event.preventDefault(); dialogRef.current?.focus(); return; }
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() && !phone.trim()) { setError("Укажите email или телефон."); return; }
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !/^\d+(?:[.,]\d{1,2})?$/.test(amount.trim())) {
      setError("Укажите сумму больше нуля, не более двух знаков после запятой."); return;
    }
    if (userId === null) { setError("Не удалось определить пользователя; создание недоступно."); return; }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    setError("");
    try {
      await onCreate({ title: title.trim(), amount: numericAmount, description, email: email.trim(), phone: phone.trim(), customer_name: customerName.trim(), address: "" }, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать платёж");
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div ref={dialogRef} tabIndex={-1} className="modal payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" onKeyDown={onKeyDown} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><h2 id="payment-modal-title">{payment ? `Платёж ${payment.order_number}` : "Создать платёж"}</h2><button ref={closeRef} type="button" className="payment-modal__close" onClick={onClose} disabled={busy} aria-label="Закрыть"><IconClose className="icon-svg" /></button></div>
        <form onSubmit={submit} className="payment-form">
          {payment && (
            <div className="payment-modal__summary" aria-label="Сведения о платеже">
              <div className="payment-modal__summary-item">
                <span className="payment-modal__summary-label">Статус</span>
                <span className={`payment-status payment-status--${payment.status.toLowerCase()}`}>{getPaymentStatusLabel(payment.status)}</span>
              </div>
              <div className="payment-modal__summary-item">
                <span className="payment-modal__summary-label">Создан</span>
                <strong>{new Date(payment.created_at).toLocaleString("ru-RU")}</strong>
              </div>
              <div className="payment-modal__summary-item">
                <span className="payment-modal__summary-label">Ссылка активна</span>
                <strong>{formatPaymentLinkLifetime(getPaymentLinkRemainingSeconds(payment, now))}</strong>
              </div>
            </div>
          )}
          <label className="field"><span className="field__label">Название *</span><input required readOnly={readOnly || busy} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="field"><span className="field__label">Сумма, RUB *</span><input required readOnly={readOnly || busy} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="field"><span className="field__label">Описание</span><textarea readOnly={readOnly || busy} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
          <label className="field"><span className="field__label">Email</span><input type="email" readOnly={readOnly || busy} value={email} onChange={(e) => setEmail(e.target.value)} /><span className="field__hint">Укажите email или телефон.</span></label>
          <label className="field"><span className="field__label">Телефон</span><input type="tel" readOnly={readOnly || busy} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="field"><span className="field__label">Имя клиента</span><input readOnly={readOnly || busy} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
          {error && <p role="alert" className="payment-error">{error}</p>}
          <div className="payment-actions"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Закрыть</button>{!payment && <button type="submit" disabled={busy || !title.trim()}>{busy ? "Создание..." : "Создать"}</button>}</div>
        </form>
      </div>
    </div>
  );
}
