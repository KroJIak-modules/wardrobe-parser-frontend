import type { ChangeEvent, MouseEvent, RefObject } from "react";
import { useEffect, useState } from "react";
import { AdminSettingsAboutSection } from "./admin-settings-about-section";
import { AdminSettingsQuestionsSection } from "./admin-settings-questions-section";
import { AdminShowcaseMediaSection } from "./admin-showcase-media-section";
import type { ShowcaseMediaState, ShowcaseViewportKey } from "./admin-showcase-media-types";
import { useAdminSettingsContentDrafts } from "./hooks/use-admin-settings-content-drafts";
import "./admin-settings-tab.css";

type SettingsSubtab = "home" | "about" | "questions";

type Props = {
  showcaseState: ShowcaseMediaState;
  showcaseSaving: boolean;
  heroInputRefs: Record<ShowcaseViewportKey, RefObject<HTMLInputElement | null>>;
  carouselInputRefs: Record<ShowcaseViewportKey, RefObject<HTMLInputElement | null>>;
  onRemoveHeroAsset: (viewport: ShowcaseViewportKey, event?: MouseEvent<HTMLButtonElement>) => Promise<void>;
  onPickHeroAsset: (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCommitCarouselOrder: (viewport: ShowcaseViewportKey, orderedAssetIds: number[]) => Promise<void>;
  onRemoveCarouselAsset: (viewport: ShowcaseViewportKey, assetId: number) => Promise<void>;
  onPickCarouselAssets: (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

const SUBTAB_STORAGE_KEY = "admin-settings-subtab";

const SUBTAB_LABELS: Record<SettingsSubtab, string> = {
  home: "Главная",
  about: "Обо мне",
  questions: "Вопросы",
};

export function AdminSettingsTab({
  showcaseState,
  showcaseSaving,
  heroInputRefs,
  carouselInputRefs,
  onRemoveHeroAsset,
  onPickHeroAsset,
  onCommitCarouselOrder,
  onRemoveCarouselAsset,
  onPickCarouselAssets,
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
                <p className="muted">Отдельно собирай набор для компьютерной и мобильной версии. Один блок отвечает за заставку, второй за порядок медиа в карусели.</p>
              </div>
            </div>
            <AdminShowcaseMediaSection
              showcaseState={showcaseState}
              showcaseSaving={showcaseSaving}
              heroInputRefs={heroInputRefs}
              carouselInputRefs={carouselInputRefs}
              onRemoveHeroAsset={onRemoveHeroAsset}
              onPickHeroAsset={onPickHeroAsset}
              onCommitCarouselOrder={onCommitCarouselOrder}
              onRemoveCarouselAsset={onRemoveCarouselAsset}
              onPickCarouselAssets={onPickCarouselAssets}
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
