import { useRef, type ChangeEvent } from "react";
import { IconClose, IconPlus } from "../shared/mono-icons";
import { ABOUT_PHOTO_LIMIT, ABOUT_TEXT_LIMIT, type AdminAboutDraft } from "./hooks/use-admin-site-content";

type Props = {
  draft: AdminAboutDraft;
  loading?: boolean;
  saving?: boolean;
  uploadingPhoto?: boolean;
  onChangeText: (value: string) => void;
  onAddPhotos: (files: File[]) => Promise<void> | void;
  onRemovePhoto: (photoId: string) => void;
  onMovePhoto: (photoId: string, direction: -1 | 1) => void;
};

function renderRemaining(length: number) {
  return Math.max(0, ABOUT_TEXT_LIMIT - length);
}

export function AdminSettingsAboutSection({
  draft,
  loading = false,
  saving = false,
  uploadingPhoto = false,
  onChangeText,
  onAddPhotos,
  onRemovePhoto,
  onMovePhoto,
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
            </div>
          </div>
          <div className="admin-settings-form-grid">
            <label className="admin-settings-field">
              <div className="admin-settings-field__head">
                <span>Текст блока</span>
                <small className="muted">{renderRemaining(draft.text.length)} символов осталось</small>
              </div>
              <textarea
                value={draft.text}
                maxLength={ABOUT_TEXT_LIMIT}
                onChange={(event) => onChangeText(event.target.value)}
                placeholder="Сюда можно написать историю, подачу и правила работы."
                disabled={loading}
              />
            </label>
          </div>
        </section>

        <section className="card admin-settings-panel">
          <div className="admin-settings-panel__head">
            <div>
              <h3>Фотографии</h3>
            </div>
          </div>

          <div className="admin-settings-media-grid">
            {draft.photos.map((photo, index) => (
              <article key={photo.id} className="admin-settings-photo-card">
                <div className="admin-settings-photo-card__media admin-settings-photo-card__media--pearl">
                  <img src={photo.previewUrl} alt={photo.name} />
                  <button type="button" className="showcase-remove-btn" onClick={() => onRemovePhoto(photo.id)} aria-label={`Удалить ${photo.name}`}>
                    <IconClose className="icon-svg icon-svg--sm" />
                  </button>
                </div>
                <div className="admin-settings-photo-card__meta">
                  <strong>{photo.name}</strong>
                  <span className="muted">{`Позиция ${index + 1}`}</span>
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
              <button type="button" className="admin-settings-photo-add" onClick={() => inputRef.current?.click()} disabled={uploadingPhoto || loading}>
                <IconPlus className="icon-svg icon-svg--sm" />
                <span>{uploadingPhoto ? "Загрузка..." : "Добавить фото"}</span>
              </button>
            ) : null}
          </div>

          <input ref={inputRef} type="file" accept="image/*" multiple className="input-hidden" onChange={onPickFiles} />
        </section>
      </div>
    </div>
  );
}
