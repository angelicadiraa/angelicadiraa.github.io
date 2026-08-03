"use client";

import { useEffect, useState } from "react";
import { SITE_INFO } from "@/data/site";
import type { SiteInfo } from "@/types/site";

let cached: Promise<SiteInfo> | null = null;

function mergeInfo(data: unknown): SiteInfo {
  if (!data || typeof data !== "object") return SITE_INFO;
  const incoming = data as Partial<SiteInfo>;
  return {
    ...SITE_INFO,
    ...incoming,
    location: {
      ...SITE_INFO.location,
      ...(incoming.location ?? {}),
    },
  };
}

function fetchSiteInfo(): Promise<SiteInfo> {
  if (!cached) {
    cached = fetch("/site.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(mergeInfo)
      .catch(() => SITE_INFO);
  }
  return cached;
}

export function useSiteInfo(): SiteInfo {
  const [info, setInfo] = useState<SiteInfo>(SITE_INFO);

  useEffect(() => {
    let active = true;
    fetchSiteInfo().then((data) => {
      if (active) setInfo(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return info;
}
