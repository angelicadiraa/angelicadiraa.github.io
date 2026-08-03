"use client";

import { Icon, type IconName } from "@/components/icons";
import { useSiteInfo } from "@/lib/use-site-info";

export function ContactDetails() {
  const info = useSiteInfo();

  const rows: {
    label: string;
    value: string;
    href: string | null;
    icon: IconName;
  }[] = [
    {
      label: "Send an email",
      value: info.email.toUpperCase(),
      href: `mailto:${info.email}`,
      icon: "mail",
    },
    {
      label: "Phone",
      value: info.phone,
      href: `tel:${info.phone.replace(/\s/g, "")}`,
      icon: "call",
    },
    {
      label: "Location",
      value: [
        info.location.street,
        info.location.city,
        info.location.country,
      ]
        .filter(Boolean)
        .join(", ")
        .toUpperCase(),
      href: null,
      icon: "locationOn",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 font-sans text-[16px] leading-[28.8px] text-offwhite">
            <Icon name={row.icon} className="h-[18px] w-[18px] shrink-0" />
            {row.label}
          </span>
          {row.href ? (
            <a
              href={row.href}
              target={row.href.startsWith("http") ? "_blank" : undefined}
              rel={row.href.startsWith("http") ? "noreferrer" : undefined}
              className="font-sans text-[clamp(16px,1.8vw,24px)] font-medium uppercase leading-[28.8px] tracking-[-0.48px] text-offwhite transition-opacity hover:opacity-70"
            >
              {row.value}
            </a>
          ) : (
            <p className="font-sans text-[clamp(16px,1.8vw,24px)] font-medium uppercase leading-[28.8px] tracking-[-0.48px] text-offwhite">
              {row.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
