import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME } from "@/data/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LenisProvider } from "@/components/lenis-provider";
import { GoatCounter } from "@/components/goatcounter";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

const SITE_URL = "https://angelicadiraa.github.io";
const OG_IMAGE = `${SITE_URL}/seo/og-image.png`;

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/seo/favicon.png",
    apple: "/seo/apple-touch-icon.png",
  },
  appleWebApp: {
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Angelica Dira",
  url: SITE_URL,
  image: OG_IMAGE,
  jobTitle: "Fashion Model",
  email: "angelica.diraa@gmail.com",
  telephone: "+52 492 290 2207",
  address: {
    "@type": "PostalAddress",
    streetAddress: "245 Park Ave",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94087",
    addressCountry: "US",
  },
  sameAs: ["https://www.instagram.com/angelica_dira/"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${googleSansFlex.variable} lenis`}
    >
      <body className="flex min-h-screen flex-col bg-black text-white">
        <LenisProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </LenisProvider>
        <GoatCounter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
