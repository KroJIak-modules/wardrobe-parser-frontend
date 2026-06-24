import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ABOUT_TEXT_LIMIT = 760;
export const ABOUT_PHOTO_LIMIT = 8;

export type AdminAboutPhotoDraft = {
  id: string;
  name: string;
  note: string;
  previewUrl: string | null;
  objectUrl: string | null;
  accent: "ink" | "sand" | "fog" | "clay" | "pearl";
};

export type AdminAboutDraft = {
  title: string;
  leftText: string;
  rightText: string;
  photos: AdminAboutPhotoDraft[];
};

export type AdminQuestionDraft = {
  id: string;
  question: string;
  answer: string;
  isEnabled: boolean;
  isExpandedByDefault: boolean;
};

const ABOUT_TEXT_LEFT = `Anton Shell работает как частный байер и curator-редактор гардероба. В этой секции должен быть спокойный, длинный текст слева: кто это, какой у него подход к отбору вещей, как формируется вкус и почему подбор здесь не похож на потоковый ресейл.`;
const ABOUT_TEXT_RIGHT = `Справа обычно лежит продолжение истории: как строится коммуникация с клиентом, какие страны и площадки используются, чем отличается ручной поиск вещей и почему даже редкие позиции здесь не превращаются в хаотичный каталог без контекста.`;

function buildInitialAboutPhotos(): AdminAboutPhotoDraft[] {
  return [
    {
      id: "about-photo-1",
      name: "Съемка 01",
      note: "Первый кадр в карусели",
      previewUrl: null,
      objectUrl: null,
      accent: "ink",
    },
    {
      id: "about-photo-2",
      name: "Съемка 02",
      note: "Мягкий крупный план",
      previewUrl: null,
      objectUrl: null,
      accent: "sand",
    },
    {
      id: "about-photo-3",
      name: "Съемка 03",
      note: "Финальный акцент",
      previewUrl: null,
      objectUrl: null,
      accent: "fog",
    },
  ];
}

function buildInitialQuestions(): AdminQuestionDraft[] {
  return [
    {
      id: "question-1",
      question: "Как сделать заказ",
      answer: "Админ сможет написать здесь короткий алгоритм: как написать в личные сообщения, как подтвердить позицию, что происходит после выкупа и на каком этапе клиент получает финальную цену.",
      isEnabled: true,
      isExpandedByDefault: true,
    },
    {
      id: "question-2",
      question: "Сколько стоит доставка",
      answer: "Здесь удобно держать стандартный ответ про то, что доставка зависит от веса, направления, страховки и текущего курса, а точный расчет показывается после финальной сборки заказа.",
      isEnabled: true,
      isExpandedByDefault: false,
    },
    {
      id: "question-3",
      question: "Возможен ли возврат",
      answer: "В mock-версии это место для политики возврата и объяснения, почему у редких или заказных вещей условия могут отличаться от обычных готовых позиций.",
      isEnabled: false,
      isExpandedByDefault: false,
    },
  ];
}

function buildInitialAboutDraft(): AdminAboutDraft {
  return {
    title: "ОБО МНЕ",
    leftText: ABOUT_TEXT_LEFT,
    rightText: ABOUT_TEXT_RIGHT,
    photos: buildInitialAboutPhotos(),
  };
}

export function useAdminSettingsContentDrafts() {
  const nextPhotoIdRef = useRef(4);
  const nextQuestionIdRef = useRef(4);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const [aboutDraft, setAboutDraft] = useState<AdminAboutDraft>(() => buildInitialAboutDraft());
  const [questionsDraft, setQuestionsDraft] = useState<AdminQuestionDraft[]>(() => buildInitialQuestions());

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      objectUrlsRef.current.clear();
    };
  }, []);

  const revokePhotoObjectUrl = useCallback((photo: AdminAboutPhotoDraft | undefined) => {
    if (!photo?.objectUrl) {
      return;
    }
    URL.revokeObjectURL(photo.objectUrl);
    objectUrlsRef.current.delete(photo.objectUrl);
  }, []);

  const updateAboutField = useCallback((field: "title" | "leftText" | "rightText", value: string) => {
    setAboutDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addAboutPhotos = useCallback((files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setAboutDraft((prev) => {
      const remaining = Math.max(0, ABOUT_PHOTO_LIMIT - prev.photos.length);
      const nextFiles = files.slice(0, remaining);
      if (nextFiles.length === 0) {
        return prev;
      }
      const uploadedPhotos = nextFiles.map<AdminAboutPhotoDraft>((file) => {
        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(objectUrl);
        const id = `about-photo-${nextPhotoIdRef.current++}`;
        return {
          id,
          name: file.name || `Фото ${nextPhotoIdRef.current - 1}`,
          note: "Загружено локально до перезагрузки страницы",
          previewUrl: objectUrl,
          objectUrl,
          accent: "pearl",
        };
      });
      return {
        ...prev,
        photos: [...prev.photos, ...uploadedPhotos],
      };
    });
  }, []);

  const removeAboutPhoto = useCallback((photoId: string) => {
    setAboutDraft((prev) => {
      const target = prev.photos.find((photo) => photo.id === photoId);
      revokePhotoObjectUrl(target);
      return {
        ...prev,
        photos: prev.photos.filter((photo) => photo.id !== photoId),
      };
    });
  }, [revokePhotoObjectUrl]);

  const moveAboutPhoto = useCallback((photoId: string, direction: -1 | 1) => {
    setAboutDraft((prev) => {
      const index = prev.photos.findIndex((photo) => photo.id === photoId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.photos.length) {
        return prev;
      }
      const nextPhotos = [...prev.photos];
      const [moved] = nextPhotos.splice(index, 1);
      nextPhotos.splice(nextIndex, 0, moved);
      return { ...prev, photos: nextPhotos };
    });
  }, []);

  const resetAboutDraft = useCallback(() => {
    setAboutDraft((prev) => {
      for (const photo of prev.photos) {
        revokePhotoObjectUrl(photo);
      }
      return buildInitialAboutDraft();
    });
    nextPhotoIdRef.current = 4;
  }, [revokePhotoObjectUrl]);

  const addQuestion = useCallback(() => {
    const id = `question-${nextQuestionIdRef.current++}`;
    setQuestionsDraft((prev) => [
      ...prev,
      {
        id,
        question: "",
        answer: "",
        isEnabled: true,
        isExpandedByDefault: false,
      },
    ]);
    return id;
  }, []);

  const updateQuestion = useCallback((questionId: string, patch: Partial<AdminQuestionDraft>) => {
    setQuestionsDraft((prev) =>
      prev.map((item) => (item.id === questionId ? { ...item, ...patch } : item))
    );
  }, []);

  const moveQuestion = useCallback((questionId: string, direction: -1 | 1) => {
    setQuestionsDraft((prev) => {
      const index = prev.findIndex((item) => item.id === questionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestionsDraft((prev) => prev.filter((item) => item.id !== questionId));
  }, []);

  const resetQuestionsDraft = useCallback(() => {
    setQuestionsDraft(buildInitialQuestions());
    nextQuestionIdRef.current = 4;
  }, []);

  const aboutStats = useMemo(() => ({
    photosCount: aboutDraft.photos.length,
    leftLength: aboutDraft.leftText.trim().length,
    rightLength: aboutDraft.rightText.trim().length,
  }), [aboutDraft.photos.length, aboutDraft.leftText, aboutDraft.rightText]);

  const questionStats = useMemo(() => ({
    total: questionsDraft.length,
    enabled: questionsDraft.filter((item) => item.isEnabled).length,
    defaultOpen: questionsDraft.filter((item) => item.isExpandedByDefault).length,
  }), [questionsDraft]);

  return {
    aboutDraft,
    aboutStats,
    questionsDraft,
    questionStats,
    updateAboutField,
    addAboutPhotos,
    removeAboutPhoto,
    moveAboutPhoto,
    resetAboutDraft,
    addQuestion,
    updateQuestion,
    moveQuestion,
    deleteQuestion,
    resetQuestionsDraft,
  };
}
