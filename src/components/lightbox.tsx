"use client";

import { useCallback, useEffect } from "react";
import { Icon } from "@/components/icons";
import type { Photo } from "@/lib/github-gallery";

export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const count = photos.length;
  const photo = photos[index];

  const prev = useCallback(
    () => onNavigate((index - 1 + count) % count),
    [index, count, onNavigate],
  );
  const next = useCallback(
    () => onNavigate((index + 1) % count),
    [index, count, onNavigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [prev, next, onClose]);

  if (!photo) return null;

  return (
    <div
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
    >
      <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="max-h-[80vh] max-w-[92vw] select-none object-contain"
        />
        {photo.caption && (
          <p className="max-w-[80vw] text-center font-sans text-[14px] leading-[20px] text-zinc-300">
            {photo.caption}
          </p>
        )}
      </div>
      <p className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 font-sans text-[12px] uppercase tracking-[0.7px] text-zinc-500">
        {index + 1} / {count}
      </p>
      <button
        type="button"
        aria-label="Previous photo"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30"
      >
        <Icon name="chevronLeft" className="h-6 w-6" />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-6 bottom-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30"
      >
        <Icon name="chevronRight" className="h-6 w-6" />
      </button>
      <button
        type="button"
        aria-label="Close preview"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30"
      >
        <Icon name="close" className="h-5 w-5" />
      </button>
    </div>
  );
}
