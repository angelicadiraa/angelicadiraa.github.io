import { AboutBody } from "@/components/about-body";

export const metadata = {
  title: "About",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main>
      <AboutBody />
    </main>
  );
}
