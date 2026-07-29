import { durationLabel, type Course } from "@/content/courses";
import { faqs, stats } from "@/content/about";
import { contact, site, socials } from "@/content/site";

const ORG_ID = `${site.url}/#organization`;

/**
 * Structured data. Extends the legacy site's EducationalOrganization node with
 * course, FAQ and aggregate rating graphs so the rich results actually reflect
 * what the institute offers.
 *
 * The course-dependent builders take the catalogue as an argument rather than
 * importing it: courses now come from Firestore, and these stay synchronous so
 * the pages that already load the data can pass it straight in.
 */
export function organizationSchema(courses: Course[]) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: site.name,
    alternateName: site.tagline,
    url: site.url,
    logo: `${site.url}/img/logo.png`,
    image: `${site.url}/img/logo.png`,
    description: site.description,
    slogan: site.promise,
    email: contact.email,
    telephone: contact.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${contact.address.line1}, ${contact.address.line2}`,
      addressLocality: contact.address.locality,
      addressRegion: contact.address.region,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.geo.lat,
      longitude: contact.geo.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    knowsAbout: courses.map((c) => c.title),
    sameAs: socials.map((s) => s.href),
    contactPoint: contact.phoneHrefs.map((tel) => ({
      "@type": "ContactPoint",
      telephone: tel,
      contactType: "admissions",
      areaServed: "IN",
      availableLanguage: ["en", "kn", "hi", "mr"],
    })),
  };
}

export function courseListSchema(courses: Course[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Courses at ${site.name}`,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${site.url}/courses/${course.slug}`,
      name: course.title,
    })),
  };
}

export function courseSchema(course: Course) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${site.url}/courses/${course.slug}#course`,
    name: `${course.title} Training`,
    description: course.summary,
    url: `${site.url}/courses/${course.slug}`,
    provider: { "@id": ORG_ID },
    teaches: course.topics,
    educationalLevel: course.level,
    inLanguage: "en",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      courseWorkload: `P${course.durationMonths}M`,
      name: `${course.title} — ${durationLabel(course.durationMonths)}`,
      location: {
        "@type": "Place",
        name: site.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${contact.address.line1}, ${contact.address.line2}`,
          addressLocality: contact.address.locality,
          addressRegion: contact.address.region,
          postalCode: contact.address.postalCode,
          addressCountry: contact.address.country,
        },
      },
    },
  };
}

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const statsSummary = stats;

export function breadcrumbSchema(
  trail: { name: string; href: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.href}`,
    })),
  };
}
