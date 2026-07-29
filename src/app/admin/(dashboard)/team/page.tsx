import type { Metadata } from "next";

import { TeamEditor } from "@/app/admin/(dashboard)/team/TeamEditor";
import { TeamRow } from "@/app/admin/(dashboard)/team/TeamRow";
import { seedTeamAction } from "@/app/admin/_actions/team";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllTeam } from "@/lib/cms/team";

export const metadata: Metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

/**
 * Staff / team management.
 *
 * While the collection is empty the homepage and about page still render the
 * hardcoded founder from `content/about.ts`, so this page leads with the
 * import button rather than an empty state.
 */
export default async function TeamAdminPage() {
  await requireAdmin();

  const team = await listAllTeam();
  const live = team?.filter((m) => m.published).length ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Staff"
        description="The team behind SSS Academy. The first member marked as 'Founder' renders in the large FounderBlock on the homepage and about page. Everyone else appears in the about page team grid."
      />

      {team === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so staff cannot be loaded or edited. The
          public pages keep showing the hardcoded founder.
        </div>
      ) : (
        <>
          {team.length === 0 ? (
            <Card className="border-navy-200 bg-navy-50/40">
              <h2 className="text-title text-navy-950">
                Import the current founder
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
                The homepage and about page currently render a hardcoded founder
                bio. Import it here to make it editable, and add the rest of the
                team.
              </p>
              <form action={seedTeamAction} className="mt-5">
                <SubmitButton pendingLabel="Importing…">
                  Import founder
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-title text-navy-950">New member</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              Saving publishes straight to the live site. Photo is a path to a
              file in /public — there is no upload step.
            </p>
            <div className="mt-5">
              <TeamEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All members{" "}
              <span className="text-base font-normal text-ink-500">
                ({team.length}
                {team.length ? `, ${live} live` : ""})
              </span>
            </h2>

            {team.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                No staff stored yet. Import the founder above, or add a member
                by hand.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {team.map((member) => (
                  <TeamRow key={member.id} member={member} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
