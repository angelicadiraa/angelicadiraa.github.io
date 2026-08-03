"use client";

import { useState } from "react";
import { useSiteInfo } from "@/lib/use-site-info";

const FORM_ENDPOINT = "https://formsubmit.co/ajax/angelica.diraa@gmail.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const info = useSiteInfo();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    const honey = String(fd.get("_honey") ?? "");

    if (honey) {
      setStatus("success");
      return;
    }
    if (!name || !email || !message) {
      setStatus("error");
      setError("Please fill in your name, email, and message.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `New message from angelicadiraa.github.io`,
          _template: "table",
          _captcha: "false",
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
      setError(
        "Something went wrong sending your message. Please email me directly using the link below.",
      );
    }
  }

  const inputClass =
    "h-12 w-full rounded-none border-b border-white bg-transparent px-4 text-left font-sans text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-offwhite";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[700px] flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="name"
          className="text-left font-sans text-[16px] font-normal leading-[28.8px] text-offwhite"
        >
          Name
        </label>
        <input id="name" name="name" type="text" placeholder="Your name" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-left font-sans text-[16px] font-normal leading-[28.8px] text-offwhite"
        >
          Email
        </label>
        <input id="email" name="email" type="email" placeholder="Your email" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="message"
          className="text-left font-sans text-[16px] font-normal leading-[28.8px] text-offwhite"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Your message"
          rows={4}
          className="w-full rounded-none border-b border-white bg-transparent px-4 py-4 text-left font-sans text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-offwhite"
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-fit rounded-[4px] bg-white px-8 py-[10px] font-sans text-[16px] font-normal text-black transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {status === "sending" ? "Sending..." : "Submit"}
      </button>

      {status === "success" && (
        <p className="font-sans text-[14px] text-offwhite">
          Thanks — your message has been sent.
        </p>
      )}
      {status === "error" && (
        <p className="font-sans text-[14px] text-zinc-400">{error}</p>
      )}

      <p className="text-left font-sans text-[13px] text-zinc-500">
        Prefer email?{" "}
        <a
          href={`mailto:${info.email}`}
          className="text-offwhite underline hover:opacity-70"
        >
          {info.email}
        </a>
      </p>
    </form>
  );
}
