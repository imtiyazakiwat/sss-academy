import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { ArrowIcon } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import {
  durationLabel,
  trackLabels,
  type Course,
} from "@/content/courses";
import { contact } from "@/content/site";
import { enquiryHref } from "@/lib/anchors";

const included = [
  "Real project work",
  "Mock interviews",
  "Placement guidance",
];

export function CourseHero({ course }: { course: Course }) {
  return (
    <section className="relative overflow-hidden border-b border-[#173f35]/10 bg-[#f5f1e8] text-[#173f35]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-full w-[36%] bg-[#e3ede5] max-lg:hidden" />
        <div className="absolute top-0 right-[36%] h-full w-px bg-[#173f35]/10 max-lg:hidden" />
        <div className="absolute top-16 -left-8 size-32 rounded-full border border-[#d95d39]/15" />
        <div className="absolute top-24 -left-1 size-16 rounded-full border border-[#d95d39]/20" />
      </div>

      <Container className="relative pt-7 pb-14 sm:pt-9 sm:pb-20 lg:pb-24">
        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-2 text-xs text-[#68766f]">
            <li>
              <Link href="/" className="transition-colors hover:text-[#173f35]">
                Home
              </Link>
            </li>
            <li className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="text-[#a9b0aa]">
                /
              </span>
              <Link
                href="/courses"
                className="transition-colors hover:text-[#173f35]"
              >
                Courses
              </Link>
            </li>
            <li className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="text-[#a9b0aa]">
                /
              </span>
              <span aria-current="page" className="truncate font-medium text-[#173f35]">
                {course.title}
              </span>
            </li>
          </ol>
        </nav>

        <div className="mt-10 grid items-center gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7 lg:pr-5">
            <div className="flex items-center gap-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-[#b84a2d] uppercase">
              <span aria-hidden="true" className="size-2 bg-[#d95d39]" />
              {trackLabels[course.track]} · Classroom training
            </div>

            <h1 className="mt-6 max-w-3xl text-[clamp(3rem,7vw,5.75rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-[#173f35]">
              Learn {course.title}.
              <span className="mt-2 block font-normal text-[#d95d39]">
                Use it at work.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#53625b] sm:text-lg sm:leading-8">
              {course.summary}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={enquiryHref(course.slug)}
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#173f35] px-7 text-base font-medium text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#0f3028]"
              >
                Ask about the next batch
                <ArrowIcon />
              </Link>
              <a
                href={`tel:${contact.phoneHrefs[0]}`}
                className="inline-flex h-13 items-center justify-center rounded-full border border-[#173f35]/25 px-7 text-base font-medium text-[#173f35] transition-colors hover:border-[#173f35] hover:bg-white/60"
              >
                Call {contact.phones[0]}
              </a>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#173f35]/12 pt-6">
              {included.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs font-medium text-[#53625b] sm:text-sm"
                >
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            delay={100}
            direction="left"
            className="relative lg:col-span-5"
          >
            <div className="absolute -top-4 -right-3 h-24 w-24 bg-[#e7b94d] sm:-right-5" aria-hidden="true" />
            <article className="relative border border-[#173f35]/20 bg-[#fffdf8] shadow-[10px_10px_0_0_#cbdcce]">
              <header className="flex items-center justify-between border-b border-[#173f35]/15 px-5 py-4 sm:px-7">
                <p className="font-mono text-[0.625rem] font-semibold tracking-[0.16em] text-[#68766f] uppercase">
                  SSS Academy · Course file
                </p>
                <span className="flex items-center gap-2 text-[0.6875rem] font-semibold text-[#27604f]">
                  <span className="size-2 rounded-full bg-[#4f8a69]" />
                  Enrolling
                </span>
              </header>

              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-medium text-[#b84a2d]">
                      {trackLabels[course.track]}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#173f35] sm:text-3xl">
                      {course.title} Training
                    </h2>
                  </div>
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[#173f35]/20 bg-[#f5f1e8] font-mono text-base font-semibold text-[#173f35]">
                    {course.short.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <dl className="mt-7 grid grid-cols-2 border-y border-[#173f35]/15">
                  <Fact label="Duration" value={durationLabel(course.durationMonths)} />
                  <Fact label="Level" value={course.level} bordered />
                  <Fact label="Format" value="In person" />
                  <Fact label="Location" value="Chikkodi" bordered />
                </dl>

                <div className="mt-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#68766f] uppercase">
                        How you&apos;ll learn
                      </p>
                      <p className="mt-1 text-sm text-[#53625b]">
                        A practical path, not a lecture marathon.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#b84a2d]">01—03</span>
                  </div>

                  <ol className="mt-5 space-y-0">
                    <JourneyStep number="01" title="Understand" detail="Build the right foundations" />
                    <JourneyStep number="02" title="Practise" detail="Work through real scenarios" />
                    <JourneyStep number="03" title="Prove it" detail="Complete a guided project" last />
                  </ol>
                </div>
              </div>

              <footer className="flex items-center justify-between gap-4 border-t border-[#173f35]/15 bg-[#f8f3e9] px-5 py-4 sm:px-7">
                <p className="text-xs leading-5 text-[#68766f]">
                  Not sure this is your track?
                  <span className="block font-medium text-[#173f35]">Counselling is free.</span>
                </p>
                <a
                  href={`tel:${contact.phoneHrefs[0]}`}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-[#b84a2d] underline decoration-[#d95d39]/35 underline-offset-4 hover:decoration-[#d95d39]"
                >
                  Let&apos;s talk
                  <ArrowIcon />
                </a>
              </footer>
            </article>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function Fact({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div className={`min-w-0 py-4 ${bordered ? "border-l border-[#173f35]/15 pl-4 sm:pl-5" : "pr-4 sm:pr-5"}`}>
      <dt className="text-[0.625rem] font-semibold tracking-[0.12em] text-[#7c8882] uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 truncate text-sm font-semibold text-[#173f35]" title={value}>
        {value}
      </dd>
    </div>
  );
}

function JourneyStep({
  number,
  title,
  detail,
  last = false,
}: {
  number: string;
  title: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span className="grid size-8 place-items-center rounded-full border border-[#173f35]/25 bg-[#fffdf8] font-mono text-[0.625rem] font-semibold text-[#b84a2d]">
          {number}
        </span>
        {!last ? <span className="h-7 w-px bg-[#173f35]/20" aria-hidden="true" /> : null}
      </div>
      <div className="pt-1">
        <p className="text-sm font-semibold text-[#173f35]">{title}</p>
        <p className="mt-0.5 text-xs text-[#7c8882]">{detail}</p>
      </div>
    </li>
  );
}

function CheckIcon() {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-[#dce9de] text-[#27604f]">
      <svg viewBox="0 0 16 16" fill="none" className="size-3" aria-hidden="true">
        <path
          d="m3.5 8.5 3 3 6-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
