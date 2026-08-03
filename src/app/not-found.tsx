import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center gap-6 bg-black px-5 pb-24 pt-40">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-sans text-[clamp(40px,6vw,72px)] font-bold uppercase leading-none text-white">
          404
        </h1>
        <p className="font-sans text-[clamp(16px,2vw,20px)] uppercase tracking-wide text-offwhite">
          Page Not Found
        </p>
        <Link
          href="/"
          className="mt-4 rounded-[4px] bg-white px-8 py-[10px] font-sans text-[16px] font-normal text-black transition-opacity hover:opacity-80"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
