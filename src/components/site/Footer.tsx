import Link from "next/link";

import { Container } from "@/components/ui/Section";
import { courses } from "@/content/courses";
import { contact, nav, site, socials } from "@/content/site";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-200">
      <div
        aria-hidden="true"
        className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-[50%] bg-ember-500/10 blur-3xl"
      />

      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-title text-white">SSS Academy</p>
            <p className="text-eyebrow mt-1 uppercase text-ember-300">
              {site.tagline}
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-navy-300">
              {site.shortDescription} Our goal is to help students build
              successful careers.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-navy-200 transition-colors hover:border-white/35 hover:text-white"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <FooterHeading>Courses</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {courses.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <FooterLink href={`/courses/${c.slug}`}>{c.title}</FooterLink>
                </li>
              ))}
              <li>
                <FooterLink href="/courses">
                  <span className="text-ember-300">All {courses.length} courses</span>
                </FooterLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <FooterHeading>Academy</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              <li>
                <FooterLink href="/">Home</FooterLink>
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <FooterHeading>Visit us</FooterHeading>
            <address className="mt-4 space-y-1 text-sm not-italic text-navy-300">
              <p>{contact.address.line1}</p>
              <p>{contact.address.line2}</p>
              <p>
                {contact.address.locality}, {contact.address.region}{" "}
                {contact.address.postalCode}
              </p>
            </address>

            <div className="mt-5 space-y-1.5 text-sm">
              {contact.phones.map((phone, i) => (
                <p key={phone}>
                  <a
                    href={`tel:${contact.phoneHrefs[i]}`}
                    className="transition-colors hover:text-white"
                  >
                    {phone}
                  </a>
                </p>
              ))}
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-white"
                >
                  {contact.email}
                </a>
              </p>
            </div>

            <dl className="mt-5 space-y-1 text-xs text-navy-400">
              {contact.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-3">
                  <dt>{h.days}</dt>
                  <dd className="text-navy-300">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} SSS Academy. All rights reserved.
          </p>
          <p>
            IT training &amp; placement assistance in {contact.address.locality},{" "}
            {contact.address.region}
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-eyebrow uppercase text-white/50">{children}</h2>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-navy-300 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
