"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  file_id: string | null;
  label: string;
}

interface PreviewArgs {
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

export function Preview({ input }: { input: Record<string, unknown> }) {
  const { slides = [], caption = "", hashtags = [] } = input as unknown as PreviewArgs;

  const [current, setCurrent] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const validSlides = slides.filter((s) => s.file_id);
  const isCarousel = validSlides.length > 1;
  const currentSlide = validSlides[current];

  const prev = () => setCurrent((i) => Math.max(0, i - 1));
  const next = () => setCurrent((i) => Math.min(validSlides.length - 1, i + 1));

  return (
    <div className="my-2 w-full max-w-sm rounded-2xl border bg-background shadow-sm overflow-hidden">
      {/* Image area */}
      {validSlides.length > 0 && (
        <div className="relative bg-muted aspect-square w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentSlide.file_id}
            src={`/api/files/${currentSlide.file_id}/content`}
            alt={currentSlide.label}
            className="h-full w-full object-cover"
          />

          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
            {currentSlide.label}
          </div>

          {isCarousel && (
            <>
              <button
                type="button"
                onClick={prev}
                disabled={current === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white disabled:opacity-20 hover:bg-black/60 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={current === validSlides.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white disabled:opacity-20 hover:bg-black/60 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRightIcon className="size-4" />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {validSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "size-1.5 rounded-full transition-colors",
                      i === current ? "bg-white" : "bg-white/40",
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Caption + hashtags */}
      <div className="px-4 py-3 space-y-2">
        {caption && (
          <div className="text-sm text-foreground leading-relaxed">
            <p className={cn(!captionExpanded && "line-clamp-3")}>{caption}</p>
            {caption.length > 120 && (
              <button
                type="button"
                onClick={() => setCaptionExpanded((v) => !v)}
                className="mt-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {captionExpanded ? "收起" : "展开"}
              </button>
            )}
          </div>
        )}

        {hashtags.length > 0 && (
          <p className="text-xs text-sky-600 dark:text-sky-400 leading-relaxed">
            {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}
