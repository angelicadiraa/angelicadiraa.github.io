"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { SiteInfoEditor } from "@/components/site-info-editor";
import { unlockAdminToken } from "@/lib/admin-crypto";
import {
  commitBatch,
  fileToBase64,
  galleryFilePath,
  loadManifest,
  manifestBase64,
  slugify,
  validateToken,
  type Photo,
} from "@/lib/github-gallery";
import { compressImageSizes } from "@/lib/image-compress";

const TOKEN_KEY = "angelica_upload_token";
const UPLOAD_SIZES = [2400, 1280, 640];

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [user, setUser] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [draft, setDraft] = useState<Photo[]>([]);
  const [dirty, setDirty] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [tick, setTick] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<Record<string, string>>({});
  const busyRef = useRef(false);
  const lastEditRef = useRef(0);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      void login(saved);
    }
    return () => {
      for (const url of Object.values(previewsRef.current)) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      void (async () => {
        if (busyRef.current) return;
        const started = lastEditRef.current;
        try {
          const m = await loadManifest(token);
          if (started !== lastEditRef.current) return;
          setPhotos(m);
          if (!dirtyRef.current) setDraft(m);
          setTick((t) => t + 1);
        } catch {
          /* keep current state */
        }
      })();
    }, 20000);
    return () => clearInterval(id);
  }, [authed, token]);

  const login = useCallback(async (tok: string) => {
    setChecking(true);
    setStatus("");
    try {
      const me = await validateToken(tok);
      setUser(me);
      setAuthed(true);
      localStorage.setItem(TOKEN_KEY, tok);
      const m = await loadManifest(tok);
      setPhotos(m);
      setDraft(m);
      setStatus("");
    } catch {
      setAuthed(false);
      localStorage.removeItem(TOKEN_KEY);
      setStatus("Session expired. Enter the password again.");
    } finally {
      setChecking(false);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setChecking(true);
    setStatus("Checking...");
    try {
      const tok = await unlockAdminToken(pin.trim());
      setToken(tok);
      await login(tok);
    } catch {
      setStatus("Wrong password. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const markDirty = () => {
    dirtyRef.current = true;
    setDirty(true);
  };

  const processFiles = async (files: File[]) => {
    if (!authed || files.length === 0) return;
    setBusy(true);
    busyRef.current = true;
    setStatus(`Compressing ${files.length} photo(s)...`);
    try {
      const base = dirtyRef.current ? draft : photos;
      const used = new Set(base.map((p) => p.src.split("/").pop() as string));
      const added: Photo[] = [];
      const blobs: Record<string, string> = {};
      const batch: { path: string; content: string }[] = [];
      const skipped: string[] = [];
      for (const file of files) {
        try {
          let name = slugify(file.name) + ".jpg";
          let i = 1;
          while (used.has(name)) {
            name = `${slugify(file.name)}-${i}.jpg`;
            i++;
          }
          used.add(name);
          const stem = name.replace(/\.jpg$/, "");
          const variants = await compressImageSizes(file, UPLOAD_SIZES);
          const filenames = UPLOAD_SIZES.map((s) =>
            s === 2400 ? name : `${stem}-${s}.jpg`,
          );
          for (let k = 0; k < variants.length; k++) {
            blobs[filenames[k]] = URL.createObjectURL(variants[k]);
            const base64 = await fileToBase64(variants[k]);
            batch.push({ path: galleryFilePath(filenames[k]), content: base64 });
          }
          const responsiveSizes = UPLOAD_SIZES.filter((s) => s < 2400);
          const responsiveFilenames = filenames.filter((_, k) => UPLOAD_SIZES[k] < 2400);
          const srcSet = responsiveFilenames
            .map((f, k) => `/images/gallery/${f} ${responsiveSizes[k]}w`)
            .join(", ");
          added.push({
            src: `/images/gallery/${name}`,
            alt: "Angelica Dira fashion model editorial",
            caption: "",
            srcSet,
          });
        } catch {
          skipped.push(file.name);
        }
      }
      if (added.length === 0) {
        setStatus(
          "Upload failed — none of the selected photos could be processed" +
            (skipped.length ? ` (${skipped.join(", ")})` : ""),
        );
        return;
      }
      previewsRef.current = { ...previewsRef.current, ...blobs };
      setPreviews({ ...previewsRef.current });
      const manifest = [...added, ...base];
      batch.push({ path: "public/gallery.json", content: manifestBase64(manifest) });
      setStatus(`Publishing ${added.length} photo(s)...`);
      await commitBatch(token, batch, `Add ${added.length} photo(s)`);
      lastEditRef.current = Date.now();
      dirtyRef.current = false;
      setDirty(false);
      setPhotos(manifest);
      setDraft(manifest);
      setStatus(
        `Done — ${added.length} photo(s) published to the top of the gallery.` +
          (skipped.length ? ` ${skipped.length} file(s) skipped (could not decode): ${skipped.join(", ")}` : ""),
      );
    } catch (e) {
      setStatus("Upload failed: " + (e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    if (!authed || busyRef.current) return;
    const current = dirtyRef.current ? draft : photos;
    const photo = current[index];
    if (!photo) return;
    if (!confirm(`Delete ${photo.src.split("/").pop()}?`)) return;
    setBusy(true);
    busyRef.current = true;
    const name = photo.src.split("/").pop() as string;
    const stem = name.replace(/\.jpg$/, "");
    const filenames = [`${stem}.jpg`, `${stem}-1280.jpg`, `${stem}-640.jpg`];
    setStatus("Deleting " + name + "...");
    try {
      const next = current.filter((_, i) => i !== index);
      const batch = filenames.map((f) => ({ path: galleryFilePath(f), content: null as string | null }));
      batch.push({ path: "public/gallery.json", content: manifestBase64(next) });
      await commitBatch(token, batch, `Remove photo ${name}`);
      lastEditRef.current = Date.now();
      dirtyRef.current = false;
      setDirty(false);
      setPhotos(next);
      setDraft(next);
      setStatus("Deleted " + name + ".");
    } catch (e) {
      setStatus("Delete failed: " + (e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };

  const movePhoto = (index: number, dir: -1 | 1) => {
    if (!authed || busy) return;
    const target = index + dir;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
    markDirty();
  };

  const setCaption = (src: string, value: string) => {
    setDraft((d) => d.map((p) => (p.src === src ? { ...p, caption: value } : p)));
    markDirty();
  };

  const applyChanges = async () => {
    if (busyRef.current) return;
    setBusy(true);
    busyRef.current = true;
    setStatus("Publishing order & captions...");
    try {
      await commitBatch(
        token,
        [{ path: "public/gallery.json", content: manifestBase64(draft) }],
        "Update gallery order and captions",
      );
      lastEditRef.current = Date.now();
      dirtyRef.current = false;
      setDirty(false);
      setPhotos(draft);
      setStatus("Published — order and captions are live.");
    } catch (e) {
      setStatus("Publish failed: " + (e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };

  const resetDraft = () => {
    if (busy) return;
    setDraft(photos);
    dirtyRef.current = false;
    setDirty(false);
    setStatus("Changes discarded.");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (busy || (e.target as HTMLElement).closest("button, input")) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    if (index !== overIndex) setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(null);
    const from = dragIndex;
    setDragIndex(null);
    if (from === null || from === index || busy) return;
    const next = [...draft];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setDraft(next);
    markDirty();
  };

  if (!authed) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-black px-5 pt-24">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center font-sans text-[clamp(28px,4vw,40px)] font-bold uppercase tracking-[-1px] text-white">
            Admin Panel
          </h1>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-sans text-[14px] text-offwhite">Password</span>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                placeholder="Enter the site password"
                className="h-12 w-full border-b border-white bg-transparent px-4 font-sans text-[16px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={checking || !pin.trim()}
              className="rounded-[4px] bg-white px-8 py-[10px] font-sans text-[16px] text-black transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {checking ? "Checking..." : "Unlock"}
            </button>
            {status && <p className="mt-4 font-sans text-[14px] text-zinc-400">{status}</p>}
          </form>
          <p className="mt-6 font-sans text-[12px] leading-relaxed text-zinc-600">
            Enter the site password to upload and manage photos. Your session is kept in this
            browser only.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-5 pb-20 pt-24">
      <div className="w-full max-w-[1200px]">
        <div className="mb-8 flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-[13px] text-zinc-500 underline hover:text-white"
          >
            <Icon name="arrowBack" className="h-4 w-4" />
            Back to site
          </Link>
          <h1 className="font-sans text-[clamp(28px,4vw,40px)] font-bold uppercase tracking-[-1px] text-white">
            Admin Panel
          </h1>
          <p className="font-sans text-[14px] text-zinc-500">
            Signed in as <span className="text-offwhite">@{user}</span> ·{" "}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setAuthed(false);
                setToken("");
                setPin("");
              }}
              className="text-offwhite underline hover:text-white"
            >
              log out
            </button>
          </p>
          {status && <p className="font-sans text-[13px] text-zinc-400">{status}</p>}
        </div>

        {dirty && (
          <div className="sticky top-3 z-10 mb-8 flex flex-col items-start justify-between gap-4 rounded-[4px] border-2 border-offwhite bg-white p-5 shadow-[0_0_0_4px_rgba(0,0,0,0.55)] sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[15px] font-semibold text-black">
                Unsaved changes
              </p>
              <p className="font-sans text-[13px] text-zinc-600">
                Reorder and captions are staged locally. Apply to publish them to the site.
              </p>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <button
                type="button"
                onClick={resetDraft}
                disabled={busy}
                className="rounded-[4px] border border-zinc-300 px-5 py-[14px] font-sans text-[15px] text-zinc-600 transition-colors hover:border-zinc-500 hover:text-black disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void applyChanges()}
                disabled={busy}
                className="flex-1 rounded-[4px] bg-black px-10 py-[14px] font-sans text-[17px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 sm:flex-none"
              >
                {busy ? "Publishing..." : "Apply changes"}
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col items-start gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              void processFiles(files);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const files = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/"),
              );
              void processFiles(files);
            }}
            className={`w-full rounded-[4px] border-2 border-dashed px-8 py-10 font-sans text-[16px] transition-colors ${
              dragging
                ? "border-offwhite bg-white/10 text-offwhite"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            {busy ? "Uploading..." : "Click or drag photos here to add to the top of the gallery"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {draft.map((photo, index) => {
            const name = photo.src.split("/").pop() as string;
            const src = previews[name] ?? (tick ? `${photo.src}?v=${tick}` : photo.src);
            return (
              <div
                key={photo.src + index}
                draggable={!busy}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => void handleDrop(e, index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`group relative overflow-hidden rounded-[4px] bg-zinc-900 transition-shadow ${
                  overIndex === index ? "ring-2 ring-offwhite" : ""
                } ${dragIndex === index ? "opacity-40" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={src}
                  src={src}
                  alt={photo.alt}
                  loading="lazy"
                  draggable={false}
                  onLoad={() => setFailed((f) => (f[name] ? { ...f, [name]: false } : f))}
                  onError={() => setFailed((f) => (f[name] ? f : { ...f, [name]: true }))}
                  className="aspect-[3/4] w-full object-cover"
                />
                {failed[name] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-3">
                    <p className="text-center font-sans text-[12px] text-zinc-400">
                      Uploaded — publishing to site…
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2 bg-zinc-950 p-3">
                  <input
                    type="text"
                    value={draft[index].caption ?? ""}
                    onChange={(e) => setCaption(photo.src, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    placeholder="Caption (optional)"
                    className="w-full border-b border-white/20 bg-transparent px-1 pb-1 font-sans text-[12px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
                  />
                  <p className="truncate font-sans text-[12px] text-zinc-500">{name}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void movePhoto(index, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move ${name} up`}
                      className="flex h-10 flex-1 items-center justify-center rounded bg-white/20 font-sans text-white active:bg-white/40 disabled:opacity-30"
                    >
                      <Icon name="arrowUpward" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void movePhoto(index, 1)}
                      disabled={busy || index === draft.length - 1}
                      aria-label={`Move ${name} down`}
                      className="flex h-10 flex-1 items-center justify-center rounded bg-white/20 font-sans text-white active:bg-white/40 disabled:opacity-30"
                    >
                      <Icon name="arrowDownward" className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePhoto(index)}
                      disabled={busy}
                      aria-label={`Delete ${name}`}
                      className="flex h-10 items-center gap-1.5 rounded bg-red-600/90 px-3 font-sans text-[14px] text-white active:bg-red-500 disabled:opacity-30"
                    >
                      <Icon name="delete" className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <SiteInfoEditor token={token} />
      </div>
    </main>
  );
}
