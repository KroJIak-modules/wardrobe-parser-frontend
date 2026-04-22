import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { toImageGatewayUrl } from "../shared/live-data-context";
import { IconClose, IconPlus } from "../shared/mono-icons";

type CarouselItem = { id: number };

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
  return (
    <div className="showcase-media-settings">
      <div className="showcase-media-block">
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
          {showcaseHeroImageId ? (
            <>
              <img src={toImageGatewayUrl(showcaseHeroImageId, { w: 960, h: 420, q: 75 }) || ""} alt="Заставка" loading="lazy" />
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
        <p className="muted">Карусель ({showcaseCarousel.length}/20)</p>
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
              <img src={toImageGatewayUrl(item.id, { w: 480, h: 300, q: 72 }) || ""} alt="Слайд карусели" loading="lazy" />
              <button type="button" className="showcase-remove-btn" onClick={() => void onRemoveCarouselImage(item.id)}>
                <IconClose className="icon-svg icon-svg--sm" />
              </button>
            </div>
          ))}
          {showcaseCarousel.length < 20 ? (
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
