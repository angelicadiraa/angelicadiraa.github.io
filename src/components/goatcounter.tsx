"use client";

import { usePathname } from "next/navigation";

const GOATCOUNTER_SITE = "angelicadiraa";

export function GoatCounter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <script
      data-goatcounter={`https://${GOATCOUNTER_SITE}.goatcounter.com/count`}
      async
      src="https://gc.zgo.at/count.js"
    />
  );
}
