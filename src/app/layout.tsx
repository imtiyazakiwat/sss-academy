import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { NoticeBar } from "@/components/site/NoticeBar";
import { getCourses } from "@/lib/cms/courses";
import { organizationSchema } from "@/lib/schema";
import { site } from "@/content/site";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  // Only the weights the design system actually uses.
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default:
      "SSS Academy | SQL, Python, ETL Testing & Data Engineering Training in Chikkodi",
    template: "%s | SSS Academy",
  },
  description: site.description,
  keywords: [
    "ETL Testing training",
    "SQL course",
    "PySpark training",
    "Data Engineering course",
    "Python course",
    "Power BI training",
    "Snowflake training",
    "Azure Data Factory course",
    "IT training Chikkodi",
    "IT training Belagavi",
    "Karnataka",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    url: site.url,
    title: "SSS Academy — Industry-oriented IT training with placement assistance",
    description: site.description,
    locale: "en_IN",
    images: [{ url: "/img/logo.png", width: 256, height: 253, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SSS Academy — Industry-oriented IT training",
    description: site.description,
    images: ["/img/logo.png"],
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icon.png", sizes: "180x180" }],
  },
  other: {
    "geo.region": "IN-KA",
    "geo.placename": "Chikkodi",
    "geo.position": "16.429;74.585",
    ICBM: "16.429,74.585",
  },
};

export const viewport: Viewport = {
  themeColor: "#173f35",
  colorScheme: "light",
};

/**
 * The nav, the footer and the organisation schema all list courses, so the
 * catalogue is loaded once here and passed down. `Navbar` is a client component
 * and cannot read the loader itself.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { courses } = await getCourses();

  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
      // The playground's theme script writes data-pg-theme here during HTML
      // parsing, ahead of hydration, so the workspace never flashes the wrong
      // surface. React did not render that attribute and must be told not to
      // treat it as a mismatch — the DOM is deliberately ahead of the server.
      // It also absorbs translation extensions rewriting `lang` before React
      // hydrates. The suppression is shallow: this element's attributes only.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[#fffdf8]">
        {/* Scroll reveals start at opacity 0 and are shown by an observer.
            Without JS nothing would ever reveal, so force the final state. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <Navbar courses={courses} />

        <main id="main" className="flex-1 pt-[var(--header-h)]">
          <NoticeBar />
          {children}
        </main>

        <Footer courses={courses} />

        {/* Organisation-level structured data, carried over and expanded from the legacy site */}
        <JsonLd data={organizationSchema(courses)} />
      </body>
    </html>
  );
}
