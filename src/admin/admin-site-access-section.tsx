import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { API_BASE, authFetch } from "../shared/admin-auth";
import { IconEye, IconEyeOff } from "../shared/mono-icons";

type SiteAccessSettings = {
  enabled: boolean;
  title: string;
  description: string;
  password: string;
  updated_at: string;
};

type GeneratedPassword = {
  password: string;
};

type Props = {
  pushToast: (message: string, type?: "success" | "error") => void;
};

const EMPTY_SETTINGS: SiteAccessSettings = {
  enabled: false,
  title: "",
  description: "",
  password: "",
  updated_at: "",
};

const AUTOSAVE_DELAY_MS = 650;

function settingsSignature(settings: SiteAccessSettings) {
  return JSON.stringify({
    enabled: settings.enabled,
    title: settings.title,
    description: settings.description,
    password: settings.password,
  });
}

async function readJsonOrError<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Ошибка: ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) detail = String(payload.detail);
    } catch {
      // ignore malformed error responses
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export function AdminSiteAccessSection({ pushToast }: Props) {
  const [draft, setDraft] = useState<SiteAccessSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const draftRef = useRef<SiteAccessSettings>(EMPTY_SETTINGS);
  const lastSavedSignatureRef = useRef(settingsSignature(EMPTY_SETTINGS));
  const saveSeqRef = useRef(0);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/admin/site-content/access`);
      const payload = await readJsonOrError<SiteAccessSettings>(response);
      draftRef.current = payload;
      lastSavedSignatureRef.current = settingsSignature(payload);
      setDraft(payload);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось загрузить защиту сайта", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const saveSettings = useCallback(async (snapshot: SiteAccessSettings) => {
    const requestSeq = saveSeqRef.current + 1;
    saveSeqRef.current = requestSeq;
    const snapshotSignature = settingsSignature(snapshot);
    try {
      const response = await authFetch(`${API_BASE}/admin/site-content/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: snapshot.enabled,
          title: snapshot.title,
          description: snapshot.description,
          password: snapshot.password,
        }),
      });
      const payload = await readJsonOrError<SiteAccessSettings>(response);
      const currentSignature = settingsSignature(draftRef.current);
      if (requestSeq === saveSeqRef.current && currentSignature === snapshotSignature) {
        draftRef.current = payload;
        lastSavedSignatureRef.current = settingsSignature(payload);
        setDraft(payload);
      } else if (currentSignature === snapshotSignature) {
        lastSavedSignatureRef.current = snapshotSignature;
      }
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось сохранить защиту сайта", "error");
    }
  }, [pushToast]);

  useEffect(() => {
    if (loading) {
      return;
    }
    const currentSignature = settingsSignature(draft);
    if (currentSignature === lastSavedSignatureRef.current) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void saveSettings(draftRef.current);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [draft, loading, saveSettings]);

  const generatePassword = useCallback(async () => {
    setGenerating(true);
    try {
      const response = await authFetch(`${API_BASE}/admin/site-content/access/generate-password`, { method: "POST" });
      const payload = await readJsonOrError<GeneratedPassword>(response);
      setDraft((current) => ({ ...current, password: payload.password }));
      setPasswordVisible(true);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось сгенерировать пароль", "error");
    } finally {
      setGenerating(false);
    }
  }, [pushToast]);

  return (
    <section className="card admin-settings-panel admin-site-access">
      <div className="admin-settings-panel__head">
        <div>
          <h2>Пароль сайта</h2>
        </div>
        <label className="ui-switch ui-switch--compact admin-site-access__switch">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
            disabled={loading}
          />
          <span className="ui-switch-track"><span className="ui-switch-thumb" /></span>
          <span className="ui-switch-text">{draft.enabled ? "Включен" : "Выключен"}</span>
        </label>
      </div>

      <div className="admin-settings-form-grid admin-site-access__grid">
        <label className="admin-settings-field">
          <span>Title</span>
          <input
            className="input"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            disabled={loading}
          />
        </label>
        <label className="admin-settings-field">
          <span>Описание</span>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            disabled={loading}
          />
        </label>
        <label className="admin-settings-field">
          <span>Пароль</span>
          <span className="admin-site-access__password">
            <input
              className="input"
              type={passwordVisible ? "text" : "password"}
              value={draft.password}
              onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
              disabled={loading}
            />
            <button
              type="button"
              className="admin-site-access__icon-btn"
              onClick={() => setPasswordVisible((current) => !current)}
              disabled={loading}
              aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
            >
              {passwordVisible ? <IconEyeOff className="icon-svg" /> : <IconEye className="icon-svg" />}
            </button>
            <button
              type="button"
              className="admin-site-access__icon-btn"
              onClick={() => void generatePassword()}
              disabled={loading || generating}
              aria-label="Сгенерировать пароль"
            >
              <RotateCcw className="icon-svg" />
            </button>
          </span>
        </label>
      </div>
    </section>
  );
}
