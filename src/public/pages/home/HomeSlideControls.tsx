import { ChevronLeft, ChevronRight } from "lucide-react";
import { type CSSProperties } from "react";
import type { HomeSlideDTO } from "@/public/features/home/types";

const RAIL_GAP = 4;

type Props = {
  slides: HomeSlideDTO[];
  currentSlide: number;
  autoplayElapsed: number;
  progressStyle: CSSProperties;
  onSelect: (index: number) => void;
};

export default function HomeSlideControls({
  slides,
  currentSlide,
  autoplayElapsed,
  progressStyle,
  onSelect,
}: Props) {
  if (slides.length <= 1) return null;

  return (
    <>
      <p className="sr-only" aria-live="polite">
        Current slide {currentSlide + 1} / {slides.length}:{" "}
        {slides[currentSlide]?.title}
      </p>
      <button
        type="button"
        onClick={() => onSelect(currentSlide - 1)}
        aria-label="Previous album"
        className="home-slide-arrow home-slide-arrow-left"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onSelect(currentSlide + 1)}
        aria-label="Next album"
        className="home-slide-arrow home-slide-arrow-right"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="home-slide-index">
        <span className="home-slide-count">
          <b>{String(currentSlide + 1).padStart(2, "0")}</b>
          <i>/</i>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </span>
        <div className="home-slide-rail">
          <span
            className="home-slide-highlight"
            aria-hidden="true"
            style={{
              width: `calc(${100 / slides.length}% - ${(RAIL_GAP * (slides.length - 1)) / slides.length}px)`,
              left: `calc(${(currentSlide * 100) / slides.length}% + ${(currentSlide * RAIL_GAP) / slides.length}px)`,
            }}
          >
            <i
              key={`desktop-${currentSlide}-${autoplayElapsed}`}
              style={progressStyle}
            />
          </span>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Show ${slide.title}`}
              aria-current={index === currentSlide ? "true" : undefined}
              className={index === currentSlide ? "is-active" : undefined}
            >
              <span className="home-slide-label">{slide.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
