import Link from "next/link";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Message", href: "/contact" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
      <nav className="flex h-16 items-center justify-center px-4 sm:px-6">
        <div className="flex w-full max-w-[1600px] items-center justify-between">
          <Link
            href="/"
            className="font-sans text-[18px] font-normal uppercase tracking-[-0.36px] text-offwhite"
          >
            Angelica Dira Model
          </Link>
          <div className="flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-[16px] font-normal text-white transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
