"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GALLERY_IMAGES } from "@/data/site";
import { Lightbox } from "@/components/lightbox";
import { Icon } from "@/components/icons";
import type { Photo } from "@/lib/github-gallery";

const FALLBACK: Photo[] = GALLERY_IMAGES.map((img) => {
  const base = img.src.replace(/\.jpg$/, "");
  return {
    src: img.src,
    alt: img.alt,
    srcSet: `${base}-1280.jpg 1280w, ${base}-640.jpg 640w`,
  };
});

const INITIAL_RATIOS: Record<string, number> = {};
for (const img of GALLERY_IMAGES) {
  INITIAL_RATIOS[img.src] = img.width / img.height;
}

const MAX_PER_ROW = 5;
const MAX_ROW_HEIGHT = 640;

const signature = (photos: Photo[]) => photos.map((p) => p.src).join("\n");

type Row = { photos: { photo: Photo; index: number }[]; height: number };

function rowHeight(
  items: { photo: Photo; index: number }[],
  ratios: Record<string, number>,
  width: number,
  gap: number,
): number {
  if (items.length === 0) return 0;
  const sumR = items.reduce((s, it) => s + (ratios[it.photo.src] ?? 1.5), 0);
  return (width - gap * (items.length - 1)) / sumR;
}

function buildRows(
  photos: Photo[],
  ratios: Record<string, number>,
  width: number,
): Row[] {
  if (width <= 0 || photos.length === 0) return [];
  const gap = width < 720 ? 16 : 32;
  const minRowHeight = width < 720 ? 200 : 380;
  const rows: Row[] = [];
  let current: { photo: Photo; index: number }[] = [];
  let sumR = 0;

  const flush = () => {
    if (current.length === 0) return;
    rows.push({ photos: current, height: rowHeight(current, ratios, width, gap) });
    current = [];
    sumR = 0;
  };

  photos.forEach((photo, index) => {
    const ratio = ratios[photo.src] ?? 1.5;
    const projected = (width - gap * current.length) / (sumR + ratio);
    if (current.length >= 2 && projected < minRowHeight) flush();
    current.push({ photo, index });
    sumR += ratio;
    if (current.length >= MAX_PER_ROW) flush();
  });
  flush();

  let guard = 0;
  while (
    rows.length >= 2 &&
    guard < rows.length &&
    rows[rows.length - 1].height > MAX_ROW_HEIGHT &&
    rows[rows.length - 2].photos.length >= 4
  ) {
    const last = rows[rows.length - 1];
    const prev = rows[rows.length - 2];
    last.photos.unshift(prev.photos.pop()!);
    last.height = rowHeight(last.photos, ratios, width, gap);
    prev.height = rowHeight(prev.photos, ratios, width, gap);
    guard++;
  }

  return rows;
}

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>(FALLBACK);
  const [polling, setPolling] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>(INITIAL_RATIOS);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  const fetchGallery = useCallback(async (): Promise<Photo[] | null> => {
    try {
      const r = await fetch("/gallery.json", { cache: "no-store" });
      if (!r.ok) return null;
      const data = await r.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGallery().then((data) => {
      if (!cancelled && data) setPhotos(data);
      if (!cancelled) setPolling(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchGallery]);

  useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      const data = await fetchGallery();
      if (data) {
        setPhotos((prev) => (signature(data) !== signature(prev) ? data : prev));
      }
    }, 15000);
    return () => clearInterval(id);
  }, [polling, fetchGallery]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const loadingRatios = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const loading = loadingRatios.current;
    for (const photo of photos) {
      if (ratios[photo.src] || loading.has(photo.src)) continue;
      loading.add(photo.src);
      const img = new window.Image();
      img.onload = () => {
        if (cancelled) return;
        const r = img.naturalWidth / img.naturalHeight || 1.5;
        setRatios((prev) => (prev[photo.src] === r ? prev : { ...prev, [photo.src]: r }));
      };
      img.onerror = () => {
        if (!cancelled) setRatios((prev) => ({ ...prev, [photo.src]: 1.5 }));
      };
      img.src = photo.src;
    }
    return () => {
      cancelled = true;
    };
  }, [photos, ratios]);

  const rows = useMemo(() => buildRows(photos, ratios, width), [photos, ratios, width]);

  return (
    <main className="flex flex-col items-center bg-black pt-24">
      <h1 className="sr-only">Angelica Dira — Fashion Model Portfolio</h1>
      <section className="flex w-full flex-col items-center justify-start gap-0 px-4 pb-16 pt-10 sm:px-6">
        <div
          ref={containerRef}
          className="flex w-full flex-col gap-[32px] max-md:gap-[16px]"
        >
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-[32px] max-md:gap-[16px]">
              {row.photos.map(({ photo, index }) => {
                const ratio = ratios[photo.src] ?? 1.5;
                const width = Math.round(ratio * row.height);
                return (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setLightbox(index)}
                    aria-label={`Open ${photo.alt}`}
                    className="relative block shrink-0 cursor-zoom-in overflow-hidden p-0 text-left"
                    style={{
                      borderRadius: 4,
                      flexGrow: ratio,
                      flexShrink: ratio,
                      flexBasis: 0,
                      height: row.height,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      srcSet={photo.srcSet}
                      sizes={`${width}px`}
                      alt={photo.alt}
                      className="h-full w-full object-cover"
                      loading={index < 6 ? "eager" : "lazy"}
                      fetchPriority={index < 6 ? "high" : "auto"}
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}

      <Link
        href="/admin"
        aria-label="Upload photos"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Icon name="add" className="h-7 w-7" />
      </Link>
    </main>
  );
}
