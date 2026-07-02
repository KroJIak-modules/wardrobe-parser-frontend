import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, authFetch } from "../../shared/admin-auth";
import type {
  SiteApiAdminSiteAboutResponse,
  SiteApiAdminSiteContentMediaUploadResponse,
  SiteApiAdminSiteNotificationsResponse,
  SiteApiAdminSiteQuestionsResponse,
} from "../../site/runtime/site-public-api";

export const ABOUT_TEXT_LIMIT = 760;
export const ABOUT_PHOTO_LIMIT = 8;

export type AdminAboutPhotoDraft = {
  id: string;
  assetId: number;
  name: string;
  previewUrl: string;
};

export type AdminAboutDraft = {
  text: string;
  photos: AdminAboutPhotoDraft[];
};

export type AdminQuestionDraft = {
  id: string;
  persistedId: number | null;
  question: string;
  answer: string;
  isEnabled: boolean;
  isExpandedByDefault: boolean;
};

export type AdminNotificationDraft = {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageAssetId: number | null;
  imagePreviewUrl: string | null;
};

const EMPTY_NOTIFICATION_DRAFT: AdminNotificationDraft = {
  title: "",
  description: "",
  buttonText: "",
  buttonUrl: "",
  imageAssetId: null,
  imagePreviewUrl: null,
};

export type AdminNotificationItem = {
  id: number;
  version: number;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imagePreviewUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function buildAboutDraftSignature(draft: AdminAboutDraft): string {
  return JSON.stringify({
    text: draft.text,
    photoAssetIds: draft.photos.map((photo) => photo.assetId),
  });
}

function buildNotificationDraftSignature(draft: AdminNotificationDraft): string {
  return JSON.stringify({
    title: draft.title,
    description: draft.description,
    buttonText: draft.buttonText,
    buttonUrl: draft.buttonUrl,
    imageAssetId: draft.imageAssetId,
  });
}

function buildQuestionsDraftSignature(drafts: AdminQuestionDraft[]): string {
  return JSON.stringify(
    drafts.map((item, index) => ({
      localId: item.id,
      persistedId: item.persistedId,
      question: item.question,
      answer: item.answer,
      isEnabled: item.isEnabled,
      isExpandedByDefault: item.isExpandedByDefault,
      position: index + 1,
    })),
  );
}

function reconcileQuestionsDraftIds(
  currentDrafts: AdminQuestionDraft[],
  nextDrafts: AdminQuestionDraft[],
): AdminQuestionDraft[] {
  const currentByPersistedId = new Map<number, string>();
  for (const item of currentDrafts) {
    if (item.persistedId !== null) {
      currentByPersistedId.set(item.persistedId, item.id);
    }
  }
  return nextDrafts.map((item, index) => {
    const persistedLocalId = item.persistedId !== null ? currentByPersistedId.get(item.persistedId) : null;
    if (persistedLocalId) {
      return { ...item, id: persistedLocalId };
    }
    const currentAtSameIndex = currentDrafts[index];
    if (
      currentAtSameIndex
      && currentAtSameIndex.persistedId === null
      && currentAtSameIndex.question === item.question
      && currentAtSameIndex.answer === item.answer
      && currentAtSameIndex.isEnabled === item.isEnabled
      && currentAtSameIndex.isExpandedByDefault === item.isExpandedByDefault
    ) {
      return { ...item, id: currentAtSameIndex.id };
    }
    return item;
  });
}

function toAboutDraft(payload: SiteApiAdminSiteAboutResponse): AdminAboutDraft {
  return {
    text: payload.text,
    photos: payload.photos.map((photo) => ({
      id: `asset-${photo.id}`,
      assetId: photo.id,
      name: `Фото ${photo.id}`,
      previewUrl: photo.url,
    })),
  };
}

function toQuestionDrafts(payload: SiteApiAdminSiteQuestionsResponse): AdminQuestionDraft[] {
  return payload.items.map((item) => ({
    id: item.id > 0 ? `question-${item.id}` : `question-new-${crypto.randomUUID()}`,
    persistedId: item.id,
    question: item.question,
    answer: item.answer,
    isEnabled: item.is_enabled,
    isExpandedByDefault: item.is_expanded_by_default,
  }));
}

function toNotificationItems(payload: SiteApiAdminSiteNotificationsResponse): AdminNotificationItem[] {
  return payload.items.map((item) => ({
    id: item.id,
    version: item.version,
    title: item.title,
    description: item.description,
    buttonText: item.button_text,
    buttonUrl: item.button_url,
    imagePreviewUrl: item.image?.url ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

async function jsonOrThrow<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await authFetch(input, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
    throw new Error(typeof payload?.detail === "string" && payload.detail.trim() ? payload.detail : `Ошибка: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function useAdminSiteContent({ onToast }: { onToast: (message: string, type?: "success" | "error") => void }) {
  const nextQuestionIdRef = useRef(1);
  const [aboutDraft, setAboutDraft] = useState<AdminAboutDraft>({ text: "", photos: [] });
  const [questionsDraft, setQuestionsDraft] = useState<AdminQuestionDraft[]>([]);
  const [notificationDraft, setNotificationDraft] = useState<AdminNotificationDraft>(EMPTY_NOTIFICATION_DRAFT);
  const [notificationItems, setNotificationItems] = useState<AdminNotificationItem[]>([]);
  const [initialAboutDraft, setInitialAboutDraft] = useState<AdminAboutDraft>({ text: "", photos: [] });
  const [initialQuestionsDraft, setInitialQuestionsDraft] = useState<AdminQuestionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);
  const [uploadingNotificationImage, setUploadingNotificationImage] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aboutPayload, questionsPayload, notificationPayload] = await Promise.all([
        jsonOrThrow<SiteApiAdminSiteAboutResponse>(`${API_BASE}/admin/site-content/about`),
        jsonOrThrow<SiteApiAdminSiteQuestionsResponse>(`${API_BASE}/admin/site-content/questions`),
        jsonOrThrow<SiteApiAdminSiteNotificationsResponse>(`${API_BASE}/admin/site-content/notification`),
      ]);
      const nextAbout = toAboutDraft(aboutPayload);
      const nextQuestions = toQuestionDrafts(questionsPayload);
      const nextNotifications = toNotificationItems(notificationPayload);
      setAboutDraft(nextAbout);
      setQuestionsDraft(nextQuestions);
      setNotificationItems(nextNotifications);
      setInitialAboutDraft(nextAbout);
      setInitialQuestionsDraft(nextQuestions);
      nextQuestionIdRef.current = nextQuestions.length + 1;
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось загрузить контент", "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateAboutText = useCallback((value: string) => {
    setAboutDraft((previous) => ({ ...previous, text: value }));
  }, []);

  const addAboutPhotos = useCallback(async (files: File[]) => {
    const uploadQueue = files.slice(0, Math.max(0, ABOUT_PHOTO_LIMIT - aboutDraft.photos.length));
    if (uploadQueue.length === 0) {
      return;
    }
    setUploadingPhoto(true);
    try {
      const uploaded = await Promise.all(
        uploadQueue.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const payload = await jsonOrThrow<SiteApiAdminSiteContentMediaUploadResponse>(`${API_BASE}/admin/site-content/media/upload`, {
            method: "POST",
            body: formData,
          });
          return payload.asset;
        }),
      );
      setAboutDraft((previous) => ({
        ...previous,
        photos: [
          ...previous.photos,
          ...uploaded.map((asset) => ({
            id: `asset-${asset.id}`,
            assetId: asset.id,
            name: `Фото ${asset.id}`,
            previewUrl: asset.url,
          })),
        ],
      }));
      onToast("Фото загружены");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось загрузить фото", "error");
    } finally {
      setUploadingPhoto(false);
    }
  }, [aboutDraft.photos.length, onToast]);

  const removeAboutPhoto = useCallback((photoId: string) => {
    setAboutDraft((previous) => ({
      ...previous,
      photos: previous.photos.filter((photo) => photo.id !== photoId),
    }));
  }, []);

  const moveAboutPhoto = useCallback((photoId: string, direction: -1 | 1) => {
    setAboutDraft((previous) => {
      const index = previous.photos.findIndex((photo) => photo.id === photoId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= previous.photos.length) {
        return previous;
      }
      const nextPhotos = [...previous.photos];
      const [moved] = nextPhotos.splice(index, 1);
      nextPhotos.splice(nextIndex, 0, moved);
      return { ...previous, photos: nextPhotos };
    });
  }, []);

  const saveAbout = useCallback(async (draftSnapshot: AdminAboutDraft, options?: { silent?: boolean }) => {
    const submittedSignature = buildAboutDraftSignature(draftSnapshot);
    setSavingAbout(true);
    try {
      const payload = await jsonOrThrow<SiteApiAdminSiteAboutResponse>(`${API_BASE}/admin/site-content/about`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draftSnapshot.text,
          photo_asset_ids: draftSnapshot.photos.map((photo) => photo.assetId),
        }),
      });
      const nextAbout = toAboutDraft(payload);
      setInitialAboutDraft(nextAbout);
      setAboutDraft((previous) => (buildAboutDraftSignature(previous) === submittedSignature ? nextAbout : previous));
      if (!options?.silent) {
        onToast("Блок 'Обо мне' сохранен");
      }
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось сохранить блок 'Обо мне'", "error");
    } finally {
      setSavingAbout(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (loading || uploadingPhoto || savingAbout) {
      return;
    }
    if (buildAboutDraftSignature(aboutDraft) === buildAboutDraftSignature(initialAboutDraft)) {
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAbout(aboutDraft, { silent: true });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [aboutDraft, initialAboutDraft, loading, saveAbout, savingAbout, uploadingPhoto]);

  const addQuestion = useCallback(() => {
    const nextId = `question-new-${nextQuestionIdRef.current++}`;
    setQuestionsDraft((previous) => [
      ...previous,
      {
        id: nextId,
        persistedId: null,
        question: "",
        answer: "",
        isEnabled: true,
        isExpandedByDefault: false,
      },
    ]);
    return nextId;
  }, []);

  const updateQuestion = useCallback((questionId: string, patch: Partial<AdminQuestionDraft>) => {
    setQuestionsDraft((previous) => previous.map((item) => (item.id === questionId ? { ...item, ...patch } : item)));
  }, []);

  const moveQuestion = useCallback((questionId: string, direction: -1 | 1) => {
    setQuestionsDraft((previous) => {
      const index = previous.findIndex((item) => item.id === questionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= previous.length) {
        return previous;
      }
      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestionsDraft((previous) => previous.filter((item) => item.id !== questionId));
  }, []);

  const updateNotification = useCallback((patch: Partial<AdminNotificationDraft>) => {
    setNotificationDraft((previous) => ({ ...previous, ...patch }));
  }, []);

  const uploadNotificationImage = useCallback(async (file: File) => {
    setUploadingNotificationImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const payload = await jsonOrThrow<SiteApiAdminSiteContentMediaUploadResponse>(`${API_BASE}/admin/site-content/media/upload`, {
        method: "POST",
        body: formData,
      });
      setNotificationDraft((previous) => ({
        ...previous,
        imageAssetId: payload.asset.id,
        imagePreviewUrl: payload.asset.url,
      }));
      onToast("Фото загружено");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось загрузить фото", "error");
    } finally {
      setUploadingNotificationImage(false);
    }
  }, [onToast]);

  const saveNotification = useCallback(async () => {
    const draftSnapshot = notificationDraft;
    setSavingNotification(true);
    try {
      const payload = await jsonOrThrow<SiteApiAdminSiteNotificationsResponse>(`${API_BASE}/admin/site-content/notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftSnapshot.title,
          description: draftSnapshot.description,
          button_text: draftSnapshot.buttonText,
          button_url: draftSnapshot.buttonUrl,
          image_asset_id: draftSnapshot.imageAssetId,
        }),
      });
      setNotificationItems(toNotificationItems(payload));
      setNotificationDraft(EMPTY_NOTIFICATION_DRAFT);
      onToast("Уведомление создано");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось создать уведомление", "error");
    } finally {
      setSavingNotification(false);
    }
  }, [notificationDraft, onToast]);

  const resetNotificationSeenState = useCallback(async (notificationId: number) => {
    setNotificationActionId(notificationId);
    try {
      const payload = await jsonOrThrow<SiteApiAdminSiteNotificationsResponse>(`${API_BASE}/admin/site-content/notification/${notificationId}/reset`, {
        method: "POST",
      });
      setNotificationItems(toNotificationItems(payload));
      onToast("Уведомление снова появится на витрине");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось сбросить уведомление", "error");
    } finally {
      setNotificationActionId(null);
    }
  }, [onToast]);

  const deleteNotification = useCallback(async (notificationId: number) => {
    setNotificationActionId(notificationId);
    try {
      const payload = await jsonOrThrow<SiteApiAdminSiteNotificationsResponse>(`${API_BASE}/admin/site-content/notification/${notificationId}`, {
        method: "DELETE",
      });
      setNotificationItems(toNotificationItems(payload));
      onToast("Уведомление удалено");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось удалить уведомление", "error");
    } finally {
      setNotificationActionId(null);
    }
  }, [onToast]);

  const saveQuestions = useCallback(async (draftSnapshot: AdminQuestionDraft[], options?: { silent?: boolean }) => {
    const submittedSignature = buildQuestionsDraftSignature(draftSnapshot);
    setSavingQuestions(true);
    try {
      const payload = await jsonOrThrow<SiteApiAdminSiteQuestionsResponse>(`${API_BASE}/admin/site-content/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: draftSnapshot.map((item) => ({
            id: item.persistedId,
            question: item.question,
            answer: item.answer,
            is_enabled: item.isEnabled,
            is_expanded_by_default: item.isExpandedByDefault,
          })),
        }),
      });
      const nextQuestions = toQuestionDrafts(payload);
      setInitialQuestionsDraft(nextQuestions);
      setQuestionsDraft((previous) => {
        if (buildQuestionsDraftSignature(previous) !== submittedSignature) {
          return previous;
        }
        return reconcileQuestionsDraftIds(previous, nextQuestions);
      });
      if (!options?.silent) {
        onToast("Вопросы сохранены");
      }
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Не удалось сохранить вопросы", "error");
    } finally {
      setSavingQuestions(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (loading || savingQuestions) {
      return;
    }
    if (buildQuestionsDraftSignature(questionsDraft) === buildQuestionsDraftSignature(initialQuestionsDraft)) {
      return;
    }
    const timer = window.setTimeout(() => {
      void saveQuestions(questionsDraft, { silent: true });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [initialQuestionsDraft, loading, questionsDraft, saveQuestions, savingQuestions]);

  const aboutStats = useMemo(
    () => ({
      photosCount: aboutDraft.photos.length,
      textLength: aboutDraft.text.trim().length,
    }),
    [aboutDraft.photos.length, aboutDraft.text],
  );

  const questionStats = useMemo(
    () => ({
      total: questionsDraft.length,
      enabled: questionsDraft.filter((item) => item.isEnabled).length,
      defaultOpen: questionsDraft.filter((item) => item.isExpandedByDefault).length,
    }),
    [questionsDraft],
  );

  return {
    loading,
    aboutDraft,
    aboutStats,
    savingAbout,
    uploadingPhoto,
    updateAboutText,
    addAboutPhotos,
    removeAboutPhoto,
    moveAboutPhoto,
    saveAbout,
    questionsDraft,
    questionStats,
    savingQuestions,
    addQuestion,
    updateQuestion,
    moveQuestion,
    deleteQuestion,
    saveQuestions,
    notificationDraft,
    notificationItems,
    notificationDirty: buildNotificationDraftSignature(notificationDraft) !== buildNotificationDraftSignature(EMPTY_NOTIFICATION_DRAFT),
    savingNotification,
    uploadingNotificationImage,
    notificationActionId,
    updateNotification,
    uploadNotificationImage,
    saveNotification,
    resetNotificationSeenState,
    deleteNotification,
  };
}
