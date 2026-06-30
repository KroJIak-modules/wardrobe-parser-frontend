import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { API_BASE, authFetch } from "../auth-fetch";
import { SHOWCASE_CAROUSEL_LIMIT } from "../admin-showcase-constants";
import type { ShowcaseMediaAsset, ShowcaseMediaState, ShowcaseViewportKey, ShowcaseViewportState } from "../admin-showcase-media-types";

type UseAdminShowcaseParams = {
  enabled: boolean;
  pushToast: (message: string) => void;
};

type ShowcaseAssetPayload = {
  id?: number;
  mime_type?: string;
  media_kind?: "image" | "video";
  byte_size?: number;
  width_px?: number | null;
  height_px?: number | null;
};

type ShowcaseStatePayload = {
  desktop?: {
    hero_asset?: ShowcaseAssetPayload | null;
    carousel_assets?: ShowcaseAssetPayload[];
  };
  mobile?: {
    hero_asset?: ShowcaseAssetPayload | null;
    carousel_assets?: ShowcaseAssetPayload[];
  };
  carousel_limit?: number;
};

function emptyViewportState(): ShowcaseViewportState {
  return {
    heroAsset: null,
    carouselAssets: [],
  };
}

const EMPTY_SHOWCASE_STATE: ShowcaseMediaState = {
  desktop: emptyViewportState(),
  mobile: emptyViewportState(),
};

function normalizeAsset(payload: ShowcaseAssetPayload | null | undefined): ShowcaseMediaAsset | null {
  const id = Number(payload?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const mediaKind = payload?.media_kind === "video" ? "video" : "image";
  return {
    id,
    mimeType: String(payload?.mime_type || "").trim() || (mediaKind === "video" ? "video/mp4" : "image/jpeg"),
    mediaKind,
    byteSize: Math.max(0, Number(payload?.byte_size || 0)),
    widthPx: payload?.width_px == null ? null : Math.max(1, Number(payload.width_px)),
    heightPx: payload?.height_px == null ? null : Math.max(1, Number(payload.height_px)),
  };
}

function normalizeAssetList(payload: ShowcaseAssetPayload[] | undefined): ShowcaseMediaAsset[] {
  const normalized: ShowcaseMediaAsset[] = [];
  const seen = new Set<number>();
  for (const item of payload || []) {
    const asset = normalizeAsset(item);
    if (!asset || seen.has(asset.id)) {
      continue;
    }
    seen.add(asset.id);
    normalized.push(asset);
  }
  return normalized.slice(0, SHOWCASE_CAROUSEL_LIMIT);
}

function normalizeState(payload: ShowcaseStatePayload | null | undefined): ShowcaseMediaState {
  return {
    desktop: {
      heroAsset: normalizeAsset(payload?.desktop?.hero_asset),
      carouselAssets: normalizeAssetList(payload?.desktop?.carousel_assets),
    },
    mobile: {
      heroAsset: normalizeAsset(payload?.mobile?.hero_asset),
      carouselAssets: normalizeAssetList(payload?.mobile?.carousel_assets),
    },
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => null) as { detail?: string } | null;
  return String(payload?.detail || "").trim() || fallback;
}

export function useAdminShowcase(params: UseAdminShowcaseParams) {
  const { enabled, pushToast } = params;

  const [showcaseState, setShowcaseState] = useState<ShowcaseMediaState>(EMPTY_SHOWCASE_STATE);
  const [showcaseSaving, setShowcaseSaving] = useState<boolean>(false);

  const desktopHeroInputRef = useRef<HTMLInputElement | null>(null);
  const mobileHeroInputRef = useRef<HTMLInputElement | null>(null);
  const desktopCarouselInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCarouselInputRef = useRef<HTMLInputElement | null>(null);

  const heroInputRefs = {
    desktop: desktopHeroInputRef,
    mobile: mobileHeroInputRef,
  } as const;
  const carouselInputRefs = {
    desktop: desktopCarouselInputRef,
    mobile: mobileCarouselInputRef,
  } as const;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const load = async () => {
      try {
        const response = await authFetch(`${API_BASE}/showcase/state`);
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, `Не удалось загрузить медиа витрины (${response.status})`));
        }
        const payload = await response.json() as ShowcaseStatePayload;
        setShowcaseState(normalizeState(payload));
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Не удалось загрузить медиа витрины");
      }
    };
    void load();
    const handleRefresh = () => {
      void load();
    };
    window.addEventListener("admin:settings-transfer-applied", handleRefresh);
    return () => {
      window.removeEventListener("admin:settings-transfer-applied", handleRefresh);
    };
  }, [enabled, pushToast]);

  const saveShowcaseState = async (nextState: ShowcaseMediaState): Promise<ShowcaseMediaState | null> => {
    setShowcaseSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/showcase/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktop: {
            hero_asset_id: nextState.desktop.heroAsset?.id ?? null,
            carousel_asset_ids: nextState.desktop.carouselAssets.map((item) => item.id),
          },
          mobile: {
            hero_asset_id: nextState.mobile.heroAsset?.id ?? null,
            carousel_asset_ids: nextState.mobile.carouselAssets.map((item) => item.id),
          },
        }),
      });
      if (!response.ok) {
        pushToast(await readErrorMessage(response, `Не удалось сохранить медиа витрины (${response.status})`));
        return null;
      }
      const payload = await response.json() as ShowcaseStatePayload;
      const normalized = normalizeState(payload);
      setShowcaseState(normalized);
      return normalized;
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось сохранить медиа витрины");
      return null;
    } finally {
      setShowcaseSaving(false);
    }
  };

  const uploadAsset = async (file: File): Promise<ShowcaseMediaAsset | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await authFetch(`${API_BASE}/showcase/media/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        pushToast(await readErrorMessage(response, `Не удалось загрузить файл (${response.status})`));
        return null;
      }
      const payload = await response.json() as { asset?: ShowcaseAssetPayload | null };
      return normalizeAsset(payload.asset);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Не удалось загрузить файл");
      return null;
    }
  };

  const onPickHeroAsset = async (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => {
    if (showcaseSaving) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) {
      return;
    }
    const uploadedAsset = await uploadAsset(file);
    if (!uploadedAsset) {
      return;
    }
    await saveShowcaseState({
      ...showcaseState,
      [viewport]: {
        ...showcaseState[viewport],
        heroAsset: uploadedAsset,
      },
    });
  };

  const onRemoveHeroAsset = async (viewport: ShowcaseViewportKey, event?: MouseEvent<HTMLButtonElement>) => {
    if (showcaseSaving) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    await saveShowcaseState({
      ...showcaseState,
      [viewport]: {
        ...showcaseState[viewport],
        heroAsset: null,
      },
    });
  };

  const onPickCarouselAssets = async (viewport: ShowcaseViewportKey, event: ChangeEvent<HTMLInputElement>) => {
    if (showcaseSaving) {
      event.target.value = "";
      return;
    }
    const files = event.target.files ? [...event.target.files] : [];
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    const existingAssets = showcaseState[viewport].carouselAssets;
    if (existingAssets.length >= SHOWCASE_CAROUSEL_LIMIT) {
      pushToast(`В карусели можно хранить максимум ${SHOWCASE_CAROUSEL_LIMIT} медиафайлов`);
      return;
    }
    const remainingSlots = SHOWCASE_CAROUSEL_LIMIT - existingAssets.length;
    const uploadQueue = files.slice(0, remainingSlots);
    const results = await Promise.allSettled(uploadQueue.map((file) => uploadAsset(file)));
    const uploadedAssets = results
      .map((result) => result.status === "fulfilled" ? result.value : null)
      .filter((item): item is ShowcaseMediaAsset => item !== null);
    if (uploadedAssets.length === 0) {
      return;
    }
    await saveShowcaseState({
      ...showcaseState,
      [viewport]: {
        ...showcaseState[viewport],
        carouselAssets: [...existingAssets, ...uploadedAssets].slice(0, SHOWCASE_CAROUSEL_LIMIT),
      },
    });
  };

  const onRemoveCarouselAsset = async (viewport: ShowcaseViewportKey, assetId: number) => {
    if (showcaseSaving) {
      return;
    }
    await saveShowcaseState({
      ...showcaseState,
      [viewport]: {
        ...showcaseState[viewport],
        carouselAssets: showcaseState[viewport].carouselAssets.filter((item) => item.id !== assetId),
      },
    });
  };

  const onCommitCarouselOrder = async (viewport: ShowcaseViewportKey, orderedAssetIds: number[]) => {
    if (showcaseSaving) {
      return;
    }
    const currentAssets = showcaseState[viewport].carouselAssets;
    if (orderedAssetIds.length !== currentAssets.length) {
      return;
    }
    if (orderedAssetIds.every((assetId, index) => currentAssets[index]?.id === assetId)) {
      return;
    }
    const assetsById = new Map(currentAssets.map((item) => [item.id, item]));
    const nextAssets = orderedAssetIds
      .map((assetId) => assetsById.get(assetId) || null)
      .filter((item): item is ShowcaseMediaAsset => item !== null);
    if (nextAssets.length !== currentAssets.length) {
      return;
    }
    await saveShowcaseState({
      ...showcaseState,
      [viewport]: {
        ...showcaseState[viewport],
        carouselAssets: nextAssets,
      },
    });
  };

  return {
    showcaseState,
    showcaseSaving,
    heroInputRefs,
    carouselInputRefs,
    onPickHeroAsset,
    onRemoveHeroAsset,
    onPickCarouselAssets,
    onRemoveCarouselAsset,
    onCommitCarouselOrder,
  };
}
