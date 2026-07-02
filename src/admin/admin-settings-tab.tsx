import type { ChangeEvent, MouseEvent, RefObject } from "react";
import { useEffect, useState } from "react";
import { AdminSettingsAboutSection } from "./admin-settings-about-section";
import { AdminSettingsNotificationSection } from "./admin-settings-notification-section";
import { AdminSettingsQuestionsSection } from "./admin-settings-questions-section";
import { AdminShowcaseMediaSection } from "./admin-showcase-media-section";
import type { ShowcaseMediaState, ShowcaseViewportKey } from "./admin-showcase-media-types";
import { useAdminSiteContent } from "./hooks/use-admin-site-content";
import "./admin-settings-tab.css";

type SettingsSubtab = "home" | "about" | "questions" | "notifications";

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
  onToast: (message: string, type?: "success" | "error") => void;
};

const SUBTAB_STORAGE_KEY = "admin-settings-subtab";

const SUBTAB_LABELS: Record<SettingsSubtab, string> = {
  home: "Главная",
  about: "Обо мне",
  questions: "Вопросы",
  notifications: "Уведомления",
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
  onToast,
}: Props) {
  const [activeSubtab, setActiveSubtab] = useState<SettingsSubtab>(() => {
    if (typeof window === "undefined") {
      return "home";
    }
    const stored = window.sessionStorage.getItem(SUBTAB_STORAGE_KEY);
    return stored === "about" || stored === "questions" || stored === "notifications" ? stored : "home";
  });
  const {
    loading,
    aboutDraft,
    savingAbout,
    uploadingPhoto,
    questionsDraft,
    savingQuestions,
    notificationDraft,
    notificationItems,
    notificationDirty,
    savingNotification,
    uploadingNotificationImage,
    notificationActionId,
    updateAboutText,
    addAboutPhotos,
    removeAboutPhoto,
    moveAboutPhoto,
    addQuestion,
    updateQuestion,
    moveQuestion,
    deleteQuestion,
    updateNotification,
    uploadNotificationImage,
    saveNotification,
    resetNotificationSeenState,
    deleteNotification,
  } = useAdminSiteContent({ onToast });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SUBTAB_STORAGE_KEY, activeSubtab);
    }
  }, [activeSubtab]);

  return (
    <div className="admin-settings-shell">
      <section className="card admin-settings-section">
        <div className="tabs admin-settings-subtabs" role="tablist" aria-label="Разделы настроек">
          {(["home", "about", "questions", "notifications"] as SettingsSubtab[]).map((subtab) => (
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
          loading={loading}
          saving={savingAbout}
          uploadingPhoto={uploadingPhoto}
          onChangeText={updateAboutText}
          onAddPhotos={addAboutPhotos}
          onRemovePhoto={removeAboutPhoto}
          onMovePhoto={moveAboutPhoto}
        />
      ) : null}

      {activeSubtab === "questions" ? (
        <AdminSettingsQuestionsSection
          questions={questionsDraft}
          loading={loading}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onMoveQuestion={moveQuestion}
          onDeleteQuestion={deleteQuestion}
        />
      ) : null}

      {activeSubtab === "notifications" ? (
        <AdminSettingsNotificationSection
          draft={notificationDraft}
          items={notificationItems}
          loading={loading}
          dirty={notificationDirty}
          saving={savingNotification}
          uploadingImage={uploadingNotificationImage}
          actionId={notificationActionId}
          onChange={updateNotification}
          onUploadImage={uploadNotificationImage}
          onCreate={saveNotification}
          onResetSeenState={resetNotificationSeenState}
          onDelete={deleteNotification}
        />
      ) : null}
    </div>
  );
}
