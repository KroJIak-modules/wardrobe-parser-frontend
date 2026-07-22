import { useRef, type ChangeEvent } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { IconPlus } from "../shared/mono-icons";
import type { AdminNotificationDraft, AdminNotificationItem } from "./hooks/use-admin-site-content";

type Props = {
  draft: AdminNotificationDraft;
  items: AdminNotificationItem[];
  loading?: boolean;
  dirty?: boolean;
  saving?: boolean;
  uploadingImage?: boolean;
  actionId?: number | null;
  onChange: (patch: Partial<AdminNotificationDraft>) => void;
  onUploadImage: (file: File) => Promise<void> | void;
  onCreate: () => Promise<void> | void;
  onResetSeenState: (notificationId: number) => Promise<void> | void;
  onDelete: (notificationId: number) => Promise<void> | void;
};

function formatNotificationDate(value: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminSettingsNotificationSection({
  draft,
  items,
  loading = false,
  dirty = false,
  saving = false,
  uploadingImage = false,
  actionId = null,
  onChange,
  onUploadImage,
  onCreate,
  onResetSeenState,
  onDelete,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busy = loading || saving || uploadingImage || actionId !== null;

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (file) {
      onUploadImage(file);
    }
  };

  return (
    <div className="admin-settings-pane">
      <section className="card admin-settings-panel">
        <div className="admin-settings-panel__head">
          <div>
            <h2>Новое уведомление</h2>
          </div>
        </div>

          <div className="admin-settings-notification-form">
            <div className="admin-settings-form-grid">
            <label className="admin-settings-field">
              <span>Заголовок</span>
              <input
                className="input"
                value={draft.title}
                onChange={(event) => onChange({ title: event.target.value })}
                disabled={loading}
              />
            </label>

            <label className="admin-settings-field">
              <span>Описание</span>
              <textarea
                value={draft.description}
                onChange={(event) => onChange({ description: event.target.value })}
                disabled={loading}
              />
            </label>

            <div className="admin-settings-form-grid admin-settings-form-grid--two">
              <label className="admin-settings-field">
                <span>Текст кнопки</span>
                <input
                  className="input"
                  value={draft.buttonText}
                  onChange={(event) => onChange({ buttonText: event.target.value })}
                  disabled={loading}
                />
              </label>

              <label className="admin-settings-field">
                <span>Ссылка кнопки</span>
                <input
                  className="input"
                  value={draft.buttonUrl}
                  onChange={(event) => onChange({ buttonUrl: event.target.value })}
                  disabled={loading}
                />
              </label>
            </div>
            </div>

            <div className="admin-settings-field admin-settings-notification-photo">
              <span>Фото</span>
              <div className="admin-settings-notification-image">
                {draft.imagePreviewUrl ? (
                  <div className="admin-settings-notification-image__preview">
                    <img src={draft.imagePreviewUrl} alt="" />
                  </div>
                ) : (
                  <button type="button" className="admin-settings-photo-add admin-settings-notification-image__add" onClick={() => inputRef.current?.click()} disabled={busy}>
                    <IconPlus className="icon-svg icon-svg--sm" />
                    <span>{uploadingImage ? "Загрузка..." : "Добавить фото"}</span>
                  </button>
                )}
                {draft.imagePreviewUrl ? (
                  <button type="button" className="admin-settings-ghost-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
                    {uploadingImage ? "Загрузка..." : "Заменить фото"}
                  </button>
                ) : null}
              </div>
            </div>

          <input ref={inputRef} type="file" accept="image/*" className="input-hidden" onChange={onPickFile} />
          <div className="admin-settings-notification-form__actions">
            <button type="button" onClick={onCreate} disabled={busy || !dirty}>
              {saving ? "Создание..." : "Создать"}
            </button>
          </div>
        </div>
      </section>

      <section className="card admin-settings-panel">
        <div className="admin-settings-panel__head">
          <div>
            <h3>Созданные уведомления</h3>
          </div>
        </div>

        <div className="admin-settings-notification-list">
          {items.length > 0 ? (
            items.map((item) => (
              <article key={item.id} className="admin-settings-notification-card">
                <div className="admin-settings-notification-card__media">
                  {item.imagePreviewUrl ? <img src={item.imagePreviewUrl} alt="" /> : null}
                </div>
                <div className="admin-settings-notification-card__content">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="muted">{formatNotificationDate(item.createdAt)}</span>
                  </div>
                  <p>{item.description}</p>
                  <span className="admin-settings-notification-card__button">{item.buttonText}</span>
                </div>
                <div className="admin-settings-notification-card__actions">
                  <button
                    type="button"
                    className="admin-settings-icon-btn"
                    onClick={() => onResetSeenState(item.id)}
                    disabled={busy}
                    title="Сбросить показ"
                    aria-label="Сбросить показ"
                  >
                    <RotateCcw className="icon-svg icon-svg--sm" />
                  </button>
                  <button
                    type="button"
                    className="admin-settings-icon-btn admin-settings-icon-btn--danger"
                    onClick={() => onDelete(item.id)}
                    disabled={busy}
                    title="Удалить уведомление"
                    aria-label="Удалить уведомление"
                  >
                    <Trash2 className="icon-svg icon-svg--sm" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-settings-history__empty">Уведомлений нет</div>
          )}
        </div>
      </section>
    </div>
  );
}
