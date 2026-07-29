import type { Metadata } from "next";

import { CourseEditor } from "@/app/admin/(dashboard)/courses/CourseEditor";
import { CourseRow } from "@/app/admin/(dashboard)/courses/CourseRow";
import { seedCoursesAction } from "@/app/admin/_actions/courses";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { courses as staticCourses } from "@/content/courses";
import { labsForCourse } from "@/content/labs";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllCourses } from "@/lib/cms/courses";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

/**
 * The catalogue, editable.
 *
 * While the collection is empty the public site still serves the courses
 * hardcoded in `content/courses.ts`, so this page leads with the import rather
 * than an empty state.
 */
export default async function CoursesAdminPage() {
  await requireAdmin();

  const courses = await listAllCourses();
  const live = courses?.filter((c) => c.published).length ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Courses"
        description="The catalogue behind /courses, the nav, the homepage grid and the enquiry form's course list. Topics are one per line and carry through to the course page syllabus."
      />

      {courses === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so courses cannot be loaded or edited. The
          public site keeps serving the {staticCourses.length} courses built into
          the site.
        </div>
      ) : (
        <>
          {courses.length === 0 ? (
            <Card className="border-navy-200 bg-navy-50/40">
              <h2 className="text-title text-navy-950">
                Import the current catalogue
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
                The site is currently serving the {staticCourses.length} courses
                built into the code. Import them once and they become editable
                here — every public page then reads from this dashboard.
              </p>
              <form action={seedCoursesAction} className="mt-5">
                <SubmitButton pendingLabel="Importing…">
                  Import {staticCourses.length} courses
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-title text-navy-950">New course</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              The title sets the URL and cannot be changed afterwards. Saving
              publishes straight to the live site.
            </p>
            <div className="mt-5">
              <CourseEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All courses{" "}
              <span className="text-base font-normal text-ink-500">
                ({courses.length}
                {courses.length ? `, ${live} live` : ""})
              </span>
            </h2>

            {courses.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                Nothing stored yet. Import the coded catalogue above, or add a
                course by hand.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {courses.map((course) => (
                  <CourseRow
                    key={course.slug}
                    course={course}
                    labCount={labsForCourse(course.slug).length}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
