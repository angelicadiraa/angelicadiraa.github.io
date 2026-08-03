import { ContactForm } from "@/components/contact-form";
import { ContactDetails } from "@/components/contact-details";

export const metadata = {
  title: "Message",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main>
      <section className="flex flex-col items-center justify-center gap-16 bg-black px-6 pb-24 pt-40 md:gap-24 md:px-16 max-md:gap-12 max-md:px-5 max-md:pt-28">
        <div className="flex flex-col items-center gap-2.5">
          <h1 className="font-sans text-[clamp(40px,5vw,72px)] font-bold uppercase leading-[1.05] text-white">
            Message
          </h1>
        </div>

        <div className="flex w-full max-w-[1400px] flex-col gap-16 md:flex-row md:justify-between">
          <ContactDetails />
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
