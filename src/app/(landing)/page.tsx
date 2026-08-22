import type { Metadata } from "next";
import React from "react";
import MainPage from "./_sections/MainPage";
import AiGeneration from "./_sections/AiGeneration";
import TeacherControl from "./_sections/TeacherControl";
import HowItWorks from "./_sections/HowItWorks";
import Feature from "./_sections/Features";
import Roles from "./_sections/Roles";
import Analytics from "./_sections/Analytics";
import LandingAccordion from "./_sections/Accordion";
import CallToAction from "./_sections/CallToAction";
import Footer from "./_components/Footer";
import { BRAND_NAME } from "@/constants/brand";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: BRAND_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/logo/social/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dwelve online testing platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/logo/social/twitter-card.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND_NAME,
      description: HOME_DESCRIPTION,
      inLanguage: ["en", "ru", "uz"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: BRAND_NAME,
      url: SITE_URL,
      description: HOME_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      image: `${SITE_URL}/logo/social/og-image.png`,
      inLanguage: ["en", "ru", "uz"],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <MainPage />
      <AiGeneration />
      <TeacherControl />
      <Feature />
      <Roles />
      <HowItWorks />
      <Analytics />
      <LandingAccordion />
      <CallToAction />
      <Footer />
    </>
  );
}
