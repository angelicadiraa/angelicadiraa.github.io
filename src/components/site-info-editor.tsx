"use client";

import { useEffect, useState } from "react";
import { SITE_INFO } from "@/data/site";
import { loadSiteInfo, saveSiteInfo } from "@/lib/github-gallery";
import type { SiteInfo } from "@/types/site";

const EMPTY: SiteInfo = {
  name: "",
  logo: "",
  location: { street: "", city: "", country: "" },
  email: "",
  phone: "",
  instagramUrl: "",
  instagramHandle: "",
  copyright: "",
  bio: "",
  details: [],
};

export function SiteInfoEditor({ token }: { token: string }) {
  const [draft, setDraft] = useState<SiteInfo>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    loadSiteInfo(token, SITE_INFO)
      .then((info) => {
        if (active) setDraft(info);
      })
      .catch(() => {
        if (active) setDraft(SITE_INFO);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const set = <K extends keyof SiteInfo>(key: K, value: SiteInfo[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus("Saving…");
    try {
      await saveSiteInfo(token, draft, "Update site info");
      setStatus("Saved — the site is updating.");
    } catch (err) {
      setStatus("Save failed: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void) => (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-[14px] text-offwhite">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full border-b border-white bg-transparent px-4 font-sans text-[14px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
      />
    </label>
  );

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="font-sans text-[clamp(22px,3vw,32px)] font-bold uppercase tracking-[-0.5px] text-white">
          Site Info
        </h2>
        <p className="font-sans text-[14px] text-zinc-500">
          Edit the contact details shown on the site. Changes publish automatically.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {field("Email", draft.email, (v) => set("email", v))}
          {field("Phone", draft.phone, (v) => set("phone", v))}
          {field("Address line 1", draft.location.street, (v) =>
            set("location", { ...draft.location, street: v }),
          )}
          {field("Address line 2", draft.location.city, (v) =>
            set("location", { ...draft.location, city: v }),
          )}
          {field("Country", draft.location.country, (v) =>
            set("location", { ...draft.location, country: v }),
          )}
          {field("Instagram URL", draft.instagramUrl, (v) => set("instagramUrl", v))}
          {field("Instagram handle", draft.instagramHandle, (v) => set("instagramHandle", v))}
          {field("Copyright line", draft.copyright, (v) => set("copyright", v))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="font-sans text-[14px] text-offwhite">About / bio</span>
          <textarea
            rows={5}
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
            className="w-full rounded-none border-b border-white bg-transparent px-4 py-4 font-sans text-[14px] leading-[22px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
          />
        </label>
        <div className="flex flex-col gap-3">
          <span className="font-sans text-[14px] text-offwhite">Profile details</span>
          {draft.details.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={d.label}
                placeholder="Label (e.g. Height)"
                onChange={(e) => {
                  const details = draft.details.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  );
                  set("details", details);
                }}
                className="h-11 w-1/3 border-b border-white bg-transparent px-4 font-sans text-[14px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
              />
              <input
                type="text"
                value={d.value}
                placeholder="Value"
                onChange={(e) => {
                  const details = draft.details.map((x, j) =>
                    j === i ? { ...x, value: e.target.value } : x,
                  );
                  set("details", details);
                }}
                className="h-11 w-1/3 border-b border-white bg-transparent px-4 font-sans text-[14px] text-white placeholder:text-zinc-600 focus:border-offwhite focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "details",
                    draft.details.filter((_, j) => j !== i),
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded bg-white/20 text-white active:bg-white/40"
                aria-label="Remove detail"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("details", [...draft.details, { label: "", value: "" }])}
            className="w-fit rounded-[4px] border border-zinc-700 px-4 py-[8px] font-sans text-[14px] text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            + Add detail
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[4px] bg-white px-8 py-[10px] font-sans text-[16px] text-black transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {status && <p className="font-sans text-[13px] text-zinc-400">{status}</p>}
        </div>
      </form>
    </section>
  );
}
