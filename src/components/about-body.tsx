"use client";

import Link from "next/link";
import { useSiteInfo } from "@/lib/use-site-info";

export function AboutBody() {
  const info = useSiteInfo();
  const details = Array.isArray(info.details) ? info.details : [];

  return (
    <section className="flex flex-col items-center gap-16 bg-black px-6 pb-24 pt-40 md:px-16 max-md:gap-12 max-md:px-5 max-md:pt-28">
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="font-sans text-[clamp(40px,5vw,72px)] font-bold uppercase leading-[1.05] text-white">
          About
        </h1>
      </div>

      <div className="grid w-full max-w-[1400px] gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div className="order-2 flex flex-col gap-8 md:order-1">
          <p className="whitespace-pre-line font-sans text-[clamp(16px,1.6vw,19px)] font-normal leading-[1.65] text-zinc-200">
            {info.bio}
          </p>
          {details.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              {details.map((d) => (
                <div key={d.label} className="flex flex-col gap-1">
                  <dt className="font-sans text-[12px] font-normal uppercase tracking-[0.7px] text-zinc-500">
                    {d.label}
                  </dt>
                  <dd className="font-sans text-[16px] leading-[22.4px] text-white">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div>
            <Link
              href="/contact"
              className="inline-block rounded-[4px] bg-white px-8 py-[10px] font-sans text-[16px] font-normal text-black transition-opacity hover:opacity-80"
            >
              Message
            </Link>
          </div>
        </div>

        <div className="order-1 md:order-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gallery/angelica-dira-model-editorial-10.jpg"
            srcSet="/images/gallery/angelica-dira-model-editorial-10-1280.jpg 1280w, /images/gallery/angelica-dira-model-editorial-10-640.jpg 640w"
            sizes="(min-width: 768px) 50vw, 92vw"
            alt="Angelica Dira"
            className="w-full rounded-[4px] object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
