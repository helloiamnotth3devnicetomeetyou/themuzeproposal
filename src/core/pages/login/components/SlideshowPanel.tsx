"use client";

import Image from "next/image";
import { SLIDES } from "../constants";

interface SlideshowPanelProps {
  currentSlide: number;
}

export default function SlideshowPanel({ currentSlide }: SlideshowPanelProps) {
  return (
    <div className="hidden md:block md:w-[55%] relative overflow-hidden h-screen bg-[var(--color-static-black)]">
      {SLIDES.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={index === 0}
              className={`object-cover transition-transform duration-[4500ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
