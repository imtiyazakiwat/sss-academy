import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { ContactHero } from "@/components/site/ContactHero";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import { getCourse } from "@/content/courses";
import { contact, socials } from "@/content/site";
import { breadcrumbSchema } from "@/lib/schema";

/* ─── Icons ─── */
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const socialIcons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  Instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
  YouTube: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  Facebook: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
};

export const metadata: Metadata = {
  title: "Contact — book a free counselling call",
  description:
    "Visit SSS Academy above IDBI Bank on B.K. College Road, Chikkodi, Karnataka 591201. Call +91 6360304019 or send an enquiry and our team will get back to you.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const defaultCourse = course && getCourse(course) ? course : undefined;

  return (
    <>
      <ContactHero />

      <Section id="enquiry-form" className="py-16 sm:py-20">
        <Container>
          <Reveal className="mb-12 text-center">
            <h2 className="text-headline text-navy-950">Contact Form</h2>
          </Reveal>

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Form leads on mobile — it's the primary action on this page */}
            <Reveal className="lg:col-span-7">
              <div className="border-t-4 border-navy-900 bg-[#fffdf8] p-6 shadow-[10px_10px_0_0_#e3ede5] sm:p-8">
                <div className="mt-4">
                  <EnquiryForm
                    key={defaultCourse ?? ""}
                    defaultCourse={defaultCourse}
                  />
                </div>
              </div>
            </Reveal>

            <div className="lg:col-span-5">
              <Reveal direction="left" delay={100} className="space-y-4">
                <InfoCard icon={<PhoneIcon />} title="Call us">
                  <ul className="space-y-1.5">
                    {contact.phones.map((phone, i) => (
                      <li key={phone}>
                        <a
                          href={`tel:${contact.phoneHrefs[i]}`}
                          className="text-[1.0625rem] font-medium text-navy-950 transition-colors hover:text-violet-700"
                        >
                          {phone}
                        </a>
                      </li>
                    ))}
                  </ul>
                </InfoCard>

                <InfoCard icon={<EmailIcon />} title="Email">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-[1.0625rem] font-medium text-navy-950 transition-colors hover:text-violet-700"
                  >
                    {contact.email}
                  </a>
                </InfoCard>

                <InfoCard icon={<MapPinIcon />} title="Visit us">
                  <a
                    href={contact.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block space-y-0.5 text-[0.9375rem] not-italic text-ink-600 transition-colors hover:text-violet-700"
                  >
                    <p>{contact.address.line1}</p>
                    <p>{contact.address.line2}</p>
                    <p>
                      {contact.address.locality}, {contact.address.region}{" "}
                      {contact.address.postalCode}
                    </p>
                  </a>
                </InfoCard>

                <InfoCard title="Follow us">
                  <ul className="flex flex-wrap gap-3">
                    {socials.map((s) => (
                      <li key={s.href}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 text-navy-800 transition-colors hover:border-navy-300 hover:bg-ink-50"
                        >
                          {socialIcons[s.label]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <Eyebrow>Find us</Eyebrow>
            <h2 className="text-headline mt-4 text-navy-950">
              Above IDBI Bank, B.K. College Road
            </h2>
          </Reveal>

          <Reveal delay={100} className="mt-8">
            <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
              <iframe
                src={contact.mapEmbed}
                title="Map showing the location of SSS Academy in Chikkodi"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[380px] w-full border-0 sm:h-[440px]"
              />
            </div>
          </Reveal>
        </Container>
      </Section>

      <JsonLd data={breadcrumbSchema([{ name: "Contact", href: "/contact" }])} />
    </>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle">
      <div className="flex items-center gap-2">
        {icon && <span className="text-navy-700">{icon}</span>}
        <h3 className="text-eyebrow uppercase text-ink-400">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
