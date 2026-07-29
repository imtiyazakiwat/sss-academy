import type { Metadata } from "next";

import { PlacementEditor } from "@/app/admin/(dashboard)/placements/PlacementEditor";
import { PlacementRow } from "@/app/admin/(dashboard)/placements/PlacementRow";
import { seedPlacementsAction } from "@/app/admin/_actions/placements";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllPlacements } from "@/lib/cms/placements";
import { placements as staticPlacements } from "@/content/placements";

export const metadata: Metadata = { title: "Placements" };
export const dynamic = "force-dynamic";

/**
 * Learner stories, editable.
 *
 * While the collection is empty the public page still serves the stories
 * hardcoded in `content/placements.ts`, so this page leads with the import
 * rather than an empty state — otherwise the dashboard would read as "no
 * placements" while the site shows 23 of them.
 */
export default async function PlacementsAdminPage() {
  await requireAdmin();

  const placements = await listAllPlacements();
  const live = placements?.filter((p) => p.published).length ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Placements"
        description="The learner stories on the public placements page. Each one carries a name, the role they were hired for, the package and their own words."
      />

      {placements === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so stories cannot be loaded or edited. The
          public page keeps serving the {staticPlacements.length} stories built
          into the site.
        </div>
      ) : (
        <>
          {placements.length === 0 ? (
            <Card className="border-navy-200 bg-navy-50/40">
              <h2 className="text-title text-navy-950">
                Import the current stories
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
                The placements page is currently serving the{" "}
                {staticPlacements.length} stories built into the site. Import
                them once and they become editable here — the public page then
                reads from this dashboard instead.
              </p>
              <form action={seedPlacementsAction} className="mt-5">
                <SubmitButton pendingLabel="Importing…">
                  Import {staticPlacements.length} stories
                </SubmitButton>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-title text-navy-950">New story</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              Saving publishes straight to the live site. There is no draft step —
              the audit log is the safety net.
            </p>
            <div className="mt-5">
              <PlacementEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All stories{" "}
              <span className="text-base font-normal text-ink-500">
                ({placements.length}
                {placements.length ? `, ${live} live` : ""})
              </span>
            </h2>

            {placements.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                Nothing stored yet. Import the built-in stories above, or add one
                by hand.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {placements.map((placement) => (
                  <PlacementRow key={placement.slug} placement={placement} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
