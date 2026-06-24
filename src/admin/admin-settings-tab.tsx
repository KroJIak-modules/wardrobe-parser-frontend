import type { ChangeEvent, MouseEvent, RefObject } from "react";
import { useEffect, useState } from "react";
import { AdminSettingsAboutSection } from "./admin-settings-about-section";
import { AdminSettingsQuestionsSection } from "./admin-settings-questions-section";
import { AdminShowcaseMediaSection } from "./admin-showcase-media-section";
import { useAdminSettingsContentDrafts } from "./hooks/use-admin-settings-content-drafts";
import "./admin-settings-tab.css";

type CarouselItem = { id: number };
type SettingsSubtab = "home" | "about" | "questions";

type Props = {
  showcaseHeroImageId: number | null;
  heroInputRef: RefObject<HTMLInputElement | null>;
  showcaseSaving: boolean;
  onRemoveHeroImage: (event: MouseEvent<HTMLButtonElement>) => Promise<void>;
  onPickHeroImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  showcaseCarousel: CarouselItem[];
  setDraggingCarouselId: (id: number | null) => void;
  onReorderCarouselImage: (targetId: number) => Promise<void>;
  onRemoveCarouselImage: (imageId: number) => Promise<void>;
  carouselInputRef: RefObject<HTMLInputElement | null>;
  onPickCarouselImages: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

const SUBTAB_STORAGE_KEY = "admin-settings-subtab";

const SUBTAB_LABELS: Record<SettingsSubtab, string> = {
  home: "Главная",
  about: "Обо мне",
  questions: "Вопросы",
};

export function AdminSettingsTab({
  showcaseHeroImageId,
  heroInputRef,
  showcaseSaving,
  onRemoveHeroImage,
  onPickHeroImage,
  showcaseCarousel,
  setDraggingCarouselId,
  onReorderCarouselImage,
  onRemoveCarouselImage,
  carouselInputRef,
  onPickCarouselImages,
}: Props) {
  const [activeSubtab, setActiveSubtab] = useState<SettingsSubtab>(() => {
    if (typeof window === "undefined") {
      return "home";
    }
    const stored = window.sessionStorage.getItem(SUBTAB_STORAGE_KEY);
    return stored === "about" || stored === "questions" ? stored : "home";
  });
  const {
    aboutDraft,
    questionsDraft,
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
  } = useAdminSettingsContentDrafts();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SUBTAB_STORAGE_KEY, activeSubtab);
    }
  }, [activeSubtab]);

  return (
    <div className="admin-settings-shell">
      <section className="card admin-settings-section">
        <div className="tabs admin-settings-subtabs" role="tablist" aria-label="Разделы настроек">
          {(["home", "about", "questions"] as SettingsSubtab[]).map((subtab) => (
            <button
              key={subtab}
              type="button"
              role="tab"
              aria-selected={activeSubtab === subtab}
              className={activeSubtab === subtab ? "tab admin-settings-subtab tab--active" : "tab admin-settings-subtab"}
              onClick={() => setActiveSubtab(subtab)}
            >
              <span className="admin-settings-subtab__label">{SUBTAB_LABELS[subtab]}</span>
            </button>
          ))}
        </div>
      </section>

      {activeSubtab === "home" ? (
        <div className="admin-settings-pane">
          <section className="card admin-settings-panel admin-settings-panel--home">
            <div className="admin-settings-panel__head">
              <div>
                <h2>Медиа витрины</h2>
                <p className="muted">Добавляй hero отдельно от карусели: так проще держать главный акцент и промо-кадры независимо.</p>
              </div>
            </div>
            <AdminShowcaseMediaSection
              showcaseHeroImageId={showcaseHeroImageId}
              heroInputRef={heroInputRef}
              showcaseSaving={showcaseSaving}
              onRemoveHeroImage={onRemoveHeroImage}
              onPickHeroImage={onPickHeroImage}
              showcaseCarousel={showcaseCarousel}
              setDraggingCarouselId={setDraggingCarouselId}
              onReorderCarouselImage={onReorderCarouselImage}
              onRemoveCarouselImage={onRemoveCarouselImage}
              carouselInputRef={carouselInputRef}
              onPickCarouselImages={onPickCarouselImages}
            />
          </section>
        </div>
      ) : null}

      {activeSubtab === "about" ? (
        <AdminSettingsAboutSection
          draft={aboutDraft}
          onChangeField={updateAboutField}
          onAddPhotos={addAboutPhotos}
          onRemovePhoto={removeAboutPhoto}
          onMovePhoto={moveAboutPhoto}
          onReset={resetAboutDraft}
        />
      ) : null}

      {activeSubtab === "questions" ? (
        <AdminSettingsQuestionsSection
          questions={questionsDraft}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onMoveQuestion={moveQuestion}
          onDeleteQuestion={deleteQuestion}
          onReset={resetQuestionsDraft}
        />
      ) : null}
    </div>
  );
}
