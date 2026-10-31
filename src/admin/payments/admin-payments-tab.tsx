import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminMeCached } from "../../shared/admin-auth";
import { PaymentModal } from "./payment-modal";
import { createPayment, getPaymentReadiness, listPayments, refreshPayment, type Payment, type PaymentDraft } from "./payments-api";
import { formatPaymentLinkLifetime, getPaymentLinkRemainingSeconds } from "./payment-lifetime";
import { getPaymentStatusLabel } from "./payment-status";
import "./payments.css";

const rubFormatter = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" });

export function AdminPaymentsTab({ pushToast }: { pushToast: (message: string) => void }) {
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [paymentsConfigured, setPaymentsConfigured] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [modal, setModal] = useState<Payment | "create" | null>(null);
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const itemsRef = useRef<Payment[]>([]);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void getAdminMeCached().then((me) => {
      if (active) {
        setUserId(me?.user_id ?? null);
        setCanEdit(Boolean(me && (me.is_superuser || me.permissions?.includes("control.settings.edit"))));
      }
    }).catch(() => { if (active) setCanEdit(false); });
    void getPaymentReadiness().then((readiness) => {
      if (active) setPaymentsConfigured(readiness.configured);
    }).catch(() => { if (active) setPaymentsConfigured(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setListError("");
    listPayments(offset).then((result) => {
      if (!active) return;
      setItems((previous) => {
        const next = offset === 0 ? result.items : [...previous, ...result.items];
        itemsRef.current = next;
        return next;
      });
      setTotal(result.total);
      if (canEdit) {
        const pending = result.items.filter((payment) => ["pending", "creating", "create_unknown"].includes(payment.status.toLowerCase()));
        void Promise.all(pending.map((payment) => refreshPayment(payment.id).catch(() => null))).then((refreshed) => {
          if (!active) return;
          const updates = new Map(refreshed.filter((payment): payment is Payment => payment !== null).map((payment) => [String(payment.id), payment]));
          if (updates.size > 0) {
            setItems((current) => {
              const next = current.map((payment) => updates.get(String(payment.id)) ?? payment);
              itemsRef.current = next;
              return next;
            });
          }
        });
      }
    }).catch((err: unknown) => {
      if (active) {
        setListError(err instanceof Error ? err.message : "Не удалось загрузить платежи");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canEdit, offset, version]);

  const reload = useCallback(() => {
    setOffset(0);
    itemsRef.current = [];
    setItems([]);
    setVersion((value) => value + 1);
  }, []);

  async function handleCreate(draft: PaymentDraft, idempotencyKey: string) {
    setBusy(true);
    try {
      const created = await createPayment(draft, idempotencyKey);
      if (created.payment_url) {
        try {
          await navigator.clipboard.writeText(created.payment_url);
          pushToast("Платёж создан. Ссылка скопирована.");
        } catch {
          pushToast("Платёж создан, но ссылку не удалось скопировать.");
        }
      } else {
        pushToast("Платёж создан.");
      }
      reload();
    } finally {
      setBusy(false);
    }
  }

  const refreshPendingPayments = useCallback(async () => {
    if (!canEdit || refreshingRef.current) return;
    const pendingPayments = itemsRef.current.filter((payment) => ["pending", "creating", "create_unknown"].includes(payment.status.toLowerCase()));
    if (pendingPayments.length === 0) return;
    refreshingRef.current = true;
    try {
      const refreshed = await Promise.all(pendingPayments.map((payment) => refreshPayment(payment.id).catch(() => null)));
      const updates = new Map(refreshed.filter((payment): payment is Payment => payment !== null).map((payment) => [String(payment.id), payment]));
      if (updates.size > 0) {
        setItems((current) => {
          const next = current.map((payment) => updates.get(String(payment.id)) ?? payment);
          itemsRef.current = next;
          return next;
        });
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [canEdit]);

  useEffect(() => {
    const timer = window.setInterval(() => void refreshPendingPayments(), 30_000);
    return () => window.clearInterval(timer);
  }, [offset, version, refreshPendingPayments]);

  async function copyLink(payment: Payment) {
    if (!payment.payment_url) return;
    try {
      await navigator.clipboard.writeText(payment.payment_url);
      pushToast("Ссылка скопирована.");
      setActionError("");
    } catch {
      setActionError("Не удалось скопировать ссылку.");
    }
  }

  const canLoadMore = items.length < total;

  return (
    <section className="card payments">
      <div className="payments-heading">
        <div className="payments-heading__title">
          <h2>Платежи</h2>
          {total > 0 ? <span className="payments-heading__count">{total}</span> : null}
        </div>
      </div>
      {canEdit ? (
        <div className="payments-create-row">
          {!paymentsConfigured ? <p className="payment-error">Платежи не настроены: добавьте параметры Antilopay в окружение backend.</p> : null}
          <button type="button" className="payments-create-button" onClick={() => setModal("create")} disabled={busy || !paymentsConfigured} title={!paymentsConfigured ? "Платежи Antilopay не настроены" : undefined}>
            Создать платёж
          </button>
        </div>
      ) : null}
      {actionError && <p role="alert" className="payment-error">{actionError}</p>}
      {listError && <p role="alert" className="payment-error">{listError}</p>}

      <div
        className="payments-table-scroll"
        onScroll={(event) => {
          const element = event.currentTarget;
          if (!loading && !listError && !busy && canLoadMore && element.scrollTop + element.clientHeight >= element.scrollHeight - 24) {
            setOffset(items.length);
          }
        }}
      >
        <table className="payments-table">
          <thead>
            <tr><th>Номер</th><th>Название</th><th>Сумма</th><th>Статус</th><th>Ссылка активна</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {items.map((payment) => (
              <tr
                key={payment.id}
                className="payments-table__row"
                tabIndex={0}
                onClick={() => setModal(payment)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setModal(payment);
                  }
                }}
              >
                <td><span className="payments-link payments-link--order">{payment.order_number}</span></td>
                <td><span className="payments-link">{payment.title}</span></td>
                <td className="payments-table__amount">{rubFormatter.format(Number(payment.amount))}</td>
                <td><span className={`payment-status payment-status--${payment.status.toLowerCase()}`}>{getPaymentStatusLabel(payment.status)}</span></td>
                <td className="payments-table__lifetime">{formatPaymentLinkLifetime(getPaymentLinkRemainingSeconds(payment, now))}</td>
                <td>
                  <div className="payment-actions">
                    <button type="button" className="ghost" disabled={!payment.payment_url || busy} onClick={(event) => { event.stopPropagation(); void copyLink(payment); }}>Копировать ссылку</button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && items.length === 0 ? <tr><td colSpan={6} className="payments-table__state">Загрузка платежей…</td></tr> : null}
            {!loading && !listError && items.length === 0 ? <tr><td colSpan={6} className="payments-table__state">Платежей пока нет</td></tr> : null}
            {loading && items.length > 0 ? <tr><td colSpan={6} className="payments-table__state">Загрузка ещё…</td></tr> : null}
          </tbody>
        </table>
      </div>
      {listError ? <button type="button" className="payments-retry ghost" onClick={reload}>Повторить загрузку</button> : null}
      {modal ? <PaymentModal key={modal === "create" ? "create" : String(modal.id)} payment={modal === "create" ? null : modal} userId={userId} busy={busy} onClose={() => setModal(null)} onCreate={handleCreate} /> : null}
    </section>
  );
}
