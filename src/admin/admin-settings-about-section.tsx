import { useRef, type ChangeEvent } from "react";
import { IconClose, IconPlus } from "../shared/mono-icons";
import { ABOUT_PHOTO_LIMIT, ABOUT_TEXT_LIMIT, type AdminAboutDraft } from "./hooks/use-admin-settings-content-drafts";

type Props = {
  draft: AdminAboutDraft;
  onChangeField: (field: "title" | "leftText" | "rightText", value: string) => void;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (photoId: string) => void;
  onMovePhoto: (photoId: string, direction: -1 | 1) => void;
  onReset: () => void;
};

function renderRemaining(length: number) {
  return Math.max(0, ABOUT_TEXT_LIMIT - length);
}

export function AdminSettingsAboutSection({
  draft,
  onChangeField,
  onAddPhotos,
  onRemovePhoto,
  onMovePhoto,
  onReset,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files] : [];
    event.target.value = "";
    onAddPhotos(files);
  };

  return (
    <div className="admin-settings-pane">
      <div className="admin-settings-split-grid">
        <section className="card admin-settings-panel">
          <div className="admin-settings-panel__head">
            <div>
              <h2>Обо мне</h2>
              <p className="muted">Слева и справа редактируются два самостоятельных текста, как на реальной странице.</p>
            </div>
            <div className="admin-settings-panel__actions">
              <button type="button" className="admin-settings-ghost-btn" onClick={onReset}>
                Сбросить черновик
              </button>
            </div>
          </div>
          <div className="admin-settings-form-grid">
            <label className="admin-settings-field">
              <span>Заголовок страницы</span>
              <input
                className="input"
                value={draft.title}
                maxLength={48}
                onChange={(event) => onChangeField("title", event.target.value)}
                placeholder="Например: ОБО МНЕ"
              />
            </label>

            <label className="admin-settings-field">
              <div className="admin-settings-field__head">
                <span>Первый текстовый блок</span>
                <small className="muted">{renderRemaining(draft.leftText.length)} символов осталось</small>
              </div>
              <textarea
                value={draft.leftText}
                maxLength={ABOUT_TEXT_LIMIT}
                onChange={(event) => onChangeField("leftText", event.target.value)}
                placeholder="Сюда можно писать историю, подачу и вводный контекст."
              />
            </label>

            <label className="admin-settings-field">
              <div className="admin-settings-field__head">
                <span>Второй текстовый блок</span>
                <small className="muted">{renderRemaining(draft.rightText.length)} символов осталось</small>
              </div>
              <textarea
                value={draft.rightText}
                maxLength={ABOUT_TEXT_LIMIT}
                onChange={(event) => onChangeField("rightText", event.target.value)}
                placeholder="Сюда удобно вынести процесс работы, доставку и детали сервиса."
              />
            </label>

            <section className="admin-settings-preview-card" aria-label="Быстрый просмотр">
              <div className="admin-settings-preview-card__head">
                <strong>Быстрый просмотр</strong>
                <span className="muted">{`${draft.photos.length} фото в карусели`}</span>
              </div>
              <div className="admin-settings-preview-card__title">{draft.title.trim() || "ОБО МНЕ"}</div>
              <div className="admin-settings-preview-card__columns">
                <p>{draft.leftText.trim() || "Первый текстовый блок пока пуст."}</p>
                <p>{draft.rightText.trim() || "Второй текстовый блок пока пуст."}</p>
              </div>
            </section>
          </div>
        </section>

        <section className="card admin-settings-panel">
          <div className="admin-settings-panel__head">
            <div>
              <h3>Фотографии</h3>
              <p className="muted">Порядок карточек равен порядку кадров в карусели. Фото можно добавлять локально и переставлять прямо в сетке.</p>
            </div>
          </div>

          <div className="admin-settings-media-grid">
            {draft.photos.map((photo, index) => (
              <article key={photo.id} className="admin-settings-photo-card">
                <div className={`admin-settings-photo-card__media admin-settings-photo-card__media--${photo.accent}`}>
                  {photo.previewUrl ? (
                    <img src={photo.previewUrl} alt={photo.name} />
                  ) : (
                    <div className="admin-settings-photo-card__placeholder">
                      <span>{`0${index + 1}`.slice(-2)}</span>
                    </div>
                  )}
                  <button type="button" className="showcase-remove-btn" onClick={() => onRemovePhoto(photo.id)} aria-label={`Удалить ${photo.name}`}>
                    <IconClose className="icon-svg icon-svg--sm" />
                  </button>
                </div>
                <div className="admin-settings-photo-card__meta">
                  <strong>{photo.name}</strong>
                  <span className="muted">{photo.note}</span>
                </div>
                <div className="admin-settings-photo-card__actions">
                  <button type="button" className="admin-settings-ghost-btn" onClick={() => onMovePhoto(photo.id, -1)} disabled={index === 0}>
                    Раньше
                  </button>
                  <button
                    type="button"
                    className="admin-settings-ghost-btn"
                    onClick={() => onMovePhoto(photo.id, 1)}
                    disabled={index === draft.photos.length - 1}
                  >
                    Позже
                  </button>
                </div>
              </article>
            ))}

            {draft.photos.length < ABOUT_PHOTO_LIMIT ? (
              <button type="button" className="admin-settings-photo-add" onClick={() => inputRef.current?.click()}>
                <IconPlus className="icon-svg icon-svg--sm" />
                <span>Добавить фото</span>
              </button>
            ) : null}
          </div>

          <input ref={inputRef} type="file" accept="image/*" multiple className="input-hidden" onChange={onPickFiles} />
        </section>
      </div>
    </div>
  );
}
