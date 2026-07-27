import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { PageHero } from "@/components/site/PageHero";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import { contact, socials } from "@/content/site";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Contact — book a free counselling call",
  description:
    "Visit SSS Academy above IDBI Bank on B.K. College Road, Chikkodi, Karnataka 591201. Call +91 6360304019 or send an enquiry and our team will get back to you.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        variant="contact"
        eyebrow="Contact"
        title="Let's work out where you should start"
        description="Send an enquiry or call us directly. Counselling is free, and we'll give you a straight answer about which track fits your background."
        breadcrumb={[{ name: "Contact", href: "/contact" }]}
      />

      <Section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Form leads on mobile — it's the primary action on this page */}
            <Reveal className="lg:col-span-7">
              <div className="border-t-4 border-navy-900 bg-[#fffdf8] p-6 shadow-[10px_10px_0_0_#e3ede5] sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-6">
                  <div>
                    <Eyebrow>Start a conversation</Eyebrow>
                    <h2 className="text-title mt-3 text-navy-950">
                      Tell us where you want to go
                    </h2>
                  </div>
                  <p className="max-w-44 text-right text-xs leading-5 text-ink-500">
                    A real person usually replies within one working day.
                  </p>
                </div>
                <div className="mt-7">
                  <EnquiryForm />
                </div>
              </div>
            </Reveal>

            <div className="lg:col-span-5">
              <Reveal direction="left" delay={100} className="space-y-4">
                <InfoCard title="Call us">
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

                <InfoCard title="Email">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-[1.0625rem] font-medium text-navy-950 transition-colors hover:text-violet-700"
                  >
                    {contact.email}
                  </a>
                </InfoCard>

                <InfoCard title="Visit us">
                  <address className="space-y-0.5 text-[0.9375rem] not-italic text-ink-600">
                    <p className="font-medium text-navy-950">SSS Academy</p>
                    <p>{contact.address.line1}</p>
                    <p>{contact.address.line2}</p>
                    <p>
                      {contact.address.locality}, {contact.address.region}{" "}
                      {contact.address.postalCode}
                    </p>
                  </address>
                  <a
                    href={contact.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-navy-900 underline decoration-ember-400 decoration-2 underline-offset-2"
                  >
                    Open in Google Maps
                  </a>
                </InfoCard>

                <InfoCard title="Working hours">
                  <dl className="space-y-2">
                    {contact.hours.map((h) => (
                      <div
                        key={h.days}
                        className="flex items-baseline justify-between gap-4 text-sm"
                      >
                        <dt className="text-ink-500">{h.days}</dt>
                        <dd className="font-medium text-navy-900">{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                </InfoCard>

                <InfoCard title="Follow us">
                  <ul className="flex flex-wrap gap-2">
                    {socials.map((s) => (
                      <li key={s.href}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-navy-300 hover:bg-ink-50"
                        >
                          {s.label}
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
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle">
      <h3 className="text-eyebrow uppercase text-ink-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
