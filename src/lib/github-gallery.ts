import type { SiteInfo } from "@/types/site";

const OWNER = "angelicadiraa";
const REPO = "angelicadiraa.github.io";
const BRANCH = "master";
const GALLERY_DIR = "public/images/gallery";
const MANIFEST = "public/gallery.json";
const SITE_MANIFEST = "public/site.json";
const API = "https://api.github.com";

export type Photo = {
  src: string;
  alt: string;
  caption?: string;
  srcSet?: string;
};

export async function api(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000];

function isConflict(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return (
    e.message.includes("does not match") ||
    e.message.includes("not a fast forward") ||
    e.message.includes("409") ||
    e.message.includes("422")
  );
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isConflict(e) || attempt === RETRY_DELAYS.length) throw e;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }
  throw new Error("Unreachable");
}

export function slugify(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "photo";
}

export async function validateToken(token: string): Promise<string> {
  const me = await api("/user", token);
  return me.login as string;
}

export async function loadManifest(token: string): Promise<Photo[]> {
  const data = await api(
    `/repos/${OWNER}/${REPO}/contents/${MANIFEST}?ref=${BRANCH}&t=${Date.now()}`,
    token,
  );
  const content = atob(data.content);
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

export async function uploadImage(
  token: string,
  filename: string,
  base64: string,
  message: string,
): Promise<void> {
  const path = `${GALLERY_DIR}/${filename}`;
  await withRetry(async () => {
    const existing = await api(
      `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`,
      token,
    ).catch(() => null);
    const payload: Record<string, string> = {
      message,
      content: base64,
      branch: BRANCH,
    };
    if (existing?.sha) payload.sha = existing.sha;
    await api(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  });
}

export const galleryFilePath = (filename: string) => `${GALLERY_DIR}/${filename}`;

export function manifestBase64(photos: Photo[]): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(photos, null, 2) + "\n")));
}

export async function saveManifest(token: string, photos: Photo[], message: string): Promise<void> {
  const body = manifestBase64(photos);
  await withRetry(async () => {
    const existing = await api(
      `/repos/${OWNER}/${REPO}/contents/${MANIFEST}?ref=${BRANCH}&t=${Date.now()}`,
      token,
    ).catch(() => null);
    const payload: Record<string, string> = {
      message,
      content: body,
      branch: BRANCH,
    };
    if (existing?.sha) payload.sha = existing.sha;
    await api(`/repos/${OWNER}/${REPO}/contents/${MANIFEST}`, token, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  });
}

type BatchFile = {
  path: string;
  content: string | null;
};

export async function commitBatch(
  token: string,
  files: BatchFile[],
  message: string,
): Promise<void> {
  await withRetry(async () => {
    const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, token);
    const baseCommit = await api(
      `/repos/${OWNER}/${REPO}/git/commits/${ref.object.sha}`,
      token,
    );

    const entries: { path: string; mode: string; type: string; sha: string | null }[] = [];
    for (const file of files) {
      if (file.content === null) {
        entries.push({ path: file.path, mode: "100644", type: "blob", sha: null });
        continue;
      }
      const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content: file.content, encoding: "base64" }),
      });
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }

    const tree = await api(`/repos/${OWNER}/${REPO}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: entries }),
    });

    const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, token, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: [ref.object.sha],
      }),
    });

    await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  });
}

export async function deleteImage(token: string, filename: string, message: string): Promise<void> {
  const path = `${GALLERY_DIR}/${filename}`;
  await withRetry(async () => {
    const existing = await api(
      `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`,
      token,
    );
    await api(`/repos/${OWNER}/${REPO}/contents/${path}`, token, {
      method: "DELETE",
      body: JSON.stringify({ message, sha: existing.sha, branch: BRANCH }),
    });
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function loadSiteInfo(
  token: string,
  fallback: SiteInfo,
): Promise<SiteInfo> {
  const data = await api(
    `/repos/${OWNER}/${REPO}/contents/${SITE_MANIFEST}?ref=${BRANCH}&t=${Date.now()}`,
    token,
  );
  const content = atob(data.content);
  const parsed = JSON.parse(content) as Partial<SiteInfo>;
  return {
    ...fallback,
    ...parsed,
    location: { ...fallback.location, ...(parsed.location ?? {}) },
  };
}

export async function saveSiteInfo(
  token: string,
  info: SiteInfo,
  message: string,
): Promise<void> {
  const body = JSON.stringify(info, null, 2) + "\n";
  await withRetry(async () => {
    const existing = await api(
      `/repos/${OWNER}/${REPO}/contents/${SITE_MANIFEST}?ref=${BRANCH}&t=${Date.now()}`,
      token,
    ).catch(() => null);
    const payload: Record<string, string> = {
      message,
      content: btoa(unescape(encodeURIComponent(body))),
      branch: BRANCH,
    };
    if (existing?.sha) payload.sha = existing.sha;
    await api(`/repos/${OWNER}/${REPO}/contents/${SITE_MANIFEST}`, token, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  });
}
