export type ShowcaseViewportKey = "desktop" | "mobile";
export type ShowcaseMediaKind = "image" | "video";

export type ShowcaseMediaAsset = {
  id: number;
  mimeType: string;
  mediaKind: ShowcaseMediaKind;
  byteSize: number;
  widthPx: number | null;
  heightPx: number | null;
};

export type ShowcaseViewportState = {
  heroAsset: ShowcaseMediaAsset | null;
  carouselAssets: ShowcaseMediaAsset[];
};

export type ShowcaseMediaState = Record<ShowcaseViewportKey, ShowcaseViewportState>;
