"use client";

import { Icon, InstagramIcon } from "@/components/icons";
import { useSiteInfo } from "@/lib/use-site-info";

export function SiteFooter() {
  const info = useSiteInfo();
  const copyright = info.copyright.replace(
    /\b\d{4}\b/,
    String(new Date().getFullYear()),
  );

  return (
    <footer className="flex w-full flex-col items-center bg-black pt-16">
      <div className="flex w-full max-w-[1600px] flex-col items-start justify-between gap-10 px-6 md:flex-row md:items-start md:gap-0">
        <div className="flex w-full flex-col gap-2 md:w-auto">
          <p className="font-sans text-[14px] font-normal uppercase tracking-[0.7px] text-zinc-500">
            Location
          </p>
          <p className="font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-white">
            {info.location.street}
          </p>
          <p className="font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-white">
            {info.location.city}
          </p>
          <p className="font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-white">
            {info.location.country}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto">
          <p className="font-sans text-[14px] font-normal uppercase tracking-[0.7px] text-zinc-500">
            Socials
          </p>
          <a
            href={info.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-offwhite transition-opacity hover:opacity-70"
          >
            <InstagramIcon width={16} height={16} />
            {info.instagramHandle}
          </a>
          <a
            href={`mailto:${info.email}`}
            className="inline-flex items-center gap-2 font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-offwhite transition-opacity hover:opacity-70"
          >
            <Icon name="mail" className="h-4 w-4 shrink-0" />
            {info.email}
          </a>
          <a
            href={`tel:${info.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 font-sans text-[14px] leading-[22.4px] tracking-[-0.28px] text-offwhite transition-opacity hover:opacity-70"
          >
            <Icon name="call" className="h-4 w-4 shrink-0" />
            {info.phone}
          </a>
        </div>
      </div>

      <div className="mt-12 w-full border-t border-zinc-800/70 px-6 py-6">
        <p className="mx-auto w-full max-w-[1600px] text-center font-sans text-[14px] font-normal uppercase tracking-[0.7px] text-zinc-500">
          {copyright}
        </p>
      </div>
    </footer>
  );
}
