import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import type { PricingSettings, ShowcaseImageItem } from "../admin-types";

type UseAdminShowcaseParams = {
  pricingSettings: PricingSettings | null;
  uploadShowcaseImage: (file: File) => Promise<{ ok: boolean; message: string; imageAssetId?: number }>;
  updateShowcaseMediaSettings: (patch: {
    showcase_hero_image_asset_id?: number | null;
    showcase_carousel_image_asset_ids?: number[];
  }) => Promise<{ ok: boolean; message: string }>;
  pushToast: (message: string) => void;
};

export function useAdminShowcase(params: UseAdminShowcaseParams) {
  const { pricingSettings, uploadShowcaseImage, updateShowcaseMediaSettings, pushToast } = params;

  const [showcaseHeroImageId, setShowcaseHeroImageId] = useState<number | null>(null);
  const [showcaseCarousel, setShowcaseCarousel] = useState<ShowcaseImageItem[]>([]);
  const [showcaseSaving, setShowcaseSaving] = useState<boolean>(false);
  const [draggingCarouselId, setDraggingCarouselId] = useState<number | null>(null);

  useEffect(() => {
    if (!pricingSettings) {
      return;
    }
    const heroRaw = Number(pricingSettings.showcase_hero_image_asset_id);
    setShowcaseHeroImageId(Number.isFinite(heroRaw) && heroRaw > 0 ? heroRaw : null);
    const ids = Array.isArray(pricingSettings.showcase_carousel_image_asset_ids)
      ? pricingSettings.showcase_carousel_image_asset_ids
      : [];
    const normalized = ids
      .map((item) => Number(item))
      .filter((item, index, arr) => Number.isFinite(item) && item > 0 && arr.indexOf(item) === index)
      .slice(0, 20)
      .map((id) => ({ id }));
    setShowcaseCarousel(normalized);
  }, [pricingSettings?.showcase_hero_image_asset_id, pricingSettings?.showcase_carousel_image_asset_ids]);

  const saveShowcaseSettings = async (patch: Partial<PricingSettings>) => {
    setShowcaseSaving(true);
    try {
      const result = await updateShowcaseMediaSettings({
        showcase_hero_image_asset_id: patch.showcase_hero_image_asset_id,
        showcase_carousel_image_asset_ids: patch.showcase_carousel_image_asset_ids,
      });
      if (!result.ok) {
        pushToast(result.message);
        return false;
      }
      return true;
    } finally {
      setShowcaseSaving(false);
    }
  };

  const onPickHeroImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) {
      return;
    }
    const uploaded = await uploadShowcaseImage(file);
    if (!uploaded.ok || !uploaded.imageAssetId) {
      pushToast(uploaded.message || "Не удалось загрузить hero-картинку");
      return;
    }
    if (await saveShowcaseSettings({ showcase_hero_image_asset_id: uploaded.imageAssetId })) {
      setShowcaseHeroImageId(uploaded.imageAssetId);
    }
  };

  const onRemoveHeroImage = async (event?: MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (await saveShowcaseSettings({ showcase_hero_image_asset_id: null })) {
      setShowcaseHeroImageId(null);
    }
  };

  const onPickCarouselImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files] : [];
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    if (showcaseCarousel.length >= 20) {
      pushToast("Максимум 20 изображений в карусели");
      return;
    }
    const remaining = Math.max(0, 20 - showcaseCarousel.length);
    const toUpload = files.slice(0, remaining);
    const uploadedIds: number[] = [];
    for (const file of toUpload) {
      const uploaded = await uploadShowcaseImage(file);
      if (!uploaded.ok || !uploaded.imageAssetId) {
        pushToast(uploaded.message || "Не удалось загрузить изображение карусели");
        continue;
      }
      uploadedIds.push(uploaded.imageAssetId);
    }
    if (uploadedIds.length === 0) {
      return;
    }
    const next = [...showcaseCarousel.map((item) => item.id), ...uploadedIds].slice(0, 20);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((id) => ({ id })));
    }
  };

  const onRemoveCarouselImage = async (id: number) => {
    const next = showcaseCarousel.map((item) => item.id).filter((item) => item !== id);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((item) => ({ id: item })));
    }
  };

  const onDropCarouselReorder = async (targetId: number) => {
    if (!draggingCarouselId || draggingCarouselId === targetId) {
      return;
    }
    const ids = showcaseCarousel.map((item) => item.id);
    const fromIndex = ids.indexOf(draggingCarouselId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    if (await saveShowcaseSettings({ showcase_carousel_image_asset_ids: next })) {
      setShowcaseCarousel(next.map((item) => ({ id: item })));
    }
    setDraggingCarouselId(null);
  };

  const onStartCarouselDrag = (id: number) => {
    setDraggingCarouselId(id);
  };

  const onEndCarouselDrag = () => {
    setDraggingCarouselId(null);
  };

  return {
    showcaseHeroImageId,
    setShowcaseHeroImageId,
    showcaseCarousel,
    setShowcaseCarousel,
    showcaseSaving,
    onPickHeroImage,
    onRemoveHeroImage,
    onPickCarouselImages,
    onRemoveCarouselImage,
    onDropCarouselReorder,
    onStartCarouselDrag,
    onEndCarouselDrag,
  };
}
