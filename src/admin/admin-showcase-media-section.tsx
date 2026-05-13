import { useEffect, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { IconClose, IconPlus } from "../shared/mono-icons";
import { SHOWCASE_CAROUSEL_LIMIT } from "./admin-showcase-constants";

type CarouselItem = { id: number };

function toShowcaseImageUrl(imageId: number): string {
  return `/api/v1/showcase/carousel/${imageId}/image`;
}

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

export function AdminShowcaseMediaSection({
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
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  useEffect(() => {
    setHeroImageFailed(false);
  }, [showcaseHeroImageId]);

  return (
    <div className="showcase-media-settings">
      <div className="showcase-media-block">
        <h3 className="settings-subtitle">Заставка на главном экране</h3>
        <div
          className="showcase-hero-tile"
          onClick={() => heroInputRef.current?.click()}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              heroInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-disabled={showcaseSaving}
        >
          {showcaseHeroImageId && !heroImageFailed ? (
            <>
              <img
                src={"/api/v1/showcase/hero/image"}
                alt="Заставка витрины"
                loading="lazy"
                onError={() => setHeroImageFailed(true)}
              />
              <button type="button" className="showcase-remove-btn" onClick={(event) => void onRemoveHeroImage(event)}>
                <IconClose className="icon-svg icon-svg--sm" />
              </button>
            </>
          ) : (
            <IconPlus className="icon-svg icon-svg--sm" />
          )}
        </div>
        <input ref={heroInputRef} type="file" accept="image/*" className="input-hidden" onChange={(event) => void onPickHeroImage(event)} />
      </div>

      <div className="showcase-media-block">
        <h3 className="settings-subtitle">{`Карусель (${showcaseCarousel.length}/${SHOWCASE_CAROUSEL_LIMIT})`}</h3>
        <div className="showcase-carousel-grid">
          {showcaseCarousel.map((item) => (
            <div
              key={item.id}
              className="showcase-carousel-item"
              draggable
              onDragStart={() => setDraggingCarouselId(item.id)}
              onDragEnd={() => setDraggingCarouselId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void onReorderCarouselImage(item.id)}
            >
              <img src={toShowcaseImageUrl(item.id)} alt="Слайд карусели" loading="lazy" />
              <button type="button" className="showcase-remove-btn" onClick={() => void onRemoveCarouselImage(item.id)}>
                <IconClose className="icon-svg icon-svg--sm" />
              </button>
            </div>
          ))}
          {showcaseCarousel.length < SHOWCASE_CAROUSEL_LIMIT ? (
            <button type="button" className="showcase-carousel-add" onClick={() => carouselInputRef.current?.click()} disabled={showcaseSaving}>
              <IconPlus className="icon-svg icon-svg--sm" />
            </button>
          ) : null}
        </div>
        <input
          ref={carouselInputRef}
          type="file"
          accept="image/*"
          multiple
          className="input-hidden"
          onChange={(event) => void onPickCarouselImages(event)}
        />
      </div>
    </div>
  );
}
